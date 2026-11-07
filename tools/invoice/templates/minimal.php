<?php
declare(strict_types=1);

/** Minimal Ledger: fully boxed grid, formal look suited to statutory GST invoices. */
function template_minimal(array $inv): array
{
    $a = $inv['accent'];
    $tint = $inv['accent_tint'];
    $s = $inv['seller'];
    $line = '0.6pt solid #374151';

    $css = base_css($inv) . <<<CSS
body { color: #111111; }
.frame { border-top: 2.4pt solid $a; }
.title-row td { text-align: center; padding: 4mm 0 3mm; border-bottom: $line; }
.doc-title { color: #111111; font-size: 16pt; letter-spacing: 3pt; }
.grid td { border-bottom: $line; padding: 3mm; width: 50%; }
.grid td.l { border-right: $line; }
.party-title, .block-title { color: $a; }
.seller-name { font-size: 11pt; font-weight: bold; margin: 2pt 0; }
.items { margin-top: 0; }
.items th { border: $line; background-color: $tint; color: #111111; }
.items td { border-left: $line; border-right: $line; border-bottom: 0.3pt solid #d1d5db; }
.items tbody tr:last-child td { border-bottom: $line; }
.tax-summary { width: 100%; margin-top: 0; }
.tax-summary th, .tax-summary td { border: $line; color: #111111; }
.bottom { margin-top: 0; }
.bottom-left, .bottom-right { border: $line; padding: 3mm; }
.totals td { border-bottom: 0.3pt solid #d1d5db; }
.totals tr.grand td { border-top: $line; border-bottom: 1.6pt double #111111; }
.terms { border: $line; border-top: 0; padding: 0 3mm 3mm; margin-top: 0; }
CSS;

    $sellerCell = '<td class="l">' . partial_logo($inv)
        . '<div class="party-title">Supplier</div><div class="seller-name">' . e($s['name']) . '</div>'
        . '<div class="party-lines">' . party_lines($inv, $s, $inv['tax_id_label']) . '</div></td>';
    $metaCell = '<td><div class="party-title">Invoice Details</div>' . partial_meta($inv) . '</td>';

    $buyerCell = '<td class="l">' . partial_party($inv, 'Bill To', $inv['buyer'], $inv['buyer_tax_id_label']) . '</td>';
    $shipCell = $inv['ship']
        ? '<td>' . partial_party($inv, 'Ship To', $inv['ship'], $inv['buyer_tax_id_label']) . '</td>'
        : '<td><div class="party-title">Ship To</div><div class="party-lines">Same as billing address</div></td>';

    $body = '<div class="frame"><table><tr class="title-row"><td>' . partial_title($inv) . '</td></tr></table>'
        . '<table class="grid"><tr>' . $sellerCell . $metaCell . '</tr><tr>' . $buyerCell . $shipCell . '</tr></table>'
        . '</div>'
        . partial_items($inv)
        . partial_tax_summary($inv)
        . partial_bottom($inv)
        . partial_terms($inv);

    return ['css' => $css, 'body' => $body];
}
