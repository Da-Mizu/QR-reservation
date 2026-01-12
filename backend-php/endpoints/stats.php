<?php
// Stats endpoints
$token = getAuthToken();
$restaurantId = 1;
if ($token) {
    $auth = verifyAuthToken($token);
    if ($auth) $restaurantId = $auth['restaurant_id'];
}

if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->prepare("SELECT 
        COUNT(*) as total_commandes,
        COALESCE(SUM(total),0) as revenus_totaux,
        COALESCE(AVG(total),0) as panier_moyen,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'en_preparation' THEN 1 ELSE 0 END) as en_preparation,
        SUM(CASE WHEN statut = 'prete' THEN 1 ELSE 0 END) as prete,
        SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as terminee,
        SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as annulee
    FROM commandes WHERE restaurant_id = ?");
    $stmt->execute([$restaurantId]);
    $row = $stmt->fetch();
    respond($row ?: []);
}
if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'tables') {
    $stmt = $pdo->prepare("SELECT table_number, COUNT(*) as nombre_commandes, COALESCE(SUM(total),0) as revenus FROM commandes WHERE table_number IS NOT NULL AND table_number != '' AND restaurant_id = ? GROUP BY table_number ORDER BY nombre_commandes DESC");
    $stmt->execute([$restaurantId]);
    respond($stmt->fetchAll());
}
if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'jours') {
    $stmt = $pdo->prepare("SELECT DATE(created_at) as date, COUNT(*) as nombre_commandes, COALESCE(SUM(total),0) as revenus FROM commandes WHERE restaurant_id = ? GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30");
    $stmt->execute([$restaurantId]);
    respond($stmt->fetchAll());
}
if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'produits') {
    $stmt = $pdo->prepare('SELECT ci.produit_id as id, p.nom, SUM(ci.quantite) as quantite_totale, COUNT(DISTINCT ci.commande_id) as nombre_commandes, SUM(ci.prix * ci.quantite) as revenus FROM commande_items ci JOIN produits p ON ci.produit_id = p.id JOIN commandes c ON ci.commande_id = c.id WHERE p.restaurant_id = ? GROUP BY ci.produit_id, p.nom ORDER BY nombre_commandes DESC LIMIT 10');
    $stmt->execute([$restaurantId]);
    respond($stmt->fetchAll());
}
