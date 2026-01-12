<?php
// API PHP (Apache + MySQL) compatible avec les endpoints existants
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . '/db.php';
require __DIR__ . '/encryption.php';

$method = $_SERVER['REQUEST_METHOD'];

// Récupérer le chemin de la requête
// Si mod_rewrite est actif, PATH_INFO contient le chemin après le rewrite
// Sinon, on utilise REQUEST_URI
$path = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Découpe l'URL et ne garde que ce qui suit "api" pour supporter un sous-dossier (ex: /QR-reservation/...)
$rawParts = array_values(array_filter(explode('/', $path)));
$apiIndex = array_search('api', $rawParts, true);
$parts = $apiIndex === false ? [] : array_slice($rawParts, $apiIndex);

function json_input() {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    return $data ?: [];
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Router: doit commencer par api
if (!isset($parts[0]) || $parts[0] !== 'api') {
    respond(['error' => 'Not found'], 404);
}

$pdo = db();

// Authentification helpers
function getAuthToken() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/', $auth, $m)) return $m[1];
    return $_COOKIE['auth_token'] ?? null;
}

function verifyAuthToken($token) {
    // Token format: base64(restaurant_id:email:timestamp)
    $decoded = base64_decode($token, true);
    if (!$decoded) return null;
    list($rid, $email, $ts) = explode(':', $decoded, 3);
    // Vérifier que le token n'a pas plus de 7 jours
    if (time() - (int)$ts > 7 * 86400) return null;
    return ['restaurant_id' => (int)$rid, 'email' => $email, 'timestamp' => (int)$ts];
}

try {
    // If a separate endpoint file exists under endpoints/, include it and exit.
    if (isset($parts[1])) {
        $endpointFile = __DIR__ . '/endpoints/' . $parts[1] . '.php';
        if (file_exists($endpointFile)) {
            include $endpointFile;
            exit;
        }
    }

    // Endpoints are handled by files in endpoints/*.php
    // If a matching endpoint file existed it would have been included above.
    // Any remaining routes can be added in the endpoints/ directory.

    respond(['error' => 'Not found'], 404);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}
