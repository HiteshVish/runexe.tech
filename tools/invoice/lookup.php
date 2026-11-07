<?php
declare(strict_types=1);

/**
 * Free, keyless lookups used to prefill the form:
 *   ?type=ifsc&q=HDFC0000060   bank + branch (Razorpay IFSC API)
 *   ?type=pincode&q=382170     district + state (India Post)
 *   ?type=vat&q=IE6388047V     EU VAT number validity (EU VIES)
 */

require_once __DIR__ . '/lib/regions.php';
require_once __DIR__ . '/lib/lookup-http.php';

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const EU_VAT_COUNTRIES = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU',
    'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI'];
const LOOKUP_RATE_PER_HOUR = 60;

function title_case(string $s): string
{
    return ucwords(strtolower(trim($s)), " -/(");
}

function clean_vies(mixed $value): string
{
    $value = trim(explode('||', (string) $value)[0]);
    $value = preg_replace('/[ \t]{2,}/', ', ', $value);
    return $value === '---' ? '' : $value;
}

$type = (string) ($_GET['type'] ?? '');
$q = strtoupper(preg_replace('/[\s.\-]/', '', (string) ($_GET['q'] ?? '')));

$valid = match ($type) {
    'ifsc'    => (bool) preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $q),
    'pincode' => (bool) preg_match('/^[1-9][0-9]{5}$/', $q),
    'vat'     => (bool) preg_match('/^[A-Z]{2}[A-Z0-9]{2,13}$/', $q),
    default   => false,
};
if ($type === 'vat' && $valid) {
    $q = preg_replace('/^GR/', 'EL', $q);
    $valid = in_array(substr($q, 0, 2), EU_VAT_COUNTRIES, true);
}
if (!$valid) {
    respond(422, ['ok' => false, 'message' => 'Invalid lookup.']);
}

$cacheDir = lookup_cache_dir('runexe-lookup');
$cacheFile = $cacheDir . '/' . $type . '-' . $q . '.json';
$ttl = $type === 'vat' ? 86400 : 30 * 86400;
if (is_file($cacheFile)) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    $age = time() - filemtime($cacheFile);
    if (is_array($cached) && $age < ($cached['ok'] ? $ttl : 86400)) {
        respond($cached['ok'] ? 200 : 404, $cached);
    }
}

$ipFile = $cacheDir . '/rate-' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|' . date('YmdH'));
if (bump_counter($ipFile) > LOOKUP_RATE_PER_HOUR) {
    respond(429, ['ok' => false, 'message' => 'Too many lookups. Please try again later.']);
}

$result = null;
switch ($type) {
    case 'ifsc':
        [$status, $json] = http_get_json('https://ifsc.razorpay.com/' . rawurlencode($q));
        if ($status === 200 && is_array($json) && !empty($json['BANK'])) {
            $result = ['ok' => true, 'data' => [
                'ifsc'     => $q,
                'bank'     => trim((string) $json['BANK']),
                'branch'   => title_case((string) ($json['BRANCH'] ?? '')),
                'city'     => title_case((string) ($json['CITY'] ?? '')),
                'district' => title_case((string) ($json['DISTRICT'] ?? '')),
                'state'    => title_case((string) ($json['STATE'] ?? '')),
                'swift'    => trim((string) ($json['SWIFT'] ?? '')),
            ]];
        } elseif ($status === 404) {
            $result = ['ok' => false, 'message' => 'No bank branch was found for this IFSC.'];
        }
        break;

    case 'pincode':
        [$status, $json] = http_get_json('https://api.postalpincode.in/pincode/' . $q);
        $entry = is_array($json) ? ($json[0] ?? null) : null;
        if ($status === 200 && is_array($entry)) {
            $offices = is_array($entry['PostOffice'] ?? null) ? $entry['PostOffice'] : [];
            if (($entry['Status'] ?? '') === 'Success' && $offices) {
                $first = $offices[0];
                $result = ['ok' => true, 'data' => [
                    'pin'        => $q,
                    'district'   => trim((string) ($first['District'] ?? '')),
                    'state'      => trim((string) ($first['State'] ?? '')),
                    'state_code' => state_code_from_name((string) ($first['State'] ?? '')),
                    'offices'    => array_slice(array_values(array_unique(array_map('trim', array_column($offices, 'Name')))), 0, 12),
                ]];
            } else {
                $result = ['ok' => false, 'message' => 'This PIN code was not found.'];
            }
        }
        break;

    case 'vat':
        $country = substr($q, 0, 2);
        $number = substr($q, 2);
        [$status, $json] = http_get_json(
            'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/' . $country . '/vat/' . rawurlencode($number),
            [],
            15
        );
        $userError = is_array($json) ? (string) ($json['userError'] ?? '') : '';
        if ($status === 200 && in_array($userError, ['VALID', 'INVALID'], true)) {
            $result = ['ok' => true, 'data' => [
                'number'  => $country . $number,
                'valid'   => $userError === 'VALID',
                'name'    => clean_vies($json['name'] ?? ''),
                'address' => clean_vies($json['address'] ?? ''),
            ]];
        } elseif ($status === 200 && $userError === 'INVALID_INPUT') {
            $result = ['ok' => true, 'data' => ['number' => $country . $number, 'valid' => false, 'name' => '', 'address' => '']];
        }
        break;
}

if ($result === null) {
    respond(502, ['ok' => false, 'message' => 'The lookup service is not responding right now.']);
}
file_put_contents($cacheFile, json_encode($result, JSON_UNESCAPED_UNICODE), LOCK_EX);
respond($result['ok'] ? 200 : 404, $result);
