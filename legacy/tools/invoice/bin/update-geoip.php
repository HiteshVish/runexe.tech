<?php
declare(strict_types=1);

/**
 * Downloads the free DB-IP "IP to Country Lite" database (CC BY 4.0, no key needed).
 * DB-IP publishes a new file each month, so run this monthly from cron:
 *   15 3 2 * * php /path/to/tools/invoice/bin/update-geoip.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../lib/geo.php';

$target = GEOIP_DB_PATH;
if (!is_dir(dirname($target)) && !mkdir(dirname($target), 0755, true)) {
    fwrite(STDERR, "Cannot create " . dirname($target) . "\n");
    exit(1);
}

$gz = null;
foreach ([0, 1] as $monthsBack) {
    $month = date('Y-m', strtotime("first day of -$monthsBack month"));
    $url = "https://download.db-ip.com/free/dbip-country-lite-$month.mmdb.gz";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_USERAGENT      => 'RunExe-Invoice/1.0',
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($status === 200 && is_string($body) && strlen($body) > 100000) {
        $gz = $body;
        echo "Downloaded $url\n";
        break;
    }
    echo "Not available yet: $url ($status)\n";
}
if ($gz === null) {
    fwrite(STDERR, "Download failed; keeping the current database.\n");
    exit(1);
}

$mmdb = gzdecode($gz);
$tmp = $target . '.tmp';
if ($mmdb === false || file_put_contents($tmp, $mmdb) === false) {
    fwrite(STDERR, "Could not unpack the database.\n");
    exit(1);
}

try {
    $reader = new MaxMind\Db\Reader($tmp);
    $check = $reader->get('8.8.8.8');
    $reader->close();
    if (($check['country']['iso_code'] ?? '') !== 'US') {
        throw new RuntimeException('unexpected lookup result');
    }
} catch (Throwable $e) {
    @unlink($tmp);
    fwrite(STDERR, 'Downloaded database failed the check: ' . $e->getMessage() . "\n");
    exit(1);
}

chmod($tmp, 0644);
rename($tmp, $target);
echo "Installed $target (" . round(filesize($target) / 1048576, 1) . " MB)\n";
