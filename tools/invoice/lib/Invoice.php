<?php
declare(strict_types=1);

require_once __DIR__ . '/regions.php';

/**
 * Turns the submitted form into a validated, fully calculated invoice array
 * that every template renders from. Preview and PDF both go through here.
 */
final class Invoice
{
    public const TEMPLATES = ['classic', 'modern', 'sidebar', 'minimal'];
    private const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    private const MAX_QTY = 1e9;
    private const MAX_PRICE = 1e12;
    private const MAX_TOTAL = 1e13;

    /** @var string[] */
    private array $errors = [];
    private array $post;

    private function __construct(array $post)
    {
        $this->post = $post;
    }

    /**
     * @return array{0: array, 1: string[]} [invoice data, validation errors]
     */
    public static function build(array $post, array $files): array
    {
        $self = new self($post);
        $data = $self->assemble($files);
        return [$data, $self->errors];
    }

    private function str(string $key, string $default = '', ?array $source = null, int $max = 500): string
    {
        $source ??= $this->post;
        $value = $source[$key] ?? $default;
        if (!is_scalar($value)) {
            return $default;
        }
        $value = trim(str_replace("\r", '', (string) $value));
        return mb_substr($value, 0, $max);
    }

    private function num(string $key, float $default = 0.0, ?array $source = null): float
    {
        $source ??= $this->post;
        $value = $source[$key] ?? '';
        if (is_string($value)) {
            $value = str_replace([',', ' '], '', $value);
        }
        if (!is_numeric($value)) {
            return $default;
        }
        $number = (float) $value;
        return is_finite($number) ? $number : $default;
    }

    private function party(string $key): array
    {
        $src = is_array($this->post[$key] ?? null) ? $this->post[$key] : [];
        return [
            'name'    => $this->str('name', '', $src, 200),
            'address' => $this->str('address', '', $src, 600),
            'country' => $this->str('country', '', $src, 80),
            'state'   => $this->str('state', '', $src, 2),
            'tax_id'  => strtoupper($this->str('tax_id', '', $src, 40)),
            'pan'     => strtoupper($this->str('pan', '', $src, 10)),
            'email'   => $this->str('email', '', $src, 150),
            'phone'   => $this->str('phone', '', $src, 60),
            'website' => $this->str('website', '', $src, 150),
        ];
    }

    /**
     * Accepts either a regular upload or a "data:" URL posted as "{field}_data"
     * (the form sends data URLs so the live preview doesn't re-upload files).
     * Images are kept in memory and embedded, so no temp files are left behind.
     */
    private function image(array $files, string $field, string $label): ?string
    {
        $bytes = null;
        $file = $files[$field] ?? null;
        if (is_array($file) && ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
                $this->errors[] = "$label could not be uploaded.";
                return null;
            }
            $bytes = file_get_contents($file['tmp_name']);
        } else {
            $dataUrl = $this->post[$field . '_data'] ?? '';
            if (!is_string($dataUrl) || $dataUrl === '') {
                return null;
            }
            $comma = strpos($dataUrl, ',');
            $prefix = $comma === false ? '' : substr($dataUrl, 0, $comma);
            if (!in_array($prefix, ['data:image/png;base64', 'data:image/jpeg;base64'], true)) {
                $this->errors[] = "$label must be a PNG or JPG image.";
                return null;
            }
            $bytes = base64_decode(substr($dataUrl, $comma + 1), true);
        }
        if ($bytes === false || $bytes === null) {
            $this->errors[] = "$label could not be read.";
            return null;
        }
        if (strlen($bytes) > self::MAX_IMAGE_BYTES) {
            $this->errors[] = "$label must be 2 MB or smaller.";
            return null;
        }
        $info = @getimagesizefromstring($bytes);
        if (!$info || !in_array($info['mime'], ['image/png', 'image/jpeg'], true)) {
            $this->errors[] = "$label must be a PNG or JPG image.";
            return null;
        }
        return 'data:' . $info['mime'] . ';base64,' . base64_encode($bytes);
    }

    private static function formatDate(string $ymd): string
    {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $ymd);
        return $dt ? $dt->format('d M Y') : '';
    }

    private function assemble(array $files): array
    {
        $mode = $this->str('mode', 'no_tax');
        if (!isset(INVOICE_MODES[$mode])) {
            $mode = 'no_tax';
        }
        $modeInfo = INVOICE_MODES[$mode];
        $india = $modeInfo['india'];
        $taxed = $modeInfo['taxed'];

        $template = $this->str('template', 'classic');
        if (!in_array($template, self::TEMPLATES, true)) {
            $template = 'classic';
        }
        $accent = strtoupper($this->str('accent', '#8B1A1A'));
        if (!preg_match('/^#[0-9A-F]{6}$/', $accent)) {
            $accent = '#8B1A1A';
        }

        $currency = strtoupper($this->str('currency', $modeInfo['currency']));
        if (!isset(CURRENCIES[$currency])) {
            $currency = $modeInfo['currency'];
        }

        $seller = $this->party('seller');
        $buyer = $this->party('buyer');
        $ship = null;
        if (!empty($this->post['ship_enabled'])) {
            $ship = $this->party('ship');
            if ($ship['name'] === '' && $ship['address'] === '') {
                $ship = null;
            }
        }

        // ---- Invoice details ----
        $number = $this->str('invoice_number', '', null, 40);
        $date = $this->str('invoice_date', date('Y-m-d'), null, 10);
        $dueDate = $this->str('due_date', '', null, 10);
        $termsDays = $this->str('payment_terms', '', null, 10);
        if ($dueDate === '' && ctype_digit($termsDays) && ($d = DateTimeImmutable::createFromFormat('!Y-m-d', $date))) {
            $dueDate = $d->modify("+{$termsDays} days")->format('Y-m-d');
        }
        $termsLabel = match ($termsDays) {
            '0' => 'Due on receipt',
            '7', '15', '30', '45', '60' => "Net $termsDays days",
            default => '',
        };

        if ($number === '') {
            $this->errors[] = 'Invoice number is required.';
        } elseif ($india) {
            if (mb_strlen($number) > 16) {
                $this->errors[] = 'Invoice number must be 16 characters or fewer for a GST invoice.';
            } elseif (!preg_match('#^[A-Za-z0-9/\-]+$#', $number)) {
                $this->errors[] = 'Invoice number may only use letters, numbers, "-" and "/" for a GST invoice.';
            }
        }
        if (!self::formatDate($date)) {
            $this->errors[] = 'Invoice date is invalid.';
        }
        if ($dueDate !== '' && !self::formatDate($dueDate)) {
            $this->errors[] = 'Due date is invalid.';
        }
        if ($seller['name'] === '') {
            $this->errors[] = 'Your business name is required.';
        }
        if ($buyer['name'] === '') {
            $this->errors[] = 'Client name is required.';
        }
        foreach (['seller' => $seller, 'buyer' => $buyer] as $who => $p) {
            if ($p['email'] !== '' && !filter_var($p['email'], FILTER_VALIDATE_EMAIL)) {
                $this->errors[] = ($who === 'seller' ? 'Your' : 'Client') . ' email address is invalid.';
            }
        }

        // ---- Tax regime ----
        $taxName = 'Tax';
        $taxIdLabel = $this->str('tax_id_label', $mode === 'no_tax' ? 'Business Registration No.' : 'VAT No.', null, 40);
        $buyerTaxIdLabel = $taxIdLabel;
        $sellerStateCode = null;
        $buyerStateCode = null;
        $posCode = null;
        $isInter = false;
        $exportType = $this->str('export_type', 'lut') === 'igst' ? 'igst' : 'lut';
        $lutArn = strtoupper($this->str('lut_arn', '', null, 40));
        $reverseCharge = $this->str('reverse_charge') === 'yes';
        $sgstLabel = 'SGST';

        if ($mode === 'custom_tax') {
            $taxName = $this->str('tax_name', 'VAT', null, 20) ?: 'VAT';
        }

        if ($india) {
            $taxName = 'GST';
            $taxIdLabel = 'GSTIN';
            $seller['country'] = 'India';
            $seller['tax_id'] = gstin_normalize($seller['tax_id']);
            if ($seller['tax_id'] === '') {
                $this->errors[] = 'Your GSTIN is required for a GST invoice.';
            } elseif ($err = gstin_error($seller['tax_id'])) {
                $this->errors[] = "Your GSTIN $err.";
            } else {
                $sellerStateCode = gstin_state_code($seller['tax_id']);
                if ($seller['pan'] === '') {
                    $seller['pan'] = gstin_pan($seller['tax_id']);
                }
            }
            if ($sellerStateCode === null && isset(INDIA_STATES[$seller['state']])) {
                $sellerStateCode = $seller['state'];
            }
        }

        if ($mode === 'in_gst') {
            $buyerTaxIdLabel = 'GSTIN';
            $buyer['country'] = $buyer['country'] ?: 'India';
            $buyer['tax_id'] = gstin_normalize($buyer['tax_id']);
            if ($buyer['tax_id'] !== '') {
                if ($err = gstin_error($buyer['tax_id'])) {
                    $this->errors[] = "Client GSTIN $err.";
                } else {
                    $buyerStateCode = gstin_state_code($buyer['tax_id']);
                    if ($buyer['pan'] === '') {
                        $buyer['pan'] = gstin_pan($buyer['tax_id']);
                    }
                }
            }
            if ($buyerStateCode === null && isset(INDIA_STATES[$buyer['state']])) {
                $buyerStateCode = $buyer['state'];
            }
            $posCode = $this->str('place_of_supply', '', null, 2);
            if (!isset(INDIA_STATES[$posCode])) {
                $posCode = $buyerStateCode;
            }
            if ($posCode === null) {
                $this->errors[] = 'Place of supply is required. Choose the client\'s state or enter their GSTIN.';
            }
            if ($sellerStateCode !== null && $posCode !== null) {
                $isInter = $sellerStateCode !== $posCode;
            }
            if (in_array($sellerStateCode, UTGST_STATE_CODES, true)) {
                $sgstLabel = 'UTGST';
            }
        } elseif ($mode === 'in_export') {
            $buyerTaxIdLabel = 'Tax ID';
            $posCode = PLACE_OF_SUPPLY_EXPORT;
            $isInter = true;
            if ($buyer['country'] === '' || strcasecmp($buyer['country'], 'India') === 0) {
                $this->errors[] = 'Client country is required for an export invoice and must be outside India.';
            }
            if ($exportType === 'lut' && $lutArn === '') {
                $this->errors[] = 'LUT reference (ARN) is required when exporting without paying IGST.';
            }
        }

        // ---- Line items ----
        $items = [];
        $rawItems = is_array($this->post['items'] ?? null) ? $this->post['items'] : [];
        $row = 0;
        foreach ($rawItems as $raw) {
            if (!is_array($raw)) {
                continue;
            }
            $desc = $this->str('description', '', $raw, 1000);
            $hsn = $this->str('hsn', '', $raw, 12);
            $qty = $this->num('qty', 0, $raw);
            $price = $this->num('price', 0, $raw);
            if ($desc === '' && $hsn === '' && $price == 0.0) {
                continue;
            }
            $row++;
            $discount = max(0.0, min(100.0, $this->num('discount', 0, $raw)));
            $rate = $taxed ? max(0.0, min(100.0, $this->num('tax_rate', 0, $raw))) : 0.0;
            if ($mode === 'in_export' && $exportType === 'lut') {
                $rate = 0.0;
            }

            if ($desc === '') {
                $this->errors[] = "Item $row: description is required.";
            }
            if ($qty <= 0) {
                $this->errors[] = "Item $row: quantity must be greater than 0.";
            } elseif ($qty > self::MAX_QTY) {
                $this->errors[] = "Item $row: quantity is too large.";
            }
            if ($price < 0) {
                $this->errors[] = "Item $row: unit price cannot be negative.";
            } elseif ($price > self::MAX_PRICE) {
                $this->errors[] = "Item $row: unit price is too large.";
            }
            if ($india && $hsn === '') {
                $this->errors[] = "Item $row: HSN/SAC code is required for a GST invoice.";
            } elseif ($hsn !== '' && !ctype_digit($hsn)) {
                $this->errors[] = "Item $row: HSN/SAC code must contain digits only.";
            }

            $gross = round($qty * $price, 2);
            $discountAmount = round($gross * $discount / 100, 2);
            $items[] = [
                'n'               => $row,
                'description'     => $desc,
                'hsn'             => $hsn,
                'qty'             => $qty,
                'unit'            => $this->str('unit', '', $raw, 12),
                'price'           => $price,
                'discount'        => $discount,
                'gross'           => $gross,
                'discount_amount' => $discountAmount,
                'taxable'         => round($gross - $discountAmount, 2),
                'rate'            => $rate,
            ];
        }
        if (!$items) {
            $this->errors[] = 'Add at least one line item.';
        }

        // ---- Totals (tax is calculated per rate group to limit rounding drift) ----
        $subtotal = round(array_sum(array_column($items, 'gross')), 2);
        $discountTotal = round(array_sum(array_column($items, 'discount_amount')), 2);
        $taxableTotal = round(array_sum(array_column($items, 'taxable')), 2);

        $groups = [];
        foreach ($items as $it) {
            $key = rtrim(rtrim(number_format($it['rate'], 2, '.', ''), '0'), '.');
            $groups[$key] = ($groups[$key] ?? 0) + $it['taxable'];
        }
        ksort($groups, SORT_NUMERIC);

        $taxLines = [];
        $taxSummary = [];
        $taxTotal = 0.0;
        if ($mode === 'in_export' && $exportType === 'lut') {
            $taxLines[] = ['label' => 'IGST @ 0% (export under LUT)', 'amount' => 0.0];
        } elseif ($taxed) {
            foreach ($groups as $rate => $base) {
                $rateF = (float) $rate;
                $base = round($base, 2);
                if ($rateF == 0.0) {
                    if ($india) {
                        $taxSummary[] = ['rate' => $rate, 'taxable' => $base, 'cgst' => 0.0, 'sgst' => 0.0, 'igst' => 0.0, 'tax' => 0.0];
                    }
                    continue;
                }
                if ($india) {
                    $cgst = $sgst = $igst = 0.0;
                    if ($isInter) {
                        $igst = round($base * $rateF / 100, 2);
                        $taxLines[] = ['label' => "IGST @ {$rate}%", 'amount' => $igst];
                    } else {
                        $half = $rateF / 2;
                        $halfLabel = rtrim(rtrim(number_format($half, 2, '.', ''), '0'), '.');
                        $cgst = round($base * $half / 100, 2);
                        $sgst = $cgst;
                        $taxLines[] = ['label' => "CGST @ {$halfLabel}%", 'amount' => $cgst];
                        $taxLines[] = ['label' => "{$sgstLabel} @ {$halfLabel}%", 'amount' => $sgst];
                    }
                    $taxSummary[] = [
                        'rate' => $rate, 'taxable' => $base,
                        'cgst' => $cgst, 'sgst' => $sgst, 'igst' => $igst,
                        'tax' => round($cgst + $sgst + $igst, 2),
                    ];
                    $taxTotal += $cgst + $sgst + $igst;
                } else {
                    $tax = round($base * $rateF / 100, 2);
                    $taxLines[] = ['label' => "{$taxName} @ {$rate}%", 'amount' => $tax];
                    $taxTotal += $tax;
                }
            }
        }
        $taxTotal = round($taxTotal, 2);

        $otherCharges = round(max(0.0, $this->num('other_charges')), 2);
        $otherLabel = $this->str('other_charges_label', '', null, 60) ?: 'Other charges';
        $beforeRound = round($taxableTotal + $taxTotal + $otherCharges, 2);
        $roundOff = !empty($this->post['round_off']) ? round(round($beforeRound) - $beforeRound, 2) : 0.0;
        $grandTotal = round($beforeRound + $roundOff, 2);
        $amountPaid = round(max(0.0, $this->num('amount_paid')), 2);
        $balanceDue = round($grandTotal - $amountPaid, 2);
        if (!is_finite($grandTotal) || $grandTotal > self::MAX_TOTAL || $amountPaid > self::MAX_TOTAL) {
            $this->errors[] = 'The invoice total is too large.';
        }

        // ---- Payment details ----
        $bankSrc = is_array($this->post['bank'] ?? null) ? $this->post['bank'] : [];
        $bankFields = [
            'account_name'   => 'Account name',
            'bank_name'      => 'Bank',
            'account_number' => 'Account no.',
            'ifsc'           => 'IFSC',
            'bank_code'      => 'Bank code',
            'branch_code'    => 'Branch code',
            'swift'          => 'SWIFT / BIC',
            'iban'           => 'IBAN',
            'fps_id'         => 'FPS ID',
            'upi'            => 'UPI ID',
        ];
        $bank = [];
        foreach ($bankFields as $key => $label) {
            $value = $this->str($key, '', $bankSrc, 80);
            if ($value !== '') {
                $bank[$label] = $value;
            }
        }

        // ---- Declarations ----
        $declaration = [];
        $subtitle = '';
        if ($mode === 'in_export') {
            $subtitle = 'Export of goods / services';
            $declaration[] = $exportType === 'lut'
                ? 'Supply meant for export under LUT without payment of IGST' . ($lutArn ? " (LUT ARN: $lutArn)" : '') . '.'
                : 'Supply meant for export on payment of IGST.';
        }
        if ($india) {
            $declaration[] = 'We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct.';
        }

        $seller['state_label'] = $india ? state_label($sellerStateCode) : '';
        $buyer['state_label'] = $mode === 'in_gst' ? state_label($buyerStateCode) : '';
        if ($ship !== null) {
            $ship['state_label'] = $mode === 'in_gst' && isset(INDIA_STATES[$ship['state']]) ? state_label($ship['state']) : '';
        }

        $anyDiscount = $discountTotal > 0;
        return [
            'mode'                => $mode,
            'india'               => $india,
            'taxed'               => $taxed,
            'title'               => $modeInfo['title'],
            'subtitle'            => $subtitle,
            'template'            => $template,
            'accent'              => $accent,
            'accent_tint'         => hex_tint($accent, 0.92),
            'accent_soft'         => hex_tint($accent, 0.75),
            'on_accent'           => hex_on_color($accent),
            'currency'            => $currency,
            'number'              => $number,
            'date'                => self::formatDate($date),
            'due_date'            => self::formatDate($dueDate),
            'terms_label'         => $termsLabel,
            'reference'           => $this->str('reference', '', null, 60),
            'reverse_charge'      => $reverseCharge,
            'place_of_supply'     => state_label($posCode),
            'is_inter'            => $isInter,
            'export_type'         => $exportType,
            'lut_arn'             => $lutArn,
            'tax_name'            => $taxName,
            'tax_id_label'        => $taxIdLabel,
            'buyer_tax_id_label'  => $buyerTaxIdLabel,
            'sgst_label'          => $sgstLabel,
            'seller'              => $seller,
            'buyer'               => $buyer,
            'ship'                => $ship,
            'items'               => $items,
            'show_hsn'            => $india || count(array_filter(array_column($items, 'hsn'))) > 0,
            'show_discount'       => $anyDiscount,
            'show_tax_rate'       => $taxed,
            'subtotal'            => $subtotal,
            'discount_total'      => $discountTotal,
            'taxable_total'       => $taxableTotal,
            'tax_lines'           => $taxLines,
            'tax_summary'         => $taxSummary,
            'tax_total'           => $taxTotal,
            'other_charges'       => $otherCharges,
            'other_charges_label' => $otherLabel,
            'round_off'           => $roundOff,
            'grand_total'         => $grandTotal,
            'amount_paid'         => $amountPaid,
            'balance_due'         => $balanceDue,
            'amount_words'        => amount_in_words($grandTotal, $currency),
            'bank'                => $bank,
            'notes'               => $this->str('notes', '', null, 1500),
            'terms'               => $this->str('terms', '', null, 2000),
            'declaration'         => $declaration,
            'logo'                => $this->image($files, 'logo', 'Logo'),
            'signature'           => $this->image($files, 'signature', 'Signature / company chop'),
        ];
    }
}
