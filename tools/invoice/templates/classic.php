<?php
declare(strict_types=1);

/** Classic: clean white layout, accent title, solid accent table header. */
function template_classic(array $inv): array
{
    $a = $inv['accent'];
    $on = $inv['on_accent'];
    $tint = $inv['accent_tint'];
    $s = $inv['seller'];

    $css = base_css($inv) . <<<CSS
.head td { vertical-align: top; }
.seller-name { font-size: 13pt; font-weight: bold; margin: 4pt 0 2pt; }
.head-right { text-align: right; width: 42%; }
.head-right .meta { width: 100%; margin-top: 8pt; }
.rule { border-top: 1.4pt solid $a; margin: 12pt 0 10pt; height: 1pt; }
.parties td.party { width: 50%; padding-right: 14pt; }
.items th { background-color: $a; color: $on; }
.items tr.even td { background-color: $tint; }
.totals tr.grand td { background-color: $a; color: $on; }
.totals tr.balance td { border-top: 0.8pt solid $a; color: $a; }
.tax-summary th { color: $a; }
CSS;

    $logo = partial_logo($inv);
    $body = '<table class="head"><tr><td>'
        . $logo
        . '<div class="seller-name">' . e($s['name']) . '</div>'
        . '<div class="party-lines">' . party_lines($inv, $s, $inv['tax_id_label']) . '</div>'
        . '</td><td class="head-right">' . partial_title($inv) . partial_meta($inv) . '</td></tr></table>'
        . '<div class="rule"></div>'
        . '<table class="parties"><tr>' . partial_parties_cells($inv) . '</tr></table>'
        . partial_items($inv)
        . partial_tax_summary($inv)
        . partial_bottom($inv)
        . partial_terms($inv);

    return ['css' => $css, 'body' => $body];
}
