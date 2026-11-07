<?php
declare(strict_types=1);

require_once __DIR__ . '/Invoice.php';
require_once __DIR__ . '/../templates/partials.php';

use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

const PAGE_MARGIN_MM = ['top' => 14, 'right' => 14, 'bottom' => 18, 'left' => 14];

function invoice_filename(array $inv): string
{
    $safe = preg_replace('/[^A-Za-z0-9_\-]+/', '_', $inv['number']) ?: 'draft';
    return 'Invoice_' . $safe . '.pdf';
}

function invoice_output_pdf(array $inv): void
{
    require_once __DIR__ . '/../vendor/autoload.php';

    $tmp = sys_get_temp_dir() . '/mpdf';
    if (!is_dir($tmp)) {
        @mkdir($tmp, 0700, true);
    }

    $mpdf = new Mpdf([
        'mode'          => 'utf-8',
        'format'        => 'A4',
        'margin_top'    => PAGE_MARGIN_MM['top'],
        'margin_right'  => PAGE_MARGIN_MM['right'],
        'margin_bottom' => PAGE_MARGIN_MM['bottom'],
        'margin_left'   => PAGE_MARGIN_MM['left'],
        'margin_footer' => 7,
        'default_font'  => 'dejavusans',
        'tempDir'       => $tmp,
    ]);
    $mpdf->SetTitle(ucwords(strtolower($inv['title'])) . ' ' . $inv['number']);
    $mpdf->SetAuthor($inv['seller']['name']);
    $mpdf->SetCreator('RunExe Invoice Generator');
    $mpdf->SetHTMLFooter(
        '<table width="100%" style="font-family: dejavusans; font-size: 7pt; color: #6b7280;"><tr>'
        . '<td>' . page_footer_text($inv) . '</td>'
        . '<td style="text-align: right;">Page {PAGENO} of {nbpg}</td></tr></table>'
    );

    $rendered = render_invoice($inv);
    $mpdf->WriteHTML($rendered['css'], HTMLParserMode::HEADER_CSS);
    $mpdf->WriteHTML($rendered['body'], HTMLParserMode::HTML_BODY);
    $mpdf->Output(invoice_filename($inv), Destination::INLINE);
}

/** A standalone HTML page that mimics one A4 sheet, for the on-screen preview. */
function invoice_preview_html(array $inv): string
{
    $rendered = render_invoice($inv);
    $m = PAGE_MARGIN_MM;
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
        . $rendered['css']
        . "html { background: transparent; } body { margin: 0; }"
        . ".sheet { width: 210mm; min-height: 297mm; box-sizing: border-box; background: #fff;"
        . " padding: {$m['top']}mm {$m['right']}mm {$m['bottom']}mm {$m['left']}mm; position: relative; }"
        . ".sheet-footer { position: absolute; left: {$m['left']}mm; right: {$m['right']}mm; bottom: 7mm;"
        . " font-size: 7pt; color: #6b7280; }"
        . '</style></head><body><div class="sheet">'
        . $rendered['body']
        . '<div class="sheet-footer">' . page_footer_text($inv) . '</div>'
        . '</div></body></html>';
}

function render_error_page(string $title, array $messages, int $status = 422): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $items = implode('', array_map(fn($m) => '<li>' . e($m) . '</li>', $messages));
    $title = e($title);
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{$title} — RunExe Invoice Generator</title>
<link rel="icon" type="image/png" href="../../assets/runexe-logo.png" />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
<script>
(function(){try{var s=localStorage.getItem('runexe-theme');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
<style>
:root{--bg:#FAFAFA;--bg-2:#fff;--crimson:#8B1A1A;--ink:#111;--ink-60:rgba(17,17,17,.6);--line:rgba(17,17,17,.08)}
html[data-theme="dark"]{--bg:#0B0B0B;--bg-2:#161616;--crimson:#D45C5C;--ink:#F3F1EE;--ink-60:rgba(243,241,238,.62);--line:rgba(255,255,255,.1)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:var(--bg-2);border:1px solid var(--line);border-left:3px solid var(--crimson);border-radius:16px;padding:28px 32px;max-width:560px;width:100%}
.kicker{font-size:.68rem;font-weight:600;letter-spacing:.35em;text-transform:uppercase;color:var(--crimson)}
h1{font-family:Sora,sans-serif;font-size:1.5rem;margin:8px 0 14px}
ul{padding-left:18px;color:var(--ink-60);line-height:1.7}
a{display:inline-block;margin-top:20px;padding:10px 18px;border-radius:10px;background:var(--crimson);color:#fff;text-decoration:none;font-weight:600;font-size:.88rem}
</style>
</head>
<body>
<div class="card">
  <div class="kicker">Invoice Generator</div>
  <h1>{$title}</h1>
  <ul>{$items}</ul>
  <a href="javascript:history.back()">&larr; Back to the form</a>
</div>
</body>
</html>
HTML;
}
