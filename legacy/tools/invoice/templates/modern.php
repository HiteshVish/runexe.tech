<?php
declare(strict_types=1);

/** Modern Header: solid accent banner, tinted party cards, highlighted total bar. */
function template_modern(array $inv): array
{
    $a = $inv['accent'];
    $on = $inv['on_accent'];
    $tint = $inv['accent_tint'];
    $soft = $inv['accent_soft'];
    $s = $inv['seller'];

    $css = base_css($inv) . <<<CSS
.banner { background-color: $a; color: $on; border-radius: 3mm; padding: 6mm 7mm; }
.banner td { color: $on; vertical-align: middle; }
.banner .doc-title { color: $on; font-size: 24pt; }
.banner .doc-subtitle { color: $on; }
.banner .seller-name { font-size: 14pt; font-weight: bold; color: $on; }
.logo-box { background-color: #ffffff; border-radius: 2mm; padding: 2mm 3mm; }
.banner-right { text-align: right; width: 45%; }
.banner-meta { font-size: 8pt; color: $on; margin-top: 3pt; }
.cards { margin-top: 8mm; }
.cards td.party, .cards td.card { background-color: $tint; padding: 4mm; border-left: 1.4mm solid #ffffff; border-right: 1.4mm solid #ffffff; }
.cards td.first { border-left: 0; }
.cards td.last { border-right: 0; }
.cards .meta td { font-size: 7.8pt; }
.items th { color: $a; background-color: $tint; border-bottom: 1pt solid $a; }
.items tr.even td { background-color: #fafafa; }
.totals tr.grand td { background-color: $a; color: $on; font-size: 12pt; }
.totals tr.balance td { background-color: $soft; }
CSS;

    $identity = $inv['logo']
        ? '<span class="logo-box">' . partial_logo($inv) . '</span>'
        : '<div class="seller-name">' . e($s['name']) . '</div>';

    $seller = '<td class="card first">'
        . partial_party($inv, 'From', $s, $inv['tax_id_label']) . '</td>';
    $parties = partial_parties_cells($inv);
    $details = '<td class="card last" style="width: 30%;"><div class="party-title">Invoice Details</div>'
        . partial_meta($inv) . '</td>';

    $body = '<div class="banner"><table><tr><td>' . $identity . '</td>'
        . '<td class="banner-right">' . partial_title($inv)
        . '<div class="banner-meta">No. ' . e($inv['number']) . '  |  ' . e($inv['date']) . '</div></td></tr></table></div>'
        . '<table class="cards"><tr>' . $seller . $parties . $details . '</tr></table>'
        . partial_items($inv)
        . partial_tax_summary($inv)
        . partial_bottom($inv)
        . partial_terms($inv);

    return ['css' => $css, 'body' => $body];
}
