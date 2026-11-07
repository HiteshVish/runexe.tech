<?php
declare(strict_types=1);

/**
 * Shared building blocks for the invoice templates. Every template is plain
 * HTML + CSS limited to what mPDF supports (tables for layout, no flex/grid),
 * so the browser preview and the PDF render from identical markup.
 */

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function nl(?string $s): string
{
    return nl2br(e($s), false);
}

function money(array $inv, float $amount): string
{
    return e(format_money($amount, $inv['currency']));
}

function num(array $inv, float $amount): string
{
    return e(format_number($amount, $inv['currency']));
}

function qty(float $q): string
{
    return rtrim(rtrim(number_format($q, 3, '.', ','), '0'), '.');
}

function pct(float $p): string
{
    return rtrim(rtrim(number_format($p, 2, '.', ''), '0'), '.') . '%';
}

/** Label/value pairs for the invoice details box. */
function meta_rows(array $inv): array
{
    $rows = [
        'Invoice No.'  => $inv['number'],
        'Invoice Date' => $inv['date'],
    ];
    if ($inv['due_date'] !== '') {
        $rows['Due Date'] = $inv['due_date'];
    }
    if ($inv['terms_label'] !== '') {
        $rows['Terms'] = $inv['terms_label'];
    }
    if ($inv['reference'] !== '') {
        $rows['Reference / PO'] = $inv['reference'];
    }
    if ($inv['india'] && $inv['place_of_supply'] !== '') {
        $rows['Place of Supply'] = $inv['place_of_supply'];
    }
    if ($inv['mode'] === 'in_gst') {
        $rows['Reverse Charge'] = $inv['reverse_charge'] ? 'Yes' : 'No';
    }
    $rows['Currency'] = $inv['currency'];
    return $rows;
}

function partial_meta(array $inv, string $class = 'meta'): string
{
    $html = '<table class="' . e($class) . '">';
    foreach (meta_rows($inv) as $label => $value) {
        $html .= '<tr><td class="meta-label">' . e($label) . '</td><td class="meta-value">' . e($value) . '</td></tr>';
    }
    return $html . '</table>';
}

/** Identity lines for a party (seller, buyer or ship-to). */
function party_lines(array $inv, array $p, string $taxLabel): string
{
    $html = '';
    if ($p['address'] !== '') {
        $html .= '<div>' . nl($p['address']) . '</div>';
    }
    if ($p['country'] !== '' && stripos($p['address'], $p['country']) === false) {
        $html .= '<div>' . e($p['country']) . '</div>';
    }
    if (($p['state_label'] ?? '') !== '') {
        $html .= '<div>State: ' . e($p['state_label']) . '</div>';
    }
    if ($p['tax_id'] !== '') {
        $html .= '<div class="strong">' . e($taxLabel) . ': ' . e($p['tax_id']) . '</div>';
    } elseif ($inv['mode'] === 'in_gst' && $taxLabel === 'GSTIN') {
        $html .= '<div>GSTIN: Unregistered</div>';
    }
    if ($inv['india'] && ($p['pan'] ?? '') !== '') {
        $html .= '<div>PAN: ' . e($p['pan']) . '</div>';
    }
    $contact = array_filter([$p['email'], $p['phone'], $p['website'] ?? '']);
    if ($contact) {
        $html .= '<div>' . e(implode('  |  ', $contact)) . '</div>';
    }
    return $html;
}

function partial_party(array $inv, string $title, array $p, string $taxLabel): string
{
    return '<div class="party-title">' . e($title) . '</div>'
        . '<div class="party-name">' . e($p['name']) . '</div>'
        . '<div class="party-lines">' . party_lines($inv, $p, $taxLabel) . '</div>';
}

/** Bill To / Ship To as table cells; returns "<td>...</td>" fragments. */
function partial_parties_cells(array $inv, string $cellClass = 'party'): string
{
    $html = '<td class="' . e($cellClass) . '">'
        . partial_party($inv, 'Bill To', $inv['buyer'], $inv['buyer_tax_id_label']) . '</td>';
    if ($inv['ship']) {
        $html .= '<td class="' . e($cellClass) . '">'
            . partial_party($inv, 'Ship To', $inv['ship'], $inv['buyer_tax_id_label']) . '</td>';
    }
    return $html;
}

function partial_items(array $inv): string
{
    $amountLabel = $inv['india'] ? 'Taxable Value' : 'Amount';
    $html = '<table class="items"><thead><tr>'
        . '<th class="c-n">#</th><th class="c-desc">Description</th>';
    if ($inv['show_hsn']) {
        $html .= '<th class="c-hsn">HSN/SAC</th>';
    }
    $html .= '<th class="c-qty num">Qty</th><th class="c-rate num">Rate</th>';
    if ($inv['show_discount']) {
        $html .= '<th class="c-disc num">Disc.</th>';
    }
    if ($inv['show_tax_rate']) {
        $html .= '<th class="c-tax num">' . e($inv['tax_name']) . ' %</th>';
    }
    $html .= '<th class="c-amt num">' . e($amountLabel) . '</th></tr></thead><tbody>';

    foreach ($inv['items'] as $i => $it) {
        $unit = $it['unit'] !== '' ? ' ' . e($it['unit']) : '';
        $html .= '<tr class="' . ($i % 2 ? 'even' : 'odd') . '">'
            . '<td class="c-n">' . $it['n'] . '</td>'
            . '<td class="c-desc">' . nl($it['description']) . '</td>';
        if ($inv['show_hsn']) {
            $html .= '<td class="c-hsn">' . e($it['hsn']) . '</td>';
        }
        $html .= '<td class="c-qty num">' . qty($it['qty']) . $unit . '</td>'
            . '<td class="c-rate num">' . num($inv, $it['price']) . '</td>';
        if ($inv['show_discount']) {
            $html .= '<td class="c-disc num">' . ($it['discount'] > 0 ? pct($it['discount']) : '-') . '</td>';
        }
        if ($inv['show_tax_rate']) {
            $html .= '<td class="c-tax num">' . pct($it['rate']) . '</td>';
        }
        $html .= '<td class="c-amt num">' . num($inv, $it['taxable']) . '</td></tr>';
    }
    return $html . '</tbody></table>';
}

/** India only: tax breakdown per rate, as commonly printed on GST invoices. */
function partial_tax_summary(array $inv): string
{
    if (!$inv['india'] || !$inv['tax_summary']) {
        return '';
    }
    $inter = $inv['is_inter'];
    $html = '<table class="tax-summary"><thead><tr><th>GST Rate</th><th class="num">Taxable Value</th>';
    $html .= $inter
        ? '<th class="num">IGST</th>'
        : '<th class="num">CGST</th><th class="num">' . e($inv['sgst_label']) . '</th>';
    $html .= '<th class="num">Total Tax</th></tr></thead><tbody>';
    foreach ($inv['tax_summary'] as $row) {
        $html .= '<tr><td>' . pct((float) $row['rate']) . '</td><td class="num">' . num($inv, $row['taxable']) . '</td>';
        $html .= $inter
            ? '<td class="num">' . num($inv, $row['igst']) . '</td>'
            : '<td class="num">' . num($inv, $row['cgst']) . '</td><td class="num">' . num($inv, $row['sgst']) . '</td>';
        $html .= '<td class="num">' . num($inv, $row['tax']) . '</td></tr>';
    }
    return $html . '</tbody></table>';
}

function partial_totals(array $inv): string
{
    $rows = [['Subtotal', $inv['subtotal'], '']];
    if ($inv['discount_total'] > 0) {
        $rows[] = ['Discount', -$inv['discount_total'], ''];
    }
    if ($inv['taxed'] && ($inv['discount_total'] > 0 || $inv['india'])) {
        $rows[] = ['Taxable Value', $inv['taxable_total'], ''];
    }
    foreach ($inv['tax_lines'] as $line) {
        $rows[] = [$line['label'], $line['amount'], ''];
    }
    if ($inv['other_charges'] > 0) {
        $rows[] = [$inv['other_charges_label'], $inv['other_charges'], ''];
    }
    if ($inv['round_off'] != 0.0) {
        $rows[] = ['Round Off', $inv['round_off'], ''];
    }
    $rows[] = ['Total', $inv['grand_total'], 'grand'];
    if ($inv['amount_paid'] > 0) {
        $rows[] = ['Amount Paid', -$inv['amount_paid'], ''];
        $rows[] = ['Balance Due', $inv['balance_due'], 'balance'];
    }

    $html = '<table class="totals">';
    foreach ($rows as [$label, $amount, $class]) {
        $html .= '<tr class="' . $class . '"><td class="t-label">' . e($label) . '</td>'
            . '<td class="t-value num">' . money($inv, (float) $amount) . '</td></tr>';
    }
    return $html . '</table>';
}

/**
 * A titled block wrapped in a one-cell table: mPDF ignores margins on
 * elements inside table cells, but honours cell padding.
 */
function titled_block(string $title, string $content, string $titleClass = 'block-title'): string
{
    return '<table class="blk"><tr><td class="blk-cell"><div class="' . e($titleClass) . '">' . e($title) . '</div>'
        . $content . '</td></tr></table>';
}

function partial_words(array $inv): string
{
    return titled_block('Amount in Words', '<div class="words">' . e($inv['amount_words']) . '</div>');
}

function partial_payment(array $inv, string $titleClass = 'block-title', string $labelClass = 'b-label'): string
{
    if (!$inv['bank']) {
        return '';
    }
    $html = '<table class="bank">';
    foreach ($inv['bank'] as $label => $value) {
        $html .= '<tr><td class="' . e($labelClass) . '">' . e($label) . '</td><td class="b-value">' . e($value) . '</td></tr>';
    }
    return titled_block('Payment Details', $html . '</table>', $titleClass);
}

function partial_notes(array $inv): string
{
    if ($inv['notes'] === '') {
        return '';
    }
    return titled_block('Notes', '<div class="small">' . nl($inv['notes']) . '</div>');
}

/**
 * Top-level section whose heading is kept on the same page as its first
 * lines; the remaining lines flow normally so long text can still split.
 *
 * @param string[] $lines
 */
function keep_heading_section(string $title, array $lines): string
{
    $head = array_slice($lines, 0, 3);
    $rest = array_slice($lines, 3);
    $html = '<table class="keep" style="page-break-inside: avoid;"><tr><td>'
        . '<div class="block-title">' . e($title) . '</div><div class="small">'
        . implode('<br />', array_map('e', $head)) . '</div></td></tr></table>';
    if ($rest) {
        $html .= '<div class="small">' . implode('<br />', array_map('e', $rest)) . '</div>';
    }
    return $html;
}

function partial_terms(array $inv): string
{
    $html = '';
    if ($inv['terms'] !== '') {
        $html .= keep_heading_section('Terms & Conditions', preg_split('/\R/', $inv['terms']));
    }
    if ($inv['declaration']) {
        $html .= keep_heading_section('Declaration', $inv['declaration']);
    }
    return $html === '' ? '' : '<div class="terms">' . $html . '</div>';
}

function partial_signature(array $inv): string
{
    $img = $inv['signature']
        ? '<img class="sig-img" src="' . $inv['signature'] . '" alt="" />'
        : '&nbsp;';
    return '<table class="signature"><tr><td class="sig-gap"></td><td class="sig-cell">'
        . '<div class="sig-for">For ' . e($inv['seller']['name']) . '</div></td></tr>'
        . '<tr><td class="sig-gap"></td><td class="sig-space">' . $img . '</td></tr>'
        . '<tr><td class="sig-gap"></td><td class="sig-line">Authorised Signatory</td></tr></table>';
}

function partial_logo(array $inv, string $class = 'logo'): string
{
    return $inv['logo'] ? '<img class="' . e($class) . '" src="' . $inv['logo'] . '" alt="" />' : '';
}

function partial_title(array $inv): string
{
    $html = '<div class="doc-title">' . e(strtoupper($inv['title'])) . '</div>';
    if ($inv['subtitle'] !== '') {
        $html .= '<div class="doc-subtitle">' . e($inv['subtitle']) . '</div>';
    }
    return $html;
}

/**
 * Bottom section kept on one page: words, payment, notes on the left;
 * totals and signature on the right.
 */
function partial_bottom(array $inv, bool $includePayment = true): string
{
    $left = partial_words($inv)
        . ($includePayment ? partial_payment($inv) : '')
        . partial_notes($inv);
    return '<table class="bottom" style="page-break-inside: avoid;"><tr>'
        . '<td class="bottom-left">' . $left . '</td>'
        . '<td class="bottom-right">' . partial_totals($inv) . partial_signature($inv) . '</td>'
        . '</tr></table>';
}

/** CSS shared by every template; templates append their own look on top. */
function base_css(array $inv): string
{
    $a = $inv['accent'];
    return <<<CSS
body { font-family: dejavusans, 'DejaVu Sans', Helvetica, Arial, sans-serif; font-size: 8.6pt; color: #1f2328; line-height: 1.4; }
table { border-collapse: collapse; width: 100%; }
td, th { vertical-align: top; }
.num { text-align: right; white-space: nowrap; }
.strong { font-weight: bold; }
.small { font-size: 7.6pt; color: #4b5563; }
.muted { color: #6b7280; }
.doc-title { font-size: 22pt; font-weight: bold; color: $a; letter-spacing: 1pt; }
.doc-subtitle { font-size: 8pt; color: #6b7280; }
.party-title, .block-title { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8pt; color: $a; margin-bottom: 3pt; }
.blk-cell { padding: 9pt 0 0 0; }
.keep td { padding: 9pt 0 0 0; }
.party-name { font-size: 10pt; font-weight: bold; margin-bottom: 2pt; }
.party-lines { font-size: 8pt; color: #374151; }
.meta td { padding: 1.5pt 0; font-size: 8pt; }
.meta-label { color: #6b7280; padding-right: 8pt; white-space: nowrap; }
.meta-value { font-weight: bold; text-align: right; }
.items { margin-top: 12pt; }
.items th { font-size: 7.4pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4pt; padding: 6pt 5pt; text-align: left; }
.items th.num { text-align: right; }
.items td { padding: 6pt 5pt; border-bottom: 0.4pt solid #e5e7eb; }
.c-n { width: 5%; color: #6b7280; }
.c-hsn { width: 11%; }
.c-qty { width: 11%; }
.c-rate { width: 13%; }
.c-disc, .c-tax { width: 8%; }
.c-amt { width: 15%; }
.tax-summary { margin-top: 10pt; width: 100%; }
.tax-summary th { font-size: 7pt; text-transform: uppercase; color: #6b7280; padding: 3pt 5pt; border-bottom: 0.6pt solid #d1d5db; text-align: left; }
.tax-summary th.num { text-align: right; }
.tax-summary td { font-size: 7.8pt; padding: 3pt 5pt; border-bottom: 0.4pt solid #eef0f2; }
.bottom { margin-top: 12pt; }
.bottom-left { width: 55%; padding-right: 14pt; }
.bottom-right { width: 45%; }
.totals td { padding: 3.5pt 6pt; font-size: 8.6pt; }
.t-label { color: #4b5563; }
.totals tr.grand td { font-size: 11pt; font-weight: bold; }
.totals tr.balance td { font-weight: bold; }
.words { font-size: 8pt; font-weight: bold; }
.bank td { padding: 1.2pt 0; font-size: 7.8pt; }
.b-label { color: #6b7280; width: 32%; }
.sig-gap { width: 35%; }
.sig-cell { padding-top: 14pt; text-align: right; }
.sig-for { font-size: 8pt; font-weight: bold; }
.sig-space { height: 16mm; text-align: right; vertical-align: bottom; padding: 3pt 0; }
.sig-img { max-height: 20mm; max-width: 45mm; }
.sig-line { font-size: 7.4pt; color: #6b7280; border-top: 0.5pt solid #9ca3af; padding-top: 2pt; text-align: right; }
.terms { margin-top: 6pt; }
.logo { max-height: 18mm; max-width: 55mm; }
CSS;
}

function page_footer_text(array $inv): string
{
    return e($inv['seller']['name']) . '  |  ' . e(ucwords(strtolower($inv['title']))) . ' ' . e($inv['number']);
}

/**
 * @return array{css: string, body: string}
 */
function render_invoice(array $inv): array
{
    require_once __DIR__ . '/' . $inv['template'] . '.php';
    $fn = 'template_' . $inv['template'];
    return $fn($inv);
}
