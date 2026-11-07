<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/render.php';

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'errors' => ['Use POST.']]);
    exit;
}

[$invoice, $errors] = Invoice::build($_POST, $_FILES);

try {
    echo json_encode([
        'ok'     => true,
        'errors' => $errors,
        'html'   => invoice_preview_html($invoice),
        'totals' => [
            'subtotal'    => format_money($invoice['subtotal'], $invoice['currency']),
            'tax'         => format_money($invoice['tax_total'], $invoice['currency']),
            'grand_total' => format_money($invoice['grand_total'], $invoice['currency']),
            'balance_due' => format_money($invoice['balance_due'], $invoice['currency']),
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $ex) {
    error_log('Invoice preview failed: ' . $ex->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => ['Preview failed. Please try again.']]);
}
