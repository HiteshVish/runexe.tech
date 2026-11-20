<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/render.php';

ini_set('display_errors', '0');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: ./');
    exit;
}

[$invoice, $errors] = Invoice::build($_POST, $_FILES);

if ($errors) {
    render_error_page('Please fix these details', $errors);
    exit;
}

try {
    invoice_output_pdf($invoice);
} catch (Throwable $ex) {
    error_log('Invoice PDF generation failed: ' . $ex->getMessage());
    render_error_page('The PDF could not be generated', ['Something went wrong on our side. Please try again in a moment.'], 500);
}
