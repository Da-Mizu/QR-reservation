<?php
// Produits endpoints

// GET /api/produits - Liste uniquement les produits disponibles (client-facing)
if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->query('SELECT * FROM produits WHERE disponible = 1');
    respond($stmt->fetchAll());
}

// GET /api/produits/all - Liste tous les produits (admin)
if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'all') {
    $stmt = $pdo->query('SELECT * FROM produits ORDER BY categorie, nom');
    respond($stmt->fetchAll());
}

// GET /api/produits/:id - Détails d'un produit
if ($method === 'GET' && isset($parts[2]) && is_numeric($parts[2])) {
    $stmt = $pdo->prepare('SELECT * FROM produits WHERE id = ?');
    $stmt->execute([$parts[2]]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'Produit non trouvé'], 404);
    respond($row);
}

// POST /api/produits - Créer un nouveau produit
if ($method === 'POST' && !isset($parts[2])) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['nom'])) {
        respond(['error' => 'Le nom est requis'], 400);
    }
    
    // determine restaurant_id: prefer provided value, otherwise default to 1
    $restaurant_id = isset($input['restaurant_id']) ? (int)$input['restaurant_id'] : 1;

    $stmt = $pdo->prepare('INSERT INTO produits (restaurant_id, nom, description, prix, categorie, disponible) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $restaurant_id,
        $input['nom'],
        $input['description'] ?? '',
        $input['prix'] ?? 0,
        $input['categorie'] ?? '',
        $input['disponible'] ?? 1
    ]);
    
    $id = $pdo->lastInsertId();
    respond(['success' => true, 'id' => $id], 201);
}

// PUT /api/produits/:id - Modifier un produit
if ($method === 'PUT' && isset($parts[2]) && is_numeric($parts[2])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $parts[2];
    
    if (empty($input['nom'])) {
        respond(['error' => 'Le nom est requis'], 400);
    }
    
    $restaurant_id = isset($input['restaurant_id']) ? (int)$input['restaurant_id'] : 1;

    $stmt = $pdo->prepare('UPDATE produits SET restaurant_id = ?, nom = ?, description = ?, prix = ?, categorie = ?, disponible = ? WHERE id = ?');
    $stmt->execute([
        $restaurant_id,
        $input['nom'],
        $input['description'] ?? '',
        $input['prix'] ?? 0,
        $input['categorie'] ?? '',
        $input['disponible'] ?? 1,
        $id
    ]);
    
    respond(['success' => true]);
}

// PATCH /api/produits/:id/disponible - Toggle disponibilité
if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'disponible') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $parts[2];
    
    $stmt = $pdo->prepare('UPDATE produits SET disponible = ? WHERE id = ?');
    $stmt->execute([
        $input['disponible'] ?? 1,
        $id
    ]);
    
    respond(['success' => true]);
}

// DELETE /api/produits/:id - Supprimer un produit
if ($method === 'DELETE' && isset($parts[2]) && is_numeric($parts[2])) {
    $id = $parts[2];
    
    $stmt = $pdo->prepare('DELETE FROM produits WHERE id = ?');
    $stmt->execute([$id]);
    
    respond(['success' => true]);
}
