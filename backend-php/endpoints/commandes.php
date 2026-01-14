<?php
// Commandes endpoints
// Determine restaurantId from token or query param
$token = getAuthToken();
$restaurantId = 1;
if ($token) {
    $auth = verifyAuthToken($token);
    if ($auth) $restaurantId = $auth['restaurant_id'];
} else {
    if (isset($_GET['restaurant']) && is_numeric($_GET['restaurant'])) {
        $restaurantId = (int)$_GET['restaurant'];
    }
}

if ($method === 'POST' && !isset($parts[2])) {
    $data = json_input();
    $nom = $data['nom'] ?? null;
    $email = $data['email'] ?? null;
    $telephone = $data['telephone'] ?? null;
    $table_number = $data['table_number'] ?? null;
    $items = $data['items'] ?? null;
    $total = $data['total'] ?? null;
    $clientRestaurantId = $data['restaurant_id'] ?? null;
    if ($clientRestaurantId && $clientRestaurantId !== $restaurantId) {
        if ($token) {
            $restaurantId = $restaurantId;
        } else {
            $restaurantId = (int)$clientRestaurantId;
        }
    } elseif ($clientRestaurantId) {
        $restaurantId = (int)$clientRestaurantId;
    }
    // items (array) and total are required; nom can be null (optional from admin)
    if (!is_array($items) || count($items) === 0 || $total === null) respond(['error' => 'Items et total sont requis'], 400);

    // Wrap DB operations in try/catch and log request for debugging 500 errors
    try {
        error_log('[QR-RESERVATION] POST /api/commandes payload: ' . json_encode($data));
        $id = bin2hex(random_bytes(16));
        // Ensure 'nom' is not null when inserting (DB has NOT NULL constraint)
        $nomEnc = encrypt_value($nom ?? '');
        $emailEnc = $email ? encrypt_value($email) : null;
        $telephoneEnc = $telephone ? encrypt_value($telephone) : null;
        $stmt = $pdo->prepare('INSERT INTO commandes (id, restaurant_id, nom, email, telephone, table_number, total, statut) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([$id, $restaurantId, $nomEnc, $emailEnc, $telephoneEnc, $table_number, $total, 'en_attente']);
        $stmtItem = $pdo->prepare('INSERT INTO commande_items (commande_id, produit_id, quantite, prix) VALUES (?,?,?,?)');
        foreach ($items as $item) {
            $stmtItem->execute([$id, $item['id'] ?? 0, $item['quantite'] ?? 0, $item['prix'] ?? 0]);
        }
        error_log("[QR-RESERVATION] Commande créée: id={$id} restaurant_id={$restaurantId} table={$table_number} total={$total}");
        respond(['id' => $id, 'message' => 'Commande créée avec succès', 'restaurant_id' => (int)$restaurantId], 201);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur création commande: ' . $e->getMessage());
        // Return generic 500 message but include brief hint for devs
        respond(['error' => 'Erreur serveur lors de la création de la commande'], 500);
    }
}

if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->prepare('SELECT * FROM commandes WHERE restaurant_id = ? ORDER BY created_at DESC');
    $stmt->execute([$restaurantId]);
    $rows = $stmt->fetchAll();
    $out = [];
    // prepare restaurant lookup
    $restStmt = $pdo->prepare('SELECT id, nom, email, telephone, adresse FROM restaurants WHERE id = ? LIMIT 1');
    foreach ($rows as $row) {
        $itemsStmt = $pdo->prepare('SELECT ci.produit_id as id, p.nom, ci.prix, ci.quantite FROM commande_items ci JOIN produits p ON ci.produit_id = p.id WHERE ci.commande_id = ?');
        $itemsStmt->execute([$row['id']]);
        $row['items'] = $itemsStmt->fetchAll();
        $row['nom'] = $row['nom'] ? decrypt_value($row['nom']) : null;
        $row['email'] = $row['email'] ? decrypt_value($row['email']) : null;
        $row['telephone'] = $row['telephone'] ? decrypt_value($row['telephone']) : null;
        $row['table_number'] = $row['table_number'] ?: null;
        // attach restaurant info
        $restStmt->execute([(int)$row['restaurant_id']]);
        $r = $restStmt->fetch();
        if ($r) {
            $row['restaurant'] = [
                'id' => (int)$r['id'],
                'nom' => $r['nom'],
                'email' => $r['email'],
                'telephone' => $r['telephone'],
                'adresse' => $r['adresse']
            ];
        } else {
            $row['restaurant'] = null;
        }
        $out[] = $row;
    }
    respond($out);
}

if ($method === 'GET' && isset($parts[2])) {
    $stmt = $pdo->prepare('SELECT * FROM commandes WHERE id = ? AND restaurant_id = ?');
    $stmt->execute([$parts[2], $restaurantId]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'Commande non trouvée'], 404);
    $itemsStmt = $pdo->prepare('SELECT ci.produit_id as id, p.nom, ci.prix, ci.quantite FROM commande_items ci JOIN produits p ON ci.produit_id = p.id WHERE ci.commande_id = ?');
    $itemsStmt->execute([$row['id']]);
    $row['items'] = $itemsStmt->fetchAll();
    $row['nom'] = $row['nom'] ? decrypt_value($row['nom']) : null;
    $row['email'] = $row['email'] ? decrypt_value($row['email']) : null;
    $row['telephone'] = $row['telephone'] ? decrypt_value($row['telephone']) : null;
    // attach restaurant info for this commande
    $restStmt = $pdo->prepare('SELECT id, nom, email, telephone, adresse FROM restaurants WHERE id = ? LIMIT 1');
    $restStmt->execute([(int)$row['restaurant_id']]);
    $r = $restStmt->fetch();
    if ($r) {
        $row['restaurant'] = [
            'id' => (int)$r['id'],
            'nom' => $r['nom'],
            'email' => $r['email'],
            'telephone' => $r['telephone'],
            'adresse' => $r['adresse']
        ];
    } else {
        $row['restaurant'] = null;
    }
    respond($row);
}

if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'liberer') {
    $stmt = $pdo->prepare('UPDATE commandes SET table_number = NULL WHERE id = ? AND restaurant_id = ?');
    $stmt->execute([$parts[2], $restaurantId]);
    if ($stmt->rowCount() === 0) respond(['error' => 'Commande non trouvée'], 404);
    respond(['message' => 'Table libérée avec succès']);
}

if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'statut') {
    $data = json_input();
    $statut = $data['statut'] ?? null;
    $valid = ['en_attente','en_preparation','prete','servie','en_attente_de_paiement','terminee','annulee'];
    if (!$statut || !in_array($statut, $valid, true)) respond(['error' => 'Statut invalide'], 400);
    $stmt = $pdo->prepare('UPDATE commandes SET statut = ? WHERE id = ? AND restaurant_id = ?');
    $stmt->execute([$statut, $parts[2], $restaurantId]);
    if ($stmt->rowCount() === 0) respond(['error' => 'Commande non trouvée'], 404);
    respond(['message' => 'Statut mis à jour avec succès']);
}
