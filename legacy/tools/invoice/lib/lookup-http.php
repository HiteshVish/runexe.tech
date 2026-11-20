<?php
declare(strict_types=1);

/** Shared helpers for the JSON lookup endpoints (GST, IFSC, PIN code, EU VAT). */

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function lookup_cache_dir(string $name): string
{
    $dir = sys_get_temp_dir() . '/' . $name;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

function bump_counter(string $file): int
{
    $count = is_file($file) ? (int) file_get_contents($file) : 0;
    file_put_contents($file, (string) ($count + 1), LOCK_EX);
    return $count + 1;
}

/**
 * @param string[] $headers
 * @return array{0: int, 1: mixed} HTTP status (0 on network failure) and decoded JSON
 */
function http_get_json(string $url, array $headers = [], int $timeout = 10): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_HTTPHEADER     => array_merge(['Accept: application/json'], $headers),
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) {
        return [0, null];
    }
    return [$status, json_decode((string) $body, true)];
}
