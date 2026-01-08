<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

try {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, restaurant_id, nom, email, telephone, table_number, total, statut, created_at FROM commandes ORDER BY created_at DESC LIMIT 50');
    $stmt->execute();
    $commandes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'commandes' => $commandes]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
