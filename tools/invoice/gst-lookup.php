<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/regions.php';
require_once __DIR__ . '/lib/gst-config-loader.php';
require_once __DIR__ . '/lib/lookup-http.php';

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function dot_get(mixed $data, string $path): mixed
{
    if ($path === '') {
        return null;
    }
    foreach (explode('.', $path) as $key) {
        if (!is_array($data) || !array_key_exists($key, $data)) {
            return null;
        }
        $data = $data[$key];
    }
    return $data;
}

function clean_text(mixed $value): string
{
    return is_scalar($value) ? trim(preg_replace('/\s+/', ' ', (string) $value)) : '';
}

/** Joins non-empty parts, skipping ones already present (case-insensitive). */
function join_unique(array $parts, array &$seen, string $glue = ', '): string
{
    $out = [];
    foreach ($parts as $part) {
        $part = trim(clean_text($part), ' ,.');
        $key = strtolower($part);
        if ($part === '' || isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $out[] = $part;
    }
    return implode($glue, $out);
}

/**
 * Accepts a plain string, the GST portal shape (bno/flno/bnm/st/loc/dst/stcd/pncd)
 * or the verbose shape (door_num/floor_num/building_name/street/location/...).
 *
 * @return array{address: string, short: string}
 */
function format_gst_address(mixed $addr): array
{
    if (is_string($addr)) {
        $text = trim(preg_replace('/\s*,\s*/', ', ', clean_text($addr)), ', ');
        return ['address' => $text, 'short' => $text];
    }
    if (!is_array($addr)) {
        return ['address' => '', 'short' => ''];
    }
    $f = static function (string ...$keys) use ($addr): string {
        foreach ($keys as $key) {
            $value = clean_text($addr[$key] ?? '');
            if ($value !== '') {
                return $value;
            }
        }
        return '';
    };

    $door = $f('door_num', 'bno');
    $floor = $f('floor_num', 'flno');
    $building = $f('building_name', 'bnm');
    $street = $f('street', 'st');
    $location = $f('location', 'loc');
    $city = $f('city');
    $district = $f('district', 'dst');
    $state = $f('state', 'stcd');
    $pin = $f('pin_code', 'pncd');

    $seen = [];
    $lines = array_filter([
        join_unique([$door, $floor, $building], $seen),
        join_unique([$street, $location, $city], $seen),
        trim(join_unique([$district, $state], $seen) . ($pin !== '' ? ' - ' . $pin : ''), ' -'),
    ]);
    $shortSeen = [];
    $short = join_unique([$location ?: $city, $district], $shortSeen) . ($pin !== '' ? ' - ' . $pin : '');
    return ['address' => implode("\n", $lines), 'short' => trim($short, ' -')];
}

$cfg = gst_lookup_config();
if (!$cfg['enabled']) {
    respond(503, ['ok' => false, 'message' => 'GST lookup is not set up yet. Please enter the details manually.']);
}

$gstin = gstin_normalize((string) ($_GET['gstin'] ?? ''));
if ($err = gstin_error($gstin)) {
    respond(422, ['ok' => false, 'message' => "This GSTIN $err."]);
}

$cacheDir = lookup_cache_dir('runexe-gst');

$providerKey = substr(hash('sha256', $cfg['endpoint'] . json_encode($cfg['map'])), 0, 12);
$cacheFile = $cacheDir . '/lookup-' . $providerKey . '-' . $gstin . '.json';
$missFile = $cacheDir . '/miss-' . $providerKey . '-' . $gstin;
if (is_file($cacheFile) && filemtime($cacheFile) > time() - (int) $cfg['cache_ttl']) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cached)) {
        respond(200, ['ok' => true, 'cached' => true, 'data' => $cached]);
    }
}
if (is_file($missFile) && filemtime($missFile) > time() - 86400) {
    respond(404, ['ok' => false, 'message' => 'No business was found for this GSTIN.']);
}

// Limits only apply to lookups that reach the (paid, quota-limited) provider.
$ipKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|' . date('YmdH'));
$ipFile = $cacheDir . '/rate-' . $ipKey;
if (is_file($ipFile) && (int) file_get_contents($ipFile) >= (int) $cfg['rate_limit_per_hour']) {
    respond(429, ['ok' => false, 'message' => 'Too many lookups from your network. Please try again later or enter the details manually.']);
}
$dayFile = $cacheDir . '/day-' . $providerKey . '-' . date('Ymd');
if ((int) $cfg['daily_limit'] > 0 && is_file($dayFile) && (int) file_get_contents($dayFile) >= (int) $cfg['daily_limit']) {
    respond(429, ['ok' => false, 'message' => 'GST lookups are paused for today. Please enter the details manually.']);
}
bump_counter($ipFile);
bump_counter($dayFile);

$url = str_replace('{gstin}', rawurlencode($gstin), $cfg['endpoint']);
if ($cfg['auth_query'] !== '' && $cfg['api_key'] !== '') {
    $url .= (str_contains($url, '?') ? '&' : '?') . rawurlencode($cfg['auth_query']) . '=' . rawurlencode($cfg['api_key']);
}
$headers = array_merge(['Accept: application/json'], array_values((array) $cfg['extra_headers']));
if ($cfg['auth_header'] !== '' && $cfg['api_key'] !== '') {
    $headers[] = $cfg['auth_header'] . ': ' . $cfg['auth_prefix'] . $cfg['api_key'];
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT        => (int) $cfg['timeout'],
    CURLOPT_CUSTOMREQUEST  => strtoupper($cfg['method']),
    CURLOPT_HTTPHEADER     => $headers,
]);
$body = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($status === 429) {
    error_log('GST lookup provider quota reached');
    respond(429, ['ok' => false, 'message' => 'The GST lookup limit has been reached for now. Please enter the details manually.']);
}
if ($body === false || $status >= 500 || $status === 401 || $status === 403) {
    error_log("GST lookup provider error ($status): $curlError");
    respond(502, ['ok' => false, 'message' => 'The GST lookup service is not responding. Please try again later.']);
}

$json = json_decode((string) $body, true);
$map = $cfg['map'];
$legal = is_array($json) ? clean_text(dot_get($json, $map['legal_name'])) : '';
$successFlag = is_array($json) && $map['success'] !== '' ? dot_get($json, $map['success']) : true;

if ($status >= 400 || !$successFlag || $legal === '') {
    touch($missFile);
    respond(404, ['ok' => false, 'message' => 'No business was found for this GSTIN.']);
}

$addresses = [];
$principal = format_gst_address(dot_get($json, $map['address']));
if ($principal['address'] !== '') {
    $addresses[] = ['label' => 'Principal place of business'] + $principal;
}
$additional = dot_get($json, $map['additional_addresses']);
foreach (is_array($additional) ? $additional : [] as $item) {
    $formatted = format_gst_address($map['additional_address_field'] !== '' ? dot_get($item, $map['additional_address_field']) : $item);
    if ($formatted['address'] !== '' && !in_array($formatted['address'], array_column($addresses, 'address'), true)) {
        $addresses[] = ['label' => 'Additional place of business'] + $formatted;
    }
}

$stateCode = gstin_state_code($gstin);
$data = [
    'gstin'             => $gstin,
    'legal_name'        => $legal,
    'trade_name'        => clean_text(dot_get($json, $map['trade_name'])),
    'name'              => $legal,
    'address'           => $addresses[0]['address'] ?? '',
    'addresses'         => $addresses,
    'state_code'        => $stateCode,
    'state'             => $stateCode ? INDIA_STATES[$stateCode] : '',
    'pan'               => gstin_pan($gstin),
    'status'            => clean_text(dot_get($json, $map['status'])),
    'type'              => clean_text(dot_get($json, $map['type'])),
    'constitution'      => clean_text(dot_get($json, $map['constitution'])),
    'registration_date' => clean_text(dot_get($json, $map['registration_date'])),
    'cancellation_date' => clean_text(dot_get($json, $map['cancellation_date'])),
];

file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
respond(200, ['ok' => true, 'cached' => false, 'data' => $data]);
