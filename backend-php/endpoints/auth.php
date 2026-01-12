<?php
// Auth endpoints (included from index.php)
// Expects: $method, $parts, $pdo, json_input(), respond(), getAuthToken(), verifyAuthToken()
if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'login') {
    $data = json_input();
    $email = $data['email'] ?? null;
    $motdepasse = $data['motdepasse'] ?? null;
    if (!$email || !$motdepasse) respond(['error' => 'Email et mot de passe requis'], 400);
    
    $stmt = $pdo->prepare('SELECT id, email, password_hash FROM restaurants WHERE email = ? AND actif = 1');
    $stmt->execute([$email]);
    $restaurant = $stmt->fetch();
    
    if (!$restaurant) {
        respond(['error' => 'Identifiants invalides'], 401);
    }
    
    $passwordMatch = false;
    if (password_needs_rehash($restaurant['password_hash'], PASSWORD_DEFAULT) === false) {
        $passwordMatch = password_verify($motdepasse, $restaurant['password_hash']);
    } else {
        $passwordMatch = ($motdepasse === $restaurant['password_hash']);
    }
    
    if (!$passwordMatch) {
        respond(['error' => 'Identifiants invalides'], 401);
    }
    
    $token = base64_encode($restaurant['id'] . ':' . $email . ':' . time());
    respond(['token' => $token, 'restaurant_id' => (int)$restaurant['id'], 'email' => $email], 200);
}

if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'register') {
    $data = json_input();
    $nom = $data['nom'] ?? null;
    $email = $data['email'] ?? null;
    $motdepasse = $data['motdepasse'] ?? null;
    if (!$nom || !$email || !$motdepasse) respond(['error' => 'Nom, email et mot de passe requis'], 400);
    
    $hash = password_hash($motdepasse, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO restaurants (nom, email, password_hash) VALUES (?, ?, ?)');
    try {
        $stmt->execute([$nom, $email, $hash]);
        $rid = $pdo->lastInsertId();
        $token = base64_encode($rid . ':' . $email . ':' . time());
        respond(['token' => $token, 'restaurant_id' => (int)$rid, 'email' => $email, 'message' => 'Restaurant créé avec succès'], 201);
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            respond(['error' => 'Email ou nom déjà utilisé'], 409);
        }
        throw $e;
    }
}

if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'verify') {
    $token = getAuthToken();
    if (!$token) respond(['error' => 'Non authentifié'], 401);
    $auth = verifyAuthToken($token);
    if (!$auth) respond(['error' => 'Token invalide ou expiré'], 401);
    respond($auth);
}

if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'logout') {
    respond(['message' => 'Déconnecté avec succès']);
}
