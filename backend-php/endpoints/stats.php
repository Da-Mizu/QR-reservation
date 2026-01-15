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

if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'advanced') {
    try {
        $stats = [];

            // Range support via ?range=7d|30d|6m|1y (default 7d)
            $range = isset($_GET['range']) ? $_GET['range'] : '7d';
            switch ($range) {
                case '1d':
                case 'today':
                    $interval_sql = '1 DAY';
                    break;
                case '30d':
                case '1m':
                    $interval_sql = '30 DAY';
                    break;
                case '6m':
                    $interval_sql = '6 MONTH';
                    break;
                case '1y':
                    $interval_sql = '1 YEAR';
                    break;
                case '7d':
                default:
                    $interval_sql = '7 DAY';
            }
        // 1. Temps moyen de service (en minutes, des 7 derniers jours)
        // FIXME: Utilise 30 min par défaut si updated_at n'existe pas
        $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_servies
                FROM commandes 
                WHERE restaurant_id = ? 
                  AND statut IN ('servie', 'terminee')
                  AND created_at >= DATE_SUB(NOW(), INTERVAL $interval_sql)
        ");
        $stmt->execute([$restaurantId]);
        $result = $stmt->fetch();
        // Temps moyen simulé : 25-35 minutes selon activité
        $temps_moyen = $result['total_servies'] > 10 ? 30 : ($result['total_servies'] > 0 ? 25 : 0);
        $stats['temps_moyen_service_minutes'] = $temps_moyen;

                // 2. Produits les plus vendus (top 10 des 30 derniers jours)
                // Inclure toutes les commandes non annulées afin que les nouvelles commandes apparaissent immédiatement
                $stmt = $pdo->prepare("
                        SELECT 
                                p.id,
                                p.nom,
                                p.prix,
                                p.image,
                                SUM(ci.quantite) as total_vendu,
                                COUNT(DISTINCT ci.commande_id) as nombre_commandes,
                                SUM(ci.quantite * ci.prix) as revenu_total
                        FROM commande_items ci
                        JOIN produits p ON ci.produit_id = p.id
                        JOIN commandes c ON ci.commande_id = c.id
                        WHERE c.restaurant_id = ?
                                AND c.statut != 'annulee'
                                AND c.created_at >= DATE_SUB(NOW(), INTERVAL $interval_sql)
                        GROUP BY p.id, p.nom, p.prix, p.image
                        ORDER BY total_vendu DESC
                        LIMIT 10
                ");
        $stmt->execute([$restaurantId]);
        $stats['produits_populaires'] = $stmt->fetchAll();

        // 3. Heures de pointe (distribution des commandes par heure, 7 derniers jours)
        $stmt = $pdo->prepare("
            SELECT 
                HOUR(created_at) as heure,
                COUNT(*) as nombre_commandes,
                SUM(total) as revenu_total
            FROM commandes
            WHERE restaurant_id = ?
                  AND created_at >= DATE_SUB(NOW(), INTERVAL $interval_sql)
            GROUP BY HOUR(created_at)
            ORDER BY heure
        ");
        $stmt->execute([$restaurantId]);
        $heuresData = $stmt->fetchAll();
        
        // remplir toutes les heures de 0 à 23 avec 0 si manquantes
        $heuresMap = [];
        for ($i = 0; $i < 24; $i++) {
            $heuresMap[$i] = [
                'heure' => $i,
                'nombre_commandes' => 0,
                'revenu_total' => 0
            ];
        }
        foreach ($heuresData as $h) {
            $idx = (int)$h['heure'];
            $heuresMap[$idx] = [
                'heure' => $idx,
                'nombre_commandes' => (int)$h['nombre_commandes'],
                'revenu_total' => (float)$h['revenu_total']
            ];
        }
        $stats['heures_pointe'] = array_values($heuresMap);

        // 4. Stats générales (aujourd'hui vs période)
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_commandes,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as commandes_aujourdhui,
                SUM(CASE WHEN statut = 'terminee' THEN total ELSE 0 END) as revenu_total,
                SUM(CASE WHEN statut = 'terminee' AND DATE(created_at) = CURDATE() THEN total ELSE 0 END) as revenu_aujourdhui,
                AVG(CASE WHEN statut = 'terminee' THEN total ELSE NULL END) as panier_moyen
            FROM commandes
            WHERE restaurant_id = ?
                  AND created_at >= DATE_SUB(NOW(), INTERVAL $interval_sql)
        ");
        $stmt->execute([$restaurantId]);
        $stats['generales'] = $stmt->fetch();

        // 5. Évolution des commandes (7 derniers jours)
        $stmt = $pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as nombre_commandes,
                SUM(total) as revenu
            FROM commandes
            WHERE restaurant_id = ?
                  AND created_at >= DATE_SUB(NOW(), INTERVAL $interval_sql)
            GROUP BY DATE(created_at)
            ORDER BY date
        ");
        $stmt->execute([$restaurantId]);
        $stats['evolution_7j'] = $stmt->fetchAll();

        respond($stats);
    } catch (Exception $e) {
        error_log('[QR-RESERVATION] Erreur stats advanced: ' . $e->getMessage());
        respond(['error' => 'Erreur lors du calcul des statistiques'], 500);
    }
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
