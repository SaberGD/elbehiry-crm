<?php
/**
 * AI helper for the Behery CRM.
 *   POST mode=transcribe  (multipart, field "audio")  -> Egyptian-Arabic speech to text
 *   POST mode=refine      (JSON {text, reasons[]})    -> tidied note + suggested "not bought" reason
 *   GET  ?ping=1                                      -> {"configured": bool}
 *
 * The Gemini key never reaches the browser. It lives in a PHP file OUTSIDE public_html:
 *   <account>/domains/engsaber.space/crm-ai-secrets.php
 *   <?php return ['gemini_key' => '...', 'model' => 'gemini-flash-latest'];
 * Every request must carry a valid Firebase ID token (a signed-in staff member).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const FIREBASE_WEB_API_KEY = 'AIzaSyAQdI3hTzx-LFgANKnIzeeYiKuUgCeqZUE'; // public web key of the Firebase project
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 4000;
const RATE_LIMIT_PER_HOUR = 60;

function fail(int $code, string $error): void {
    http_response_code($code);
    echo json_encode(['error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Folders searched for crm-ai-secrets.php, all outside the web root. */
function secret_paths(): array {
    $paths = [];
    foreach ([3, 4, 5] as $up) {
        $paths[] = dirname(__DIR__, $up) . '/crm-ai-secrets.php';
    }
    $home = getenv('HOME');
    if ($home) $paths[] = rtrim($home, '/') . '/crm-ai-secrets.php';
    return array_values(array_unique($paths));
}

/** @return array{0: ?array, 1: string} config and a diagnostic hint */
function load_secrets(): array {
    foreach (secret_paths() as $path) {
        if (!is_file($path)) continue;
        $cfg = @include $path;
        if (!is_array($cfg)) return [null, 'file_invalid'];
        if (empty($cfg['gemini_key']) || !is_string($cfg['gemini_key'])) return [null, 'key_missing'];
        return [$cfg, 'ok'];
    }
    return [null, 'file_not_found'];
}

function http_json(string $url, array $headers, array $body): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return [$status, is_array($data) ? $data : []];
}

function verify_firebase_user(string $idToken): ?string {
    [$status, $data] = http_json(
        'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . FIREBASE_WEB_API_KEY,
        [],
        ['idToken' => $idToken]
    );
    return $status === 200 && !empty($data['users'][0]['localId']) ? (string) $data['users'][0]['localId'] : null;
}

function rate_limit(string $uid): void {
    $file = sys_get_temp_dir() . '/crm-ai-' . md5($uid) . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string) file_get_contents($file), true) ?: [];
        $hits = array_values(array_filter($hits, fn($t) => $t > $now - 3600));
    }
    if (count($hits) >= RATE_LIMIT_PER_HOUR) fail(429, 'rate_limited');
    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
}

function gemini(array $cfg, array $parts, array $generation = []): string {
    $model = preg_match('/^[a-z0-9.\-]+$/i', (string) ($cfg['model'] ?? '')) ? $cfg['model'] : 'gemini-flash-latest';
    [$status, $data] = http_json(
        "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent",
        ['x-goog-api-key: ' . $cfg['gemini_key']],
        ['contents' => [['parts' => $parts]], 'generationConfig' => array_merge(['temperature' => 0], $generation)]
    );
    if ($status !== 200) fail(502, 'ai_unavailable');
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
    return is_string($text) ? trim($text) : '';
}

[$cfg, $configHint] = load_secrets();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['configured' => $cfg !== null, 'hint' => $configHint]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'method_not_allowed');
if ($cfg === null) fail(503, 'not_configured');

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) fail(401, 'unauthorized');
$uid = verify_firebase_user($m[1]);
if ($uid === null) fail(401, 'unauthorized');
rate_limit($uid);

$json = null;
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $json = json_decode((string) file_get_contents('php://input'), true);
}
$mode = $json['mode'] ?? ($_POST['mode'] ?? '');

if ($mode === 'transcribe') {
    $file = $_FILES['audio'] ?? null;
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) fail(400, 'no_audio');
    if ($file['size'] > MAX_AUDIO_BYTES) fail(413, 'audio_too_large');
    $mime = strtolower(explode(';', (string) ($file['type'] ?: 'audio/webm'))[0]);
    $allowed = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac'];
    if (!in_array($mime, $allowed, true)) fail(415, 'unsupported_audio');
    $prompt = 'فرّغ هذا التسجيل الصوتي حرفيًا. المتحدث موظف مبيعات مصري في شركة دهانات وديكور وبستان، '
        . 'بيتكلم بالعامية المصرية عن عميل أو زيارة. اكتب الكلام كما قيل بالعربية وحافظ على العامية المصرية ولا تحوّلها للفصحى. '
        . 'اكتب الأرقام وأرقام الهواتف بالأرقام (0-9). اكتب أسماء المنتجات والأقسام بشكل صحيح (دهان، بلاستيك، سيلر، معجون، ديكور، بستان، تأسيس، تشطيب). '
        . 'لا تضف أي شرح أو تعليق أو عنوان، أعد النص فقط. لو التسجيل صامت أو غير مفهوم اكتب: [غير واضح]';
    $text = gemini($cfg, [
        ['text' => $prompt],
        ['inline_data' => ['mime_type' => $mime, 'data' => base64_encode((string) file_get_contents($file['tmp_name']))]],
    ]);
    echo json_encode(['text' => $text === '[غير واضح]' ? '' : $text], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($mode === 'refine') {
    $text = trim((string) ($json['text'] ?? ''));
    if ($text === '' || mb_strlen($text) > MAX_TEXT_CHARS) fail(400, 'bad_text');
    $reasons = [];
    foreach ((array) ($json['reasons'] ?? []) as $r) {
        if (isset($r['id'], $r['label'])) $reasons[] = ['id' => (string) $r['id'], 'label' => (string) $r['label']];
    }
    $prompt = "أنت مساعد لموظف مبيعات في شركة دهانات. نظّف الملاحظة التالية: صحّح الإملاء والصياغة واجعلها واضحة ومختصرة بالعامية المصرية المهذبة. "
        . "ممنوع تضيف أي معلومة جديدة أو تغيّر أرقامًا أو أسماء أو مبالغ. "
        . "ثم لو كلام الموظف يوضّح بجلاء سبب عدم شراء العميل فاختر أقرب سبب من القائمة (reasonId)، وإلا اجعله null.\n"
        . 'القائمة: ' . json_encode($reasons, JSON_UNESCAPED_UNICODE) . "\n"
        . 'أعد JSON فقط بالشكل {"text": "...", "reasonId": null}' . "\nالملاحظة:\n" . $text;
    $out = gemini($cfg, [['text' => $prompt]], ['responseMimeType' => 'application/json']);
    $parsed = json_decode($out, true);
    $clean = is_array($parsed) && isset($parsed['text']) ? trim((string) $parsed['text']) : $text;
    $rid = is_array($parsed) ? ($parsed['reasonId'] ?? null) : null;
    $valid = array_column($reasons, 'id');
    echo json_encode(['text' => $clean !== '' ? $clean : $text, 'reasonId' => in_array($rid, $valid, true) ? $rid : null], JSON_UNESCAPED_UNICODE);
    exit;
}

fail(400, 'bad_mode');
