<?php
// Produits endpoints
if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->query('SELECT * FROM produits WHERE disponible = 1');
    respond($stmt->fetchAll());
}
if ($method === 'GET' && isset($parts[2])) {
    $stmt = $pdo->prepare('SELECT * FROM produits WHERE id = ?');
    $stmt->execute([$parts[2]]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'Produit non trouvé'], 404);
    respond($row);
}
