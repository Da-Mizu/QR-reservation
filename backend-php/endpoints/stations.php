<?php
/**
 * Stations Management Endpoint
 * CRUD operations for kitchen stations
 * Included from index.php - uses respond(), json_input(), getAuthToken(), verifyAuthToken()
 */

// Get restaurant ID from token
$token = getAuthToken();
$restaurantId = 1;
if ($token) {
    $auth = verifyAuthToken($token);
    if ($auth) $restaurantId = $auth['restaurant_id'];
}

// GET /api/stations - List all stations for restaurant
if ($method === 'GET' && (!isset($parts[2]) || $parts[2] !== 'assign')) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, restaurant_id, nom, description, couleur
            FROM stations
            WHERE restaurant_id = ?
            ORDER BY nom ASC
        ");
        $stmt->execute([$restaurantId]);
        $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond($stations);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur GET stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors du chargement des postes'], 500);
    }
}

// POST /api/stations - Create new station
elseif ($method === 'POST' && !isset($parts[2])) {
    try {
        $data = json_input();
        $nom = $data['nom'] ?? null;
        $description = $data['description'] ?? '';
        $couleur = $data['couleur'] ?? '#0d6efd';

        if (!$nom) {
            respond(['error' => 'Le nom du poste est requis'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO stations (restaurant_id, nom, description, couleur)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$restaurantId, $nom, $description, $couleur]);
        
        respond([
            'id' => $pdo->lastInsertId(),
            'restaurant_id' => $restaurantId,
            'nom' => $nom,
            'description' => $description,
            'couleur' => $couleur
        ], 201);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur POST stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la création du poste'], 500);
    }
}

// PATCH /api/stations/{id} - Update station
elseif ($method === 'PATCH' && isset($parts[2])) {
    try {
        $stationId = (int)$parts[2];
        $data = json_input();

        // Verify ownership
        $stmt = $pdo->prepare("SELECT restaurant_id FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);
        $station = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$station || $station['restaurant_id'] !== $restaurantId) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        $updates = [];
        $params = [];
        if (isset($data['nom'])) {
            $updates[] = 'nom = ?';
            $params[] = $data['nom'];
        }
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
        }
        if (isset($data['couleur'])) {
            $updates[] = 'couleur = ?';
            $params[] = $data['couleur'];
        }

        if (empty($updates)) {
            respond(['error' => 'Aucune donnée à mettre à jour'], 400);
        }

        $params[] = $stationId;
        $sql = 'UPDATE stations SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        respond(['id' => $stationId, 'success' => true]);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur PATCH stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

// DELETE /api/stations/{id} - Delete station
elseif ($method === 'DELETE' && isset($parts[2])) {
    try {
        $stationId = (int)$parts[2];

        // Verify ownership
        $stmt = $pdo->prepare("SELECT restaurant_id FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);
        $station = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$station || $station['restaurant_id'] !== $restaurantId) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        // Check if station is used by products
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count FROM produits 
            WHERE station = (SELECT nom FROM stations WHERE id = ?)
        ");
        $stmt->execute([$stationId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['count'] > 0) {
            respond(['error' => 'Ce poste est utilisé par des produits. Veuillez réassigner d\'abord.'], 409);
        }

        $stmt = $pdo->prepare("DELETE FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);

        respond(['id' => $stationId, 'success' => true]);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur DELETE stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la suppression'], 500);
    }
}

// POST /api/stations/assign - Assign products to a station
elseif ($method === 'POST' && isset($parts[2]) && $parts[2] === 'assign') {
    try {
        $data = json_input();
        $stationNom = $data['station'] ?? null;
        $productIds = $data['product_ids'] ?? [];

        if (!$stationNom || empty($productIds)) {
            respond(['error' => 'Station et product IDs requis'], 400);
        }

        // Verify station exists and belongs to restaurant
        $stmt = $pdo->prepare("
            SELECT id FROM stations 
            WHERE restaurant_id = ? AND nom = ?
        ");
        $stmt->execute([$restaurantId, $stationNom]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        // Update products
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $params = array_merge([$stationNom], $productIds);
        $stmt = $pdo->prepare("
            UPDATE produits SET station = ? 
            WHERE id IN ($placeholders)
        ");
        $stmt->execute($params);

        respond(['success' => true, 'updated' => count($productIds)], 200);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur POST stations/assign: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de l\'assignation'], 500);
    }
}

else {
    respond(['error' => 'Endpoint non trouvé'], 404);
}
?>

// GET /api/stations - List all stations for restaurant
if ($method === 'GET' && (!isset($parts[2]) || $parts[2] !== 'assign')) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, restaurant_id, nom, description, couleur
            FROM stations
            WHERE restaurant_id = ?
            ORDER BY nom ASC
        ");
        $stmt->execute([$restaurantId]);
        $stations = $stmt->fetchAll();
        respond($stations);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur GET stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors du chargement des postes'], 500);
    }
}

// POST /api/stations - Create new station
else if ($method === 'POST' && !isset($parts[2])) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $nom = $data['nom'] ?? null;
        $description = $data['description'] ?? '';
        $couleur = $data['couleur'] ?? '#0d6efd';

        if (!$nom) {
            respond(['error' => 'Le nom du poste est requis'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO stations (restaurant_id, nom, description, couleur)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$restaurantId, $nom, $description, $couleur]);
        
        respond([
            'id' => $pdo->lastInsertId(),
            'restaurant_id' => $restaurantId,
            'nom' => $nom,
            'description' => $description,
            'couleur' => $couleur
        ], 201);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur POST stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la création du poste'], 500);
    }
}

// PATCH /api/stations/{id} - Update station
else if ($method === 'PATCH' && isset($parts[2])) {
    try {
        $stationId = (int)$parts[2];
        $data = json_decode(file_get_contents('php://input'), true);

        // Verify ownership
        $stmt = $pdo->prepare("SELECT restaurant_id FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);
        $station = $stmt->fetch();
        if (!$station || $station['restaurant_id'] !== $restaurantId) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        $updates = [];
        $params = [];
        if (isset($data['nom'])) {
            $updates[] = 'nom = ?';
            $params[] = $data['nom'];
        }
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
        }
        if (isset($data['couleur'])) {
            $updates[] = 'couleur = ?';
            $params[] = $data['couleur'];
        }

        if (empty($updates)) {
            respond(['error' => 'Aucune donnée à mettre à jour'], 400);
        }

        $params[] = $stationId;
        $sql = 'UPDATE stations SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        respond(['id' => $stationId, 'success' => true]);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur PATCH stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

// DELETE /api/stations/{id} - Delete station
else if ($method === 'DELETE' && isset($parts[2])) {
    try {
        $stationId = (int)$parts[2];

        // Verify ownership
        $stmt = $pdo->prepare("SELECT restaurant_id FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);
        $station = $stmt->fetch();
        if (!$station || $station['restaurant_id'] !== $restaurantId) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        // Check if station is used by products
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count FROM produits 
            WHERE station = (SELECT nom FROM stations WHERE id = ?)
        ");
        $stmt->execute([$stationId]);
        $result = $stmt->fetch();
        if ($result['count'] > 0) {
            respond(['error' => 'Ce poste est utilisé par des produits. Veuillez réassigner d\'abord.'], 409);
        }

        $stmt = $pdo->prepare("DELETE FROM stations WHERE id = ?");
        $stmt->execute([$stationId]);

        respond(['id' => $stationId, 'success' => true]);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur DELETE stations: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de la suppression'], 500);
    }
}

// POST /api/stations/assign - Assign products to a station
else if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'assign') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $stationNom = $data['station'] ?? null;
        $productIds = $data['product_ids'] ?? [];

        if (!$stationNom || empty($productIds)) {
            respond(['error' => 'Station et product IDs requis'], 400);
        }

        // Verify station exists and belongs to restaurant
        $stmt = $pdo->prepare("
            SELECT id FROM stations 
            WHERE restaurant_id = ? AND nom = ?
        ");
        $stmt->execute([$restaurantId, $stationNom]);
        if (!$stmt->fetch()) {
            respond(['error' => 'Poste non trouvé'], 404);
        }

        // Update products
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $params = array_merge([$stationNom], $productIds);
        $stmt = $pdo->prepare("
            UPDATE produits SET station = ? 
            WHERE id IN ($placeholders)
        ");
        $stmt->execute($params);

        respond(['success' => true, 'updated' => count($productIds)], 200);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur POST stations/assign: ' . $e->getMessage());
        respond(['error' => 'Erreur lors de l\'assignation'], 500);
    }
}

else {
    respond(['error' => 'Endpoint non trouvé'], 404);
}
?>
