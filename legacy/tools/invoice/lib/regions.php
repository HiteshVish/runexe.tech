<?php
declare(strict_types=1);

/**
 * Reference data and helpers: Indian GST state codes, GSTIN validation,
 * currencies, money formatting and amount-in-words.
 */

const INDIA_STATES = [
    '01' => 'Jammu and Kashmir',
    '02' => 'Himachal Pradesh',
    '03' => 'Punjab',
    '04' => 'Chandigarh',
    '05' => 'Uttarakhand',
    '06' => 'Haryana',
    '07' => 'Delhi',
    '08' => 'Rajasthan',
    '09' => 'Uttar Pradesh',
    '10' => 'Bihar',
    '11' => 'Sikkim',
    '12' => 'Arunachal Pradesh',
    '13' => 'Nagaland',
    '14' => 'Manipur',
    '15' => 'Mizoram',
    '16' => 'Tripura',
    '17' => 'Meghalaya',
    '18' => 'Assam',
    '19' => 'West Bengal',
    '20' => 'Jharkhand',
    '21' => 'Odisha',
    '22' => 'Chhattisgarh',
    '23' => 'Madhya Pradesh',
    '24' => 'Gujarat',
    '26' => 'Dadra and Nagar Haveli and Daman and Diu',
    '27' => 'Maharashtra',
    '29' => 'Karnataka',
    '30' => 'Goa',
    '31' => 'Lakshadweep',
    '32' => 'Kerala',
    '33' => 'Tamil Nadu',
    '34' => 'Puducherry',
    '35' => 'Andaman and Nicobar Islands',
    '36' => 'Telangana',
    '37' => 'Andhra Pradesh',
    '38' => 'Ladakh',
    '97' => 'Other Territory',
];

const PLACE_OF_SUPPLY_EXPORT = '96';

/** Union territories without a legislature charge UTGST instead of SGST. */
const UTGST_STATE_CODES = ['04', '26', '31', '35', '38', '97'];

const CURRENCIES = [
    'HKD' => ['symbol' => 'HK$',  'name' => 'Hong Kong Dollars', 'minor' => 'Cents'],
    'USD' => ['symbol' => 'US$',  'name' => 'US Dollars',        'minor' => 'Cents'],
    'INR' => ['symbol' => '₹',    'name' => 'Rupees',            'minor' => 'Paise'],
    'EUR' => ['symbol' => '€',    'name' => 'Euros',             'minor' => 'Cents'],
    'GBP' => ['symbol' => '£',    'name' => 'Pounds Sterling',   'minor' => 'Pence'],
    'SGD' => ['symbol' => 'S$',   'name' => 'Singapore Dollars', 'minor' => 'Cents'],
    'AED' => ['symbol' => 'AED ', 'name' => 'UAE Dirhams',       'minor' => 'Fils'],
    'CNY' => ['symbol' => 'CN¥',  'name' => 'Chinese Yuan',      'minor' => 'Fen'],
    'AUD' => ['symbol' => 'A$',   'name' => 'Australian Dollars', 'minor' => 'Cents'],
    'CAD' => ['symbol' => 'C$',   'name' => 'Canadian Dollars',  'minor' => 'Cents'],
];

const INVOICE_MODES = [
    'no_tax'     => ['title' => 'Invoice',     'india' => false, 'taxed' => false, 'currency' => 'HKD'],
    'in_gst'     => ['title' => 'Tax Invoice', 'india' => true,  'taxed' => true,  'currency' => 'INR'],
    'in_export'  => ['title' => 'Tax Invoice', 'india' => true,  'taxed' => true,  'currency' => 'USD'],
    'custom_tax' => ['title' => 'Tax Invoice', 'india' => false, 'taxed' => true,  'currency' => 'USD'],
];

const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function gstin_normalize(string $gstin): string
{
    return strtoupper(preg_replace('/\s+/', '', $gstin));
}

function gstin_check_char(string $first14): string
{
    $sum = 0;
    for ($i = 0; $i < 14; $i++) {
        $product = strpos(GSTIN_CHARSET, $first14[$i]) * (($i % 2) + 1);
        $sum += intdiv($product, 36) + ($product % 36);
    }
    return GSTIN_CHARSET[(36 - ($sum % 36)) % 36];
}

/** Returns null when valid, otherwise a human-readable reason. */
function gstin_error(string $gstin): ?string
{
    $gstin = gstin_normalize($gstin);
    if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/', $gstin)) {
        return 'must be 15 characters in the format 27AAAAA0000A1Z5';
    }
    if (!isset(INDIA_STATES[substr($gstin, 0, 2)])) {
        return 'starts with an unknown state code ' . substr($gstin, 0, 2);
    }
    if (gstin_check_char(substr($gstin, 0, 14)) !== $gstin[14]) {
        return 'has an invalid check digit (last character) - please re-check for typos';
    }
    return null;
}

function gstin_state_code(string $gstin): ?string
{
    $code = substr(gstin_normalize($gstin), 0, 2);
    return isset(INDIA_STATES[$code]) ? $code : null;
}

function gstin_pan(string $gstin): string
{
    return substr(gstin_normalize($gstin), 2, 10);
}

function state_label(?string $code): string
{
    if ($code === PLACE_OF_SUPPLY_EXPORT) {
        return '96 - Other Countries';
    }
    return ($code && isset(INDIA_STATES[$code])) ? $code . ' - ' . INDIA_STATES[$code] : '';
}

/** Matches a state name as written by India Post / banks (any case, "&" or "and", old names). */
function state_code_from_name(string $name): ?string
{
    $key = static fn (string $s): string => preg_replace('/[^a-z]/', '', str_replace('&', 'and', strtolower($s)));
    $aliases = [
        'orissa' => '21', 'pondicherry' => '34', 'uttaranchal' => '05',
        'dadraandnagarhaveli' => '26', 'damananddiu' => '26',
        'andamanandnicobar' => '35', 'jammukashmir' => '01',
    ];
    $wanted = $key($name);
    if (isset($aliases[$wanted])) {
        return $aliases[$wanted];
    }
    foreach (INDIA_STATES as $code => $state) {
        if ($key($state) === $wanted) {
            return (string) $code;
        }
    }
    return null;
}

function currency_info(string $code): array
{
    return CURRENCIES[$code] ?? CURRENCIES['USD'];
}

/** Indian grouping (12,34,567.89) for INR, international grouping otherwise. */
function format_number(float $amount, string $currency): string
{
    if (!is_finite($amount)) {
        return '-';
    }
    $negative = $amount < 0;
    $formatted = number_format(abs($amount), 2, '.', ',');
    if ($currency === 'INR') {
        [$whole, $fraction] = explode('.', number_format(abs($amount), 2, '.', ''));
        if (strlen($whole) > 3) {
            $last3 = substr($whole, -3);
            $rest = substr($whole, 0, -3);
            $rest = preg_replace('/\B(?=(\d{2})+(?!\d))/', ',', $rest);
            $whole = $rest . ',' . $last3;
        }
        $formatted = $whole . '.' . $fraction;
    }
    return ($negative ? '-' : '') . $formatted;
}

function format_money(float $amount, string $currency): string
{
    $symbol = currency_info($currency)['symbol'];
    $negative = $amount < 0;
    return ($negative ? '-' : '') . $symbol . format_number(abs($amount), $currency);
}

function words_below_thousand(int $n): string
{
    static $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    static $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    $parts = [];
    if ($n >= 100) {
        $parts[] = $ones[intdiv($n, 100)] . ' Hundred';
        $n %= 100;
    }
    if ($n >= 20) {
        $parts[] = $tens[intdiv($n, 10)] . ($n % 10 ? ' ' . $ones[$n % 10] : '');
    } elseif ($n > 0) {
        $parts[] = $ones[$n];
    }
    return implode(' ', $parts);
}

function integer_to_words(int $n, bool $indian): string
{
    if ($n === 0) {
        return 'Zero';
    }
    $scales = $indian
        ? [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']]
        : [[1000000000000, 'Trillion'], [1000000000, 'Billion'], [1000000, 'Million'], [1000, 'Thousand']];

    $parts = [];
    foreach ($scales as [$size, $label]) {
        if ($n >= $size) {
            $chunk = intdiv($n, $size);
            $parts[] = ($chunk >= 1000 ? integer_to_words($chunk, $indian) : words_below_thousand($chunk)) . ' ' . $label;
            $n %= $size;
        }
    }
    if ($n > 0) {
        $parts[] = words_below_thousand($n);
    }
    return implode(' ', $parts);
}

function amount_in_words(float $amount, string $currency): string
{
    $info = currency_info($currency);
    $cents = (int) round(abs($amount) * 100);
    $whole = intdiv($cents, 100);
    $minor = $cents % 100;

    $text = $info['name'] . ' ' . integer_to_words($whole, $currency === 'INR');
    if ($minor > 0) {
        $text .= ' and ' . words_below_thousand($minor) . ' ' . $info['minor'];
    }
    return $text . ' Only';
}

/** Blend a hex colour towards white; $amount 0..1 is how much white. */
function hex_tint(string $hex, float $amount): string
{
    [$r, $g, $b] = sscanf($hex, '#%02x%02x%02x');
    $mix = fn(int $c): int => (int) round($c + (255 - $c) * $amount);
    return sprintf('#%02X%02X%02X', $mix($r), $mix($g), $mix($b));
}

/** Readable text colour (dark or white) on top of the given background. */
function hex_on_color(string $hex): string
{
    [$r, $g, $b] = sscanf($hex, '#%02x%02x%02x');
    $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
    return $luminance > 0.62 ? '#111111' : '#FFFFFF';
}
