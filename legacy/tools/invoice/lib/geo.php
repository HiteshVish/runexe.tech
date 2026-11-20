<?php
declare(strict_types=1);

define('GEOIP_DB_PATH', dirname(__DIR__) . '/data/dbip-country-lite.mmdb');

/**
 * Two-letter country code of the visitor, or null when unknown.
 * `?country=XX` overrides it (only affects form defaults, handy for testing).
 */
function visitor_country(): ?string
{
    $override = strtoupper((string) ($_GET['country'] ?? ''));
    if (preg_match('/^[A-Z]{2}$/', $override)) {
        return $override;
    }

    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $public = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if (!$public || !is_file(GEOIP_DB_PATH) || !class_exists(MaxMind\Db\Reader::class)) {
        return null;
    }
    try {
        $reader = new MaxMind\Db\Reader(GEOIP_DB_PATH);
        $record = $reader->get($public);
        $reader->close();
    } catch (Throwable) {
        return null;
    }
    $code = strtoupper((string) ($record['country']['iso_code'] ?? ''));
    return preg_match('/^[A-Z]{2}$/', $code) ? $code : null;
}
