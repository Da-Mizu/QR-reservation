<?php
/**
 * SSE Endpoint for KDS (Kitchen Display System)
 * Streams order events and status changes in real-time
 */

set_time_limit(0);
ignore_user_abort(true);

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disable proxy buffering

// Load core files
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../encryption.php';

// Parse auth token from query param or fail
$token = $_GET['token'] ?? null;
if (!$token) {
    http_response_code(401);
    echo "data: " . json_encode(['error' => 'Unauthorized']) . "\n\n";
    exit;
}

// Validate token (reuse or adapt your auth logic)
try {
    $tokenParts = explode('.', base64_decode($token));
    if (count($tokenParts) < 2) throw new Exception('Invalid token format');
    $restaurantId = (int)$tokenParts[0];
} catch (Exception $e) {
    http_response_code(401);
    echo "data: " . json_encode(['error' => 'Invalid token']) . "\n\n";
    exit;
}

$pdo = getDatabaseConnection();

// Send initial state: all active orders
echo "event: initial_state\n";
echo "retry: 5000\n";
$stmt = $pdo->prepare("
    SELECT 
        c.id, c.restaurant_id, c.nom, c.table_number, c.total, c.statut, 
        c.created_at, c.updated_at, c.notes,
        COALESCE(p.station, 'general') as station,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', ci.produit_id,
                'nom', p.nom,
                'prix', ci.prix,
                'quantite', ci.quantite,
                'station', COALESCE(p.station, 'general')
            )
        ) as items
    FROM commandes c
    LEFT JOIN commande_items ci ON c.id = ci.commande_id
    LEFT JOIN produits p ON ci.produit_id = p.id
    WHERE c.restaurant_id = ? AND c.statut IN ('en_attente', 'en_preparation', 'prete')
    GROUP BY c.id
    ORDER BY c.created_at ASC
");
$stmt->execute([$restaurantId]);
$orders = $stmt->fetchAll();
echo "data: " . json_encode($orders) . "\n\n";
@ob_flush();
@flush();

// Poll for changes every 2 seconds
$lastCheck = time();
while (true) {
    $now = time();
    
    // Check for new/updated orders every 2 seconds
    if ($now - $lastCheck >= 2) {
        $lastCheck = $now;
        
        // Fetch all active orders (simpler polling approach)
        // In production, use DB timestamps/triggers or Redis pub/sub for efficiency
        $stmt = $pdo->prepare("
            SELECT 
                c.id, c.restaurant_id, c.nom, c.table_number, c.total, c.statut, 
                c.created_at, c.updated_at, c.notes,
                COALESCE(p.station, 'general') as station,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', ci.produit_id,
                        'nom', p.nom,
                        'prix', ci.prix,
                        'quantite', ci.quantite,
                        'station', COALESCE(p.station, 'general')
                    )
                ) as items
            FROM commandes c
            LEFT JOIN commande_items ci ON c.id = ci.commande_id
            LEFT JOIN produits p ON ci.produit_id = p.id
            WHERE c.restaurant_id = ? AND c.statut IN ('en_attente', 'en_preparation', 'prete')
            GROUP BY c.id
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$restaurantId]);
        $currentOrders = $stmt->fetchAll();
        
        // Send update event
        if (!empty($currentOrders)) {
            echo "event: orders_update\n";
            echo "data: " . json_encode($currentOrders) . "\n\n";
            @ob_flush();
            @flush();
        }
    }
    
    // Send heartbeat to keep connection alive
    echo ": keep-alive\n\n";
    @ob_flush();
    @flush();
    
    usleep(500000); // 0.5s check interval
}
?>
