<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-CSRF-TOKEN');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$cfg = require __DIR__ . '/tempmail-config.php';
$apikey = $cfg['apikey'] ?? '';
$namespace = $cfg['namespace'] ?? '';

if ($apikey === '' || $namespace === '') {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Temp mail is not configured. Add TESTMAIL_APIKEY and TESTMAIL_NAMESPACE in tools/tempmail-config.php.',
    ]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

function testmail_get(array $params, int $timeout = 20): array
{
    $url = 'https://api.testmail.app/api/json?' . http_build_query($params);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($body === false) {
        return ['ok' => false, 'message' => $err ?: 'Request failed', 'status' => $status];
    }
    $data = json_decode($body, true);
    return ['ok' => true, 'status' => $status, 'data' => is_array($data) ? $data : []];
}

if ($action === 'generate') {
    $tag = strtolower(bin2hex(random_bytes(3)));
    echo json_encode([
        'ok' => true,
        'namespace' => $namespace,
        'tag' => $tag,
        'email' => "{$namespace}.{$tag}@inbox.testmail.app",
        'timestamp_from' => (int) round(microtime(true) * 1000),
    ]);
    exit;
}

if ($action === 'inbox') {
    $tag = (string) ($_GET['tag'] ?? '');
    if ($tag === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Missing tag.']);
        exit;
    }
    $params = [
        'apikey' => $apikey,
        'namespace' => $namespace,
        'tag' => $tag,
        'limit' => min(max((int) ($_GET['limit'] ?? 20), 0), 100),
        'offset' => max((int) ($_GET['offset'] ?? 0), 0),
        'from_parsed' => 'true',
    ];
    if (isset($_GET['timestamp_from']) && is_numeric($_GET['timestamp_from'])) {
        $params['timestamp_from'] = (int) $_GET['timestamp_from'];
    }
    $res = testmail_get($params, 20);
    if (!$res['ok'] || ($res['status'] ?? 0) >= 400) {
        http_response_code(502);
        echo json_encode(['ok' => false, 'message' => 'Failed to query inbox.']);
        exit;
    }
    $data = $res['data'];
    if (($data['result'] ?? null) !== 'success') {
        http_response_code(502);
        echo json_encode(['ok' => false, 'message' => $data['message'] ?? 'Unexpected API response.']);
        exit;
    }
    $emails = [];
    foreach (($data['emails'] ?? []) as $e) {
        $fromParsed = $e['from_parsed'] ?? null;
        $first = null;
        if (is_array($fromParsed)) {
            $first = isset($fromParsed[0]) && is_array($fromParsed[0]) ? $fromParsed[0]
                : (isset($fromParsed['address']) ? $fromParsed : null);
        }
        $attachments = [];
        foreach ($e['attachments'] ?? [] as $a) {
            if (!is_array($a)) continue;
            $attachments[] = [
                'filename' => $a['filename'] ?? 'attachment',
                'size' => isset($a['size']) ? (int) $a['size'] : null,
                'contentType' => $a['contentType'] ?? null,
                'downloadUrl' => $a['downloadUrl'] ?? null,
            ];
        }
        $emails[] = [
            'id' => $e['id'] ?? $e['oid'] ?? $e['messageId'] ?? null,
            'tag' => $e['tag'] ?? null,
            'from' => $e['from'] ?? null,
            'from_address' => $first['address'] ?? null,
            'from_name' => ($first['name'] ?? '') !== '' ? $first['name'] : null,
            'subject' => $e['subject'] ?? '(no subject)',
            'text' => $e['text'] ?? null,
            'html' => $e['html'] ?? null,
            'spf' => $e['SPF'] ?? $e['spf'] ?? null,
            'dkim' => $e['dkim'] ?? null,
            'attachments' => $attachments,
            'downloadUrl' => $e['downloadUrl'] ?? null,
            'timestamp' => $e['timestamp'] ?? null,
            'raw' => $e,
        ];
    }
    echo json_encode(['ok' => true, 'count' => (int) ($data['count'] ?? count($emails)), 'emails' => $emails]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'message' => 'Unknown action.']);
