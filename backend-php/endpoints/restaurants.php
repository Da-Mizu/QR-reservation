<?php
// Restaurants endpoints: GET list, GET detail, PATCH update
$token = getAuthToken();

// Support POST fallback with _method override (JSON body or form field)
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    if ($decoded && isset($decoded['_method'])) {
        $override = strtoupper($decoded['_method']);
        if (in_array($override, ['PATCH','PUT'], true)) {
            $method = $override;
        }
    } elseif (isset($_POST['_method'])) {
        $override = strtoupper($_POST['_method']);
        if (in_array($override, ['PATCH','PUT'], true)) {
            $method = $override;
        }
    }
}

if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->query('SELECT id, nom, email, telephone, adresse, actif FROM restaurants ORDER BY id');
    $rows = $stmt->fetchAll();
    respond($rows);
}

if ($method === 'GET' && isset($parts[2])) {
    $id = (int)$parts[2];
    $stmt = $pdo->prepare('SELECT id, nom, email, telephone, adresse, actif FROM restaurants WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'Restaurant non trouvé'], 404);
    respond($row);
}

if (($method === 'PATCH' || $method === 'PUT') && isset($parts[2])) {
    $id = (int)$parts[2];
    $auth = $token ? verifyAuthToken($token) : null;
    if (!$auth || $auth['restaurant_id'] !== $id) {
        respond(['error' => 'Non autorisé'], 403);
    }
    $input = json_input();
    $fields = [];
    $params = [];
    $allowed = ['nom','email','telephone','adresse','actif'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = ?";
            $params[] = $input[$f];
        }
    }
    if (count($fields) === 0) respond(['error' => 'Aucun champ à mettre à jour'], 400);
    $params[] = $id;
    $sql = 'UPDATE restaurants SET ' . implode(', ', $fields) . ' WHERE id = ?';
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stmt = $pdo->prepare('SELECT id, nom, email, telephone, adresse, actif FROM restaurants WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        respond($row);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur update restaurant: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

respond(['error' => 'Not found'], 404);
