<?php
declare(strict_types=1);

/** Sidebar: accent side panel with the seller's identity and payment details. */
function template_sidebar(array $inv): array
{
    $a = $inv['accent'];
    $on = $inv['on_accent'];
    $tint = $inv['accent_tint'];
    $s = $inv['seller'];

    $css = base_css($inv) . <<<CSS
.top td { vertical-align: top; }
.side { width: 36%; background-color: $a; color: $on; padding: 6mm 5mm; border-radius: 3mm; }
.side-name { font-size: 13pt; font-weight: bold; color: $on; padding: 3mm 0 2mm; }
.side-lines { font-size: 8pt; color: $on; }
.side-title { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8pt; color: $on; margin-bottom: 3pt; }
.side-label { color: $on; width: 32%; }
.side .bank td { color: $on; }
.logo-box { background-color: #ffffff; border-radius: 2mm; padding: 2mm 3mm; }
.main { padding-left: 7mm; }
.main .meta { margin-top: 5mm; }
.main .party { padding-top: 6mm; }
.items th { color: $a; border-bottom: 1.2pt solid $a; }
.items tr.even td { background-color: $tint; }
.totals tr.grand td { color: $a; border-top: 1.2pt solid $a; border-bottom: 1.2pt solid $a; font-size: 12pt; }
.totals tr.balance td { background-color: $tint; }
CSS;

    $identity = ($inv['logo'] ? '<span class="logo-box">' . partial_logo($inv) . '</span>' : '')
        . '<div class="side-name">' . e($s['name']) . '</div>'
        . '<div class="side-lines">' . party_lines($inv, $s, $inv['tax_id_label']) . '</div>'
        . partial_payment($inv, 'side-title', 'side-label');

    $parties = '<table><tr>' . partial_parties_cells($inv) . '</tr></table>';

    $body = '<table class="top"><tr>'
        . '<td class="side">' . $identity . '</td>'
        . '<td class="main">' . partial_title($inv) . partial_meta($inv) . $parties . '</td>'
        . '</tr></table>'
        . partial_items($inv)
        . partial_tax_summary($inv)
        . partial_bottom($inv, false)
        . partial_terms($inv);

    return ['css' => $css, 'body' => $body];
}
