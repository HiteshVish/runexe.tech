<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/regions.php';
require_once __DIR__ . '/lib/gst-config-loader.php';
require_once __DIR__ . '/lib/geo.php';
if (is_file(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

$gstLookupEnabled = gst_lookup_config()['enabled'];
$visitorCountry = visitor_country();

function state_options(bool $withExport = false): string
{
    $html = '<option value="">Select state</option>';
    foreach (INDIA_STATES as $code => $name) {
        $html .= '<option value="' . $code . '">' . $code . ' - ' . htmlspecialchars($name) . '</option>';
    }
    return $html;
}

/** Summary of a GST lookup with name/address pickers; filled in by app.js. */
function gst_card(string $party, string $modes): string
{
    global $gstLookupEnabled;
    if (!$gstLookupEnabled) {
        return '';
    }
    return '<div data-modes="' . $modes . '"><div class="gst-card" data-party="' . $party . '" hidden>'
        . '<div class="gst-card-head"><span class="gst-card-label">From GST records</span>'
        . '<strong class="gst-card-name"></strong><span class="gst-badge"></span></div>'
        . '<div class="gst-card-meta"></div>'
        . '<div class="gst-card-warn" hidden></div>'
        . '<div class="gst-choices">'
        . '<label class="gst-choice">Name on invoice<select class="gst-name-choice"></select></label>'
        . '<label class="gst-choice">Address<select class="gst-address-choice"></select></label>'
        . '</div></div></div>';
}
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
<title>Free Invoice Generator (International + India GST) — RunExe Technology</title>
<meta name="description" content="Create professional invoices for any country — no-tax invoices for Hong Kong, VAT invoices, and GST-compliant Indian tax invoices with CGST/SGST/IGST. Live preview, multi-page PDF, free." />
<link rel="canonical" href="https://runexe.tech/tools/invoice/" />
<link rel="icon" type="image/png" href="../../assets/runexe-logo.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<script>
(function(){
  try {
    var stored = localStorage.getItem('runexe-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
})();
</script>
<style>
:root{
  color-scheme:light;
  --bg:#FAFAFA;--bg-2:#FFFFFF;--bg-warm:#F4F2EF;
  --crimson:#8B1A1A;--crimson-soft:rgba(139,26,26,.08);--crimson-line:rgba(139,26,26,.28);
  --ink:#111111;--ink-60:rgba(17,17,17,.6);--ink-40:rgba(17,17,17,.4);
  --line:rgba(17,17,17,.08);--line-strong:rgba(17,17,17,.16);
  --ok:#2f9e44;
  --shadow:0 18px 40px -22px rgba(17,17,17,.22);
  --ease:cubic-bezier(.22,1,.36,1);
  --font-head:'Sora',sans-serif;--font-body:'Inter',sans-serif;--mono:'IBM Plex Mono',Menlo,monospace;
  --radius-sm:10px;--radius-md:16px;
}
html[data-theme="dark"]{
  color-scheme:dark;
  --bg:#0B0B0B;--bg-2:#161616;--bg-warm:#121110;
  --crimson:#D45C5C;--crimson-soft:rgba(212,92,92,.14);--crimson-line:rgba(212,92,92,.35);
  --ink:#F3F1EE;--ink-60:rgba(243,241,238,.62);--ink-40:rgba(243,241,238,.42);
  --line:rgba(255,255,255,.10);--line-strong:rgba(255,255,255,.18);
  --ok:#51cf66;
  --shadow:0 18px 40px -18px rgba(0,0,0,.6);
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-body);background:var(--bg);color:var(--ink);line-height:1.5;min-height:100vh}
a{color:inherit;text-decoration:none}
[hidden]{display:none!important}

.bar{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--line);background:var(--bg-2)}
.bar img{height:40px}
.bar a.back{font-size:.82rem;font-weight:600;color:var(--crimson)}

.container{max-width:1380px;margin:0 auto;padding:36px 22px 60px}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}
.kicker{font-size:.68rem;font-weight:600;letter-spacing:.35em;text-transform:uppercase;color:var(--crimson)}
.page-head h1{font-family:var(--font-head);font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;margin:8px 0}
.page-head h1 .cr{color:var(--crimson)}
.page-head .lead{color:var(--ink-60);max-width:640px}
.head-actions{display:flex;gap:10px;flex-wrap:wrap;flex-shrink:0}

.layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,560px);gap:26px;align-items:start}

.card{background:var(--bg-2);border:1px solid var(--line);border-radius:var(--radius-md);padding:22px 24px;margin-bottom:20px}
.card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.card-title{font-family:var(--font-head);font-size:1.02rem;font-weight:700;display:flex;align-items:center;gap:10px}
.card-title::before{content:'';display:inline-block;width:22px;height:1.5px;background:var(--crimson)}
.card-sub{font-size:.78rem;color:var(--ink-60)}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 18px}
.span-2{grid-column:span 2}
.form-group{display:flex;flex-direction:column;gap:6px}
.stack>*+*{margin-top:14px}
label,.label{color:var(--ink-60);font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
label .req{color:var(--crimson)}
.hint{color:var(--ink-40);font-size:.74rem;text-transform:none;letter-spacing:0;font-weight:400}
.hint.ok{color:var(--ok)}
.hint.err{color:var(--crimson)}
.geo-note{margin-top:10px}
.geo-note a{color:inherit}
.hint-btn{background:none;border:0;padding:0;margin-left:6px;font:inherit;color:var(--crimson);text-decoration:underline;cursor:pointer}

input[type="text"],input[type="email"],input[type="number"],input[type="date"],input[type="url"],textarea,select{
  background:var(--bg);border:1px solid var(--line-strong);border-radius:var(--radius-sm);color:var(--ink);
  font-family:inherit;font-size:.9rem;padding:10px 12px;outline:none;width:100%;
  transition:border-color .2s,box-shadow .2s,background-color .2s;
}
input:focus,textarea:focus,select:focus{border-color:var(--crimson);box-shadow:0 0 0 3px var(--crimson-soft);background:var(--bg-2)}
input::placeholder,textarea::placeholder{color:var(--ink-40)}
input:disabled,select:disabled{opacity:.6}
input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
input[type="number"]{-moz-appearance:textfield;appearance:textfield}
textarea{resize:vertical;min-height:70px;line-height:1.45}
.mono{font-family:var(--mono);letter-spacing:.02em}
.check{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--ink);text-transform:none;letter-spacing:0;font-weight:500;cursor:pointer}
.check input{width:16px;height:16px;accent-color:var(--crimson)}
.input-row{display:flex;gap:8px}
.input-row>input{flex:1;min-width:0}
.input-row>.btn{white-space:nowrap}
.gst-card{border:1px solid var(--crimson-line);background:var(--crimson-soft);border-radius:12px;padding:12px 14px;display:grid;gap:6px}
.gst-card-head{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px}
.gst-card-label{font-size:.66rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--crimson);width:100%}
.gst-card-name{font-size:.92rem}
.gst-badge{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid currentColor}
.gst-badge.ok{color:var(--ok)}
.gst-badge.err{color:var(--crimson)}
.gst-card-meta{font-size:.76rem;color:var(--ink-60)}
.gst-card-warn{font-size:.78rem;color:var(--crimson);font-weight:600}
.gst-choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 14px;margin-top:4px}
.gst-choices:not(:has(.gst-choice:not([hidden]))){display:none}
.gst-choice{display:grid;gap:4px;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-60)}
.gst-choice select{font-size:.82rem;text-transform:none;letter-spacing:0;font-weight:400}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;font-size:.85rem;font-weight:600;padding:10px 16px;border-radius:var(--radius-sm);border:1px solid var(--line-strong);background:var(--bg-2);color:var(--ink);cursor:pointer;transition:border-color .25s,color .25s,background-color .25s;white-space:nowrap}
.btn:hover{border-color:var(--crimson);color:var(--crimson)}
.btn:disabled{opacity:.55;cursor:wait}
.btn-outline{border-color:var(--crimson-line);color:var(--crimson);background:transparent}
.btn-outline:hover{background:var(--crimson-soft)}
.btn-sm{padding:7px 12px;font-size:.78rem}
.btn-primary{background:var(--crimson);border-color:var(--crimson);color:#fff}
.btn-primary:hover{color:#fff;box-shadow:0 14px 30px -12px var(--crimson)}
.btn-lg{padding:13px 24px;font-size:.95rem;border-radius:12px}
.btn-icon{background:var(--crimson-soft);color:var(--crimson);border:1px solid var(--crimson-line);width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1.05rem;line-height:1;flex-shrink:0}
.btn-icon:hover{background:var(--crimson);color:#fff}

/* Invoice type */
.mode-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mode-card{position:relative;display:block;border:1.5px solid var(--line-strong);border-radius:12px;padding:12px 14px;cursor:pointer;transition:border-color .2s,background-color .2s;text-transform:none;letter-spacing:0}
.mode-card input{position:absolute;opacity:0;pointer-events:none}
.mode-card strong{display:block;font-size:.88rem;color:var(--ink);font-weight:700}
.mode-card span{display:block;font-size:.74rem;color:var(--ink-60);font-weight:400;margin-top:2px}
.mode-card:hover{border-color:var(--crimson-line)}
.mode-card:has(input:checked){border-color:var(--crimson);background:var(--crimson-soft)}
.mode-card:has(input:focus-visible){box-shadow:0 0 0 3px var(--crimson-soft)}
.mode-extra{margin-top:16px;padding-top:16px;border-top:1px dashed var(--line-strong)}
.seg{display:inline-flex;border:1px solid var(--line-strong);border-radius:10px;overflow:hidden}
.seg label{padding:8px 14px;font-size:.8rem;text-transform:none;letter-spacing:0;color:var(--ink-60);cursor:pointer;font-weight:600}
.seg label:has(input:checked){background:var(--crimson);color:#fff}
.seg input{position:absolute;opacity:0;pointer-events:none}

/* Logo & signature */
.drop{border:1.5px dashed var(--line-strong);background:var(--bg);border-radius:var(--radius-sm);padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s;min-height:58px}
.drop:hover,.drop.dragover{border-color:var(--crimson);background:var(--crimson-soft)}
.drop img{max-height:40px;max-width:110px;object-fit:contain;background:#fff;border-radius:4px;padding:2px 4px;border:1px solid var(--line)}
.drop .drop-text{font-size:.8rem;color:var(--ink-60);flex:1}
.drop .drop-text strong{display:block;color:var(--ink);font-size:.84rem}

/* Items */
.table-wrap{overflow-x:auto;margin:0 -4px}
table.items{width:100%;border-collapse:separate;border-spacing:0 6px;min-width:760px}
table.items th{color:var(--ink-60);font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:4px 6px}
table.items th.num,table.items td.num{text-align:right}
table.items td{padding:0 4px;vertical-align:top}
table.items td input,table.items td textarea{padding:8px 9px;font-size:.86rem}
table.items td textarea{min-height:38px;height:38px;resize:none;overflow:hidden}
.row-amount{font-weight:700;font-size:.88rem;white-space:nowrap;padding-top:9px!important;text-align:right}
.items-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap}

/* Totals */
.totals-box{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.totals-row{display:flex;justify-content:space-between;padding:5px 0;font-size:.88rem}
.totals-row span:first-child{color:var(--ink-60)}
.totals-row b{font-weight:700}
.totals-row.grand{border-top:1.5px solid var(--crimson);margin-top:6px;padding-top:10px;font-family:var(--font-head);font-size:1.1rem}
.totals-row.grand b{color:var(--crimson)}

/* Design picker */
.tpl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.tpl{border:1.5px solid var(--line-strong);border-radius:12px;padding:8px;cursor:pointer;text-transform:none;letter-spacing:0;display:block}
.tpl:has(input:checked){border-color:var(--crimson);background:var(--crimson-soft)}
.tpl input{position:absolute;opacity:0;pointer-events:none}
.tpl .sk{height:74px;border-radius:6px;background:#fff;border:1px solid rgba(0,0,0,.08);position:relative;overflow:hidden}
.tpl .sk i{position:absolute;display:block;background:var(--accent,#8B1A1A)}
.tpl .sk b{position:absolute;display:block;background:#d9d9de;height:3px;border-radius:2px}
.tpl strong{display:block;font-size:.78rem;margin-top:6px;color:var(--ink);font-weight:600;text-align:center}
.swatches{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.swatch{width:28px;height:28px;border-radius:50%;border:2px solid var(--bg-2);box-shadow:0 0 0 1px var(--line-strong);cursor:pointer;padding:0}
.swatch.active{box-shadow:0 0 0 2px var(--crimson)}
.color-input{width:34px;height:34px;border:1px solid var(--line-strong);border-radius:8px;padding:2px;background:var(--bg);cursor:pointer}

/* Preview */
.preview-panel{position:sticky;top:16px}
.preview-card{padding:16px}
.preview-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.preview-status{font-size:.74rem;color:var(--ink-40)}
.preview-scroll{background:var(--bg-warm);border:1px solid var(--line);border-radius:12px;height:calc(100vh - 250px);min-height:420px;overflow:auto;padding:14px}
.preview-stage{transform-origin:top left;box-shadow:0 10px 30px -10px rgba(0,0,0,.35)}
.preview-stage iframe{display:block;border:0;width:794px;background:#fff}
.issues{margin-top:12px;font-size:.8rem;color:var(--ink-60);background:var(--bg);border:1px solid var(--line);border-left:3px solid var(--crimson);border-radius:10px;padding:10px 12px}
.issues strong{color:var(--ink);display:block;margin-bottom:4px;font-size:.8rem}
.issues ul{padding-left:16px}
.download-row{display:flex;gap:10px;margin-top:12px}
.download-row .btn-primary{flex:1}

@media (max-width:1180px){
  .layout{grid-template-columns:minmax(0,1fr)}
  .preview-panel{position:static}
  .preview-scroll{height:70vh}
}
@media (max-width:860px){
  .mode-grid,.tpl-grid{grid-template-columns:repeat(2,1fr)}
  .grid-2,.grid-3{grid-template-columns:1fr}
  .span-2{grid-column:auto}
  .page-head{flex-direction:column;align-items:flex-start}
}
@media (max-width:560px){
  .bar{padding:14px 18px}
  .bar img{height:34px}
  .container{padding:26px 14px 48px}
  .card{padding:18px 16px}
}
</style>
</head>
<body>

<div class="bar">
    <a href="../../"><img class="logo-light" src="../../assets/logo-trimmed.png" alt="RunExe Technology" /><img class="logo-dark" src="../../assets/logo-trimmed-dark.png" alt="" style="display:none" /></a>
    <a class="back" href="../../#tools">← Tools</a>
</div>

<div class="container">
    <header class="page-head">
        <div>
            <div class="kicker">Open source</div>
            <h1><span class="cr">Invoice</span> Generator</h1>
            <p class="lead">Professional invoices for any country — no-tax invoices (e.g. Hong Kong), VAT invoices, and GST-compliant Indian tax invoices. See it live, then download a multi-page PDF.</p>
        </div>
        <div class="head-actions">
            <button type="button" class="btn" id="sampleBtn">Load sample</button>
            <button type="button" class="btn btn-outline" id="clearBtn">Clear all</button>
        </div>
    </header>

    <div class="layout">
    <form id="invoiceForm" action="generate_pdf.php" method="POST" target="_blank" novalidate>
        <input type="hidden" name="logo_data" id="logo_data">
        <input type="hidden" name="signature_data" id="signature_data">

        <!-- Invoice type -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Invoice type</h2><span class="card-sub">Sets the title, tax rules and fields</span></div>
            <div class="mode-grid">
                <label class="mode-card"><input type="radio" name="mode" value="no_tax" checked><strong>No tax</strong><span>Hong Kong and other no-tax regions</span></label>
                <label class="mode-card"><input type="radio" name="mode" value="in_gst"><strong>India GST</strong><span>CGST + SGST or IGST, picked automatically</span></label>
                <label class="mode-card"><input type="radio" name="mode" value="in_export"><strong>India export</strong><span>Overseas client, under LUT or with IGST</span></label>
                <label class="mode-card"><input type="radio" name="mode" value="custom_tax"><strong>VAT / other tax</strong><span>Your own tax name and rates</span></label>
            </div>
            <p class="hint geo-note" id="geoNote" hidden><span></span> <a href="https://db-ip.com" target="_blank" rel="noopener">IP geolocation by DB-IP</a></p>

            <div class="mode-extra" data-modes="no_tax custom_tax">
                <div class="grid-3">
                    <div class="form-group" data-modes="custom_tax">
                        <label for="tax_name">Tax name</label>
                        <input type="text" id="tax_name" name="tax_name" value="VAT" placeholder="VAT, GST, Sales Tax">
                    </div>
                    <div class="form-group">
                        <label for="tax_id_label">Label for your tax / registration number</label>
                        <input type="text" id="tax_id_label" name="tax_id_label" value="Business Registration No." placeholder="e.g. BR No., VAT No., TRN, ABN">
                    </div>
                    <div class="form-group" data-modes="custom_tax">
                        <label for="default_rate_custom">Default tax rate (%)</label>
                        <input type="number" id="default_rate_custom" class="default-rate" value="5" min="0" max="100" step="any">
                    </div>
                </div>
            </div>

            <div class="mode-extra" data-modes="in_gst in_export">
                <div class="grid-3">
                    <div class="form-group" data-modes="in_export">
                        <span class="label">Export type</span>
                        <div class="seg">
                            <label><input type="radio" name="export_type" value="lut" checked>Under LUT (0% IGST)</label>
                            <label><input type="radio" name="export_type" value="igst">With IGST paid</label>
                        </div>
                    </div>
                    <div class="form-group" data-modes="in_export" data-export="lut">
                        <label for="lut_arn">LUT reference (ARN) <span class="req">*</span></label>
                        <input type="text" id="lut_arn" name="lut_arn" class="mono" placeholder="e.g. AD270326000123X">
                    </div>
                    <div class="form-group" data-gst-rate>
                        <label for="default_rate_gst">Default GST rate</label>
                        <select id="default_rate_gst" class="default-rate">
                            <option value="0">0%</option><option value="0.25">0.25%</option><option value="3">3%</option>
                            <option value="5">5%</option><option value="12">12%</option><option value="18" selected>18%</option>
                            <option value="28">28%</option><option value="40">40%</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>

        <!-- Invoice details -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Invoice details</h2></div>
            <div class="grid-3">
                <div class="form-group">
                    <label for="invoice_number">Invoice number <span class="req">*</span></label>
                    <input type="text" id="invoice_number" name="invoice_number" placeholder="INV-<?= date('Y') ?>-001" maxlength="40">
                    <span class="hint" data-modes="in_gst in_export">Max 16 characters: letters, numbers, - and /</span>
                </div>
                <div class="form-group">
                    <label for="invoice_date">Invoice date <span class="req">*</span></label>
                    <input type="date" id="invoice_date" name="invoice_date" value="<?= date('Y-m-d') ?>">
                </div>
                <div class="form-group">
                    <label for="currency">Currency</label>
                    <select id="currency" name="currency">
                        <?php foreach (CURRENCIES as $code => $c): ?>
                        <option value="<?= $code ?>"<?= $code === 'HKD' ? ' selected' : '' ?>><?= $code ?> — <?= htmlspecialchars($c['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment_terms">Payment terms</label>
                    <select id="payment_terms" name="payment_terms">
                        <option value="">None</option>
                        <option value="0">Due on receipt</option>
                        <option value="7">Net 7 days</option>
                        <option value="15" selected>Net 15 days</option>
                        <option value="30">Net 30 days</option>
                        <option value="45">Net 45 days</option>
                        <option value="60">Net 60 days</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="due_date">Due date</label>
                    <input type="date" id="due_date" name="due_date">
                </div>
                <div class="form-group">
                    <label for="reference">Reference / PO number</label>
                    <input type="text" id="reference" name="reference" placeholder="Optional">
                </div>
                <div class="form-group span-2" data-modes="in_gst">
                    <label for="place_of_supply">Place of supply <span class="req">*</span></label>
                    <select id="place_of_supply" name="place_of_supply"><?= state_options() ?></select>
                    <span class="hint" id="supplyHint">Filled from the client's GSTIN or state. Decides CGST + SGST vs IGST.</span>
                </div>
                <div class="form-group" data-modes="in_gst">
                    <label for="reverse_charge">Tax on reverse charge?</label>
                    <select id="reverse_charge" name="reverse_charge"><option value="no">No</option><option value="yes">Yes</option></select>
                </div>
            </div>
        </section>

        <!-- Seller -->
        <section class="card">
            <div class="card-header">
                <h2 class="card-title">From (your business)</h2>
                <label class="check"><input type="checkbox" id="rememberProfile" checked> Remember on this device</label>
            </div>
            <div class="stack">
                <div class="grid-2">
                    <div class="form-group">
                        <span class="label">Logo <span class="hint">(PNG or JPG, max 2 MB)</span></span>
                        <div class="drop" data-image="logo" tabindex="0" role="button" aria-label="Upload logo">
                            <img alt="" hidden>
                            <div class="drop-text"><strong>Upload logo</strong>Click or drop an image</div>
                            <button type="button" class="btn btn-sm" data-remove hidden>Remove</button>
                        </div>
                        <input type="file" accept="image/png,image/jpeg" data-file="logo" hidden>
                    </div>
                    <div class="form-group">
                        <label for="seller_name">Business name <span class="req">*</span></label>
                        <input type="text" id="seller_name" name="seller[name]" placeholder="e.g. Harbour Trading Ltd">
                    </div>
                </div>
                <div class="grid-3">
                    <div class="form-group" data-modes="in_gst in_export">
                        <label for="seller_tax_id">GSTIN <span class="req">*</span></label>
                        <div class="input-row">
                            <input type="text" id="seller_tax_id" name="seller[tax_id]" class="mono gstin" data-party="seller" maxlength="15" placeholder="27AAPFU0939F1ZV">
                            <button type="button" class="btn btn-sm gst-fetch" data-party="seller"<?= $gstLookupEnabled ? '' : ' hidden' ?>>Prefill</button>
                        </div>
                        <span class="hint gstin-hint" data-party="seller"></span>
                    </div>
                    <div class="form-group" data-modes="no_tax custom_tax">
                        <label for="seller_tax_id_intl" class="tax-id-label">Business Registration No.</label>
                        <input type="text" id="seller_tax_id_intl" name="seller[tax_id]" class="mono vat-input" data-party="seller" placeholder="Optional">
                        <span class="hint vat-hint" data-party="seller"></span>
                    </div>
                    <div class="form-group" data-modes="in_gst in_export">
                        <label for="seller_pan">PAN</label>
                        <input type="text" id="seller_pan" name="seller[pan]" class="mono" maxlength="10" placeholder="From GSTIN">
                    </div>
                    <div class="form-group" data-modes="in_gst in_export">
                        <label for="seller_state">State</label>
                        <select id="seller_state" name="seller[state]"><?= state_options() ?></select>
                    </div>
                    <div class="form-group" data-modes="no_tax custom_tax">
                        <label for="seller_country">Country</label>
                        <input type="text" id="seller_country" name="seller[country]" value="Hong Kong" list="countries">
                    </div>
                </div>
                <?= gst_card('seller', 'in_gst in_export') ?>
                <div class="form-group">
                    <label for="seller_address">Address</label>
                    <textarea id="seller_address" name="seller[address]" class="pin-input" data-party="seller" placeholder="Street, building, city"></textarea>
                    <span class="hint pin-hint" data-party="seller"></span>
                </div>
                <div class="grid-3">
                    <div class="form-group"><label for="seller_email">Email</label><input type="email" id="seller_email" name="seller[email]" placeholder="billing@company.com"></div>
                    <div class="form-group"><label for="seller_phone">Phone</label><input type="text" id="seller_phone" name="seller[phone]" placeholder="+852 2123 4567"></div>
                    <div class="form-group"><label for="seller_website">Website</label><input type="text" id="seller_website" name="seller[website]" placeholder="www.company.com"></div>
                </div>
            </div>
        </section>

        <!-- Buyer -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Bill to (client)</h2></div>
            <div class="stack">
                <div class="grid-3">
                    <div class="form-group">
                        <label for="buyer_name">Client name <span class="req">*</span></label>
                        <input type="text" id="buyer_name" name="buyer[name]" placeholder="Company or person">
                    </div>
                    <div class="form-group" data-modes="in_gst">
                        <label for="buyer_tax_id">Client GSTIN <span class="hint">(blank if unregistered)</span></label>
                        <div class="input-row">
                            <input type="text" id="buyer_tax_id" name="buyer[tax_id]" class="mono gstin" data-party="buyer" maxlength="15" placeholder="29AAGCB7383J1Z4">
                            <button type="button" class="btn btn-sm gst-fetch" data-party="buyer"<?= $gstLookupEnabled ? '' : ' hidden' ?>>Prefill</button>
                        </div>
                        <span class="hint gstin-hint" data-party="buyer"></span>
                    </div>
                    <div class="form-group" data-modes="no_tax custom_tax in_export">
                        <label for="buyer_tax_id_intl" class="buyer-tax-id-label">Client tax ID</label>
                        <input type="text" id="buyer_tax_id_intl" name="buyer[tax_id]" class="mono vat-input" data-party="buyer" placeholder="Optional">
                        <span class="hint vat-hint" data-party="buyer"></span>
                    </div>
                    <div class="form-group" data-modes="in_gst">
                        <label for="buyer_state">Client state</label>
                        <select id="buyer_state" name="buyer[state]"><?= state_options() ?></select>
                    </div>
                    <div class="form-group" data-modes="no_tax custom_tax in_export">
                        <label for="buyer_country">Country<span class="req" data-modes="in_export"> *</span></label>
                        <input type="text" id="buyer_country" name="buyer[country]" list="countries" placeholder="e.g. Hong Kong">
                    </div>
                </div>
                <?= gst_card('buyer', 'in_gst') ?>
                <div class="form-group">
                    <label for="buyer_address">Billing address</label>
                    <textarea id="buyer_address" name="buyer[address]" class="pin-input" data-party="buyer" placeholder="Street, building, city"></textarea>
                    <span class="hint pin-hint" data-party="buyer"></span>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label for="buyer_email">Email</label><input type="email" id="buyer_email" name="buyer[email]" placeholder="accounts@client.com"></div>
                    <div class="form-group"><label for="buyer_phone">Phone</label><input type="text" id="buyer_phone" name="buyer[phone]" placeholder="Optional"></div>
                </div>
                <label class="check"><input type="checkbox" id="ship_enabled" name="ship_enabled" value="1"> Ship / deliver to a different address</label>
                <div class="stack" id="shipFields" hidden>
                    <div class="grid-3">
                        <div class="form-group"><label for="ship_name">Ship-to name</label><input type="text" id="ship_name" name="ship[name]"></div>
                        <div class="form-group" data-modes="in_gst"><label for="ship_state">State</label><select id="ship_state" name="ship[state]"><?= state_options() ?></select></div>
                        <div class="form-group"><label for="ship_country">Country</label><input type="text" id="ship_country" name="ship[country]" list="countries"></div>
                    </div>
                    <div class="form-group"><label for="ship_address">Delivery address</label><textarea id="ship_address" name="ship[address]" class="pin-input" data-party="ship"></textarea><span class="hint pin-hint" data-party="ship"></span></div>
                </div>
            </div>
        </section>

        <!-- Items -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Items</h2><span class="card-sub">Descriptions can span several lines</span></div>
            <div class="table-wrap">
                <table class="items">
                    <thead><tr>
                        <th style="width:34%">Description</th>
                        <th style="width:11%" data-modes="in_gst in_export">HSN/SAC</th>
                        <th style="width:8%">Qty</th>
                        <th style="width:8%">Unit</th>
                        <th style="width:12%">Unit price</th>
                        <th style="width:8%">Disc. %</th>
                        <th style="width:8%" data-modes="in_gst in_export custom_tax" class="tax-col-label">Tax %</th>
                        <th style="width:12%" class="num">Amount</th>
                        <th style="width:4%"></th>
                    </tr></thead>
                    <tbody id="itemsBody"></tbody>
                </table>
            </div>
            <div class="items-foot">
                <button type="button" class="btn btn-outline" id="addItemBtn">+ Add item</button>
                <span class="hint">Tip: prices are before tax.</span>
            </div>
        </section>

        <!-- Totals -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Charges &amp; totals</h2></div>
            <div class="grid-2">
                <div class="stack">
                    <div class="grid-2">
                        <div class="form-group"><label for="other_charges_label">Other charges label</label><input type="text" id="other_charges_label" name="other_charges_label" placeholder="e.g. Courier"></div>
                        <div class="form-group"><label for="other_charges">Amount <span class="hint">(not taxed)</span></label><input type="number" id="other_charges" name="other_charges" min="0" step="0.01" placeholder="0.00"></div>
                    </div>
                    <div class="form-group"><label for="amount_paid">Amount already paid / deposit</label><input type="number" id="amount_paid" name="amount_paid" min="0" step="0.01" placeholder="0.00"></div>
                    <label class="check"><input type="checkbox" id="round_off" name="round_off" value="1"> Round the total to the nearest whole amount</label>
                </div>
                <div class="totals-box" aria-live="polite">
                    <div class="totals-row"><span>Subtotal</span><b id="tSubtotal">—</b></div>
                    <div class="totals-row" data-modes="in_gst in_export custom_tax"><span>Tax</span><b id="tTax">—</b></div>
                    <div class="totals-row grand"><span>Total</span><b id="tGrand">—</b></div>
                    <div class="totals-row" id="tBalanceRow" hidden><span>Balance due</span><b id="tBalance">—</b></div>
                </div>
            </div>
        </section>

        <!-- Payment -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Payment details</h2><span class="card-sub">Only filled fields are printed</span></div>
            <div class="grid-3">
                <div class="form-group"><label for="bank_account_name">Account name</label><input type="text" id="bank_account_name" name="bank[account_name]"></div>
                <div class="form-group"><label for="bank_name">Bank name</label><input type="text" id="bank_name" name="bank[bank_name]"></div>
                <div class="form-group"><label for="bank_account_number">Account number</label><input type="text" id="bank_account_number" name="bank[account_number]" class="mono"></div>
                <div class="form-group" data-modes="in_gst in_export"><label for="bank_ifsc">IFSC</label><input type="text" id="bank_ifsc" name="bank[ifsc]" class="mono" maxlength="11" placeholder="HDFC0000060"><span class="hint" id="ifscHint">Bank name fills in from the IFSC</span></div>
                <div class="form-group" data-modes="in_gst"><label for="bank_upi">UPI ID</label><input type="text" id="bank_upi" name="bank[upi]"></div>
                <div class="form-group" data-modes="no_tax custom_tax"><label for="bank_code">Bank code</label><input type="text" id="bank_code" name="bank[bank_code]" class="mono" placeholder="e.g. 004"></div>
                <div class="form-group" data-modes="no_tax custom_tax"><label for="bank_branch">Branch code</label><input type="text" id="bank_branch" name="bank[branch_code]" class="mono"></div>
                <div class="form-group" data-modes="no_tax custom_tax in_export"><label for="bank_swift">SWIFT / BIC</label><input type="text" id="bank_swift" name="bank[swift]" class="mono"></div>
                <div class="form-group" data-modes="custom_tax in_export"><label for="bank_iban">IBAN</label><input type="text" id="bank_iban" name="bank[iban]" class="mono"></div>
                <div class="form-group" data-modes="no_tax"><label for="bank_fps">FPS ID <span class="hint">(Hong Kong)</span></label><input type="text" id="bank_fps" name="bank[fps_id]" class="mono"></div>
            </div>
        </section>

        <!-- Notes -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Notes, terms &amp; signature</h2></div>
            <div class="grid-2">
                <div class="stack">
                    <div class="form-group"><label for="notes">Notes</label><textarea id="notes" name="notes" placeholder="e.g. Thank you for your business!"></textarea></div>
                    <div class="form-group"><label for="terms">Terms &amp; conditions</label><textarea id="terms" name="terms" rows="4" placeholder="e.g. Payment due within 15 days. Late payments may incur interest."></textarea></div>
                </div>
                <div class="form-group">
                    <span class="label">Signature or company chop <span class="hint">(optional)</span></span>
                    <div class="drop" data-image="signature" tabindex="0" role="button" aria-label="Upload signature">
                        <img alt="" hidden>
                        <div class="drop-text"><strong>Upload signature / chop</strong>PNG with transparent background works best</div>
                        <button type="button" class="btn btn-sm" data-remove hidden>Remove</button>
                    </div>
                    <input type="file" accept="image/png,image/jpeg" data-file="signature" hidden>
                </div>
            </div>
        </section>

        <!-- Design -->
        <section class="card">
            <div class="card-header"><h2 class="card-title">Design</h2></div>
            <div class="tpl-grid" id="tplGrid">
                <label class="tpl"><input type="radio" name="template" value="classic" checked>
                    <div class="sk"><b style="left:8px;top:10px;width:30%"></b><i style="right:8px;top:8px;width:26%;height:6px"></i><i style="left:8px;right:8px;top:34px;height:6px"></i><b style="left:8px;top:46px;width:80%"></b><b style="left:8px;top:54px;width:70%"></b><i style="right:8px;bottom:6px;width:30%;height:6px"></i></div>
                    <strong>Classic</strong></label>
                <label class="tpl"><input type="radio" name="template" value="modern">
                    <div class="sk"><i style="left:4px;right:4px;top:4px;height:18px;border-radius:3px"></i><b style="left:8px;top:28px;width:25%;height:10px;background:#eee"></b><b style="left:38%;top:28px;width:25%;height:10px;background:#eee"></b><b style="left:8px;top:46px;width:84%"></b><b style="left:8px;top:54px;width:74%"></b><i style="right:8px;bottom:6px;width:34%;height:7px"></i></div>
                    <strong>Modern</strong></label>
                <label class="tpl"><input type="radio" name="template" value="sidebar">
                    <div class="sk"><i style="left:4px;top:4px;width:32%;height:36px;border-radius:3px"></i><b style="left:42%;top:10px;width:40%"></b><b style="left:42%;top:18px;width:30%"></b><b style="left:8px;top:48px;width:84%"></b><b style="left:8px;top:56px;width:74%"></b></div>
                    <strong>Sidebar</strong></label>
                <label class="tpl"><input type="radio" name="template" value="minimal">
                    <div class="sk" style="border:1.5px solid #555"><i style="left:0;right:0;top:0;height:3px"></i><b style="left:34%;top:9px;width:32%;background:#555"></b><b style="left:0;right:0;top:20px;height:1px;background:#888"></b><b style="left:50%;top:20px;width:1px;height:20px;background:#888"></b><b style="left:0;right:0;top:40px;height:1px;background:#888"></b><b style="left:8px;top:50px;width:80%"></b></div>
                    <strong>Minimal ledger</strong></label>
            </div>
            <div class="form-group" style="margin-top:16px">
                <span class="label">Accent colour</span>
                <div class="swatches" id="swatches">
                    <?php foreach (['#8B1A1A', '#0F172A', '#1D4ED8', '#047857', '#B45309', '#6D28D9', '#BE123C', '#0F766E', '#374151'] as $c): ?>
                    <button type="button" class="swatch" data-color="<?= $c ?>" style="background:<?= $c ?>" aria-label="Accent <?= $c ?>"></button>
                    <?php endforeach; ?>
                    <input type="color" class="color-input" id="accentPicker" value="#8B1A1A" aria-label="Custom accent colour">
                    <input type="hidden" name="accent" id="accent" value="#8B1A1A">
                </div>
            </div>
        </section>
    </form>

    <aside class="preview-panel">
        <div class="card preview-card">
            <div class="preview-head">
                <h2 class="card-title">Live preview</h2>
                <span class="preview-status" id="previewStatus">Updating…</span>
            </div>
            <div class="preview-scroll" id="previewScroll">
                <div class="preview-stage" id="previewStage"><iframe id="previewFrame" title="Invoice preview" sandbox="allow-same-origin"></iframe></div>
            </div>
            <div class="issues" id="issues" hidden><strong>Before you download</strong><ul id="issuesList"></ul></div>
            <div class="download-row">
                <button type="button" class="btn btn-primary btn-lg" id="downloadBtn">Download PDF</button>
            </div>
        </div>
    </aside>
    </div>
</div>

<datalist id="countries">
    <option value="Hong Kong"><option value="India"><option value="Singapore"><option value="United Arab Emirates">
    <option value="United States"><option value="United Kingdom"><option value="China"><option value="Macau">
    <option value="Taiwan"><option value="Australia"><option value="Canada"><option value="Germany"><option value="Japan">
</datalist>

<template id="rowTemplate">
    <tr class="item-row">
        <td><textarea data-f="description" rows="1" placeholder="Item or service"></textarea></td>
        <td data-modes="in_gst in_export"><input type="text" data-f="hsn" class="mono" inputmode="numeric" placeholder="998313"></td>
        <td><input type="number" data-f="qty" value="1" min="0" step="any"></td>
        <td><input type="text" data-f="unit" placeholder="pcs"></td>
        <td><input type="number" data-f="price" min="0" step="0.01" placeholder="0.00"></td>
        <td><input type="number" data-f="discount" min="0" max="100" step="any" placeholder="0"></td>
        <td data-modes="in_gst in_export custom_tax"><input type="number" data-f="tax_rate" min="0" max="100" step="any"></td>
        <td class="row-amount">0.00</td>
        <td><button type="button" class="btn-icon" data-remove-row title="Remove item" aria-label="Remove item">&times;</button></td>
    </tr>
</template>

<script>window.INVOICE_CONFIG = { gstLookup: <?= $gstLookupEnabled ? 'true' : 'false' ?>, country: <?= json_encode($visitorCountry) ?> };</script>
<script src="app.js?v=<?= filemtime(__DIR__ . '/app.js') ?>"></script>
</body>
</html>
