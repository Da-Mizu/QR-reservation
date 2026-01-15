<?php
include 'db.php';

echo "=== Structure de la table COMMANDES ===\n";
$stmt = $pdo->query('DESCRIBE commandes');
$cols = $stmt->fetchAll();
foreach($cols as $col) {
    echo $col['Field'] . ' (' . $col['Type'] . ")\n";
}

echo "\n=== Colonnes présentes ===\n";
$required = ['id', 'restaurant_id', 'statut', 'created_at', 'updated_at', 'total'];
foreach($required as $col) {
    $found = array_filter($cols, fn($c) => $c['Field'] === $col);
    echo "$col: " . ($found ? "✓" : "✗") . "\n";
}
?>
