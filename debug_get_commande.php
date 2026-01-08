<?php
require __DIR__ . '/backend-php/db.php';
$id = $argv[1] ?? ($_GET['id'] ?? '');
if (!$id) {
	echo json_encode(['error' => 'missing id']);
	exit(1);
}
$stmt = $pdo->prepare('SELECT id, restaurant_id, table_number, total, created_at FROM commandes WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($row, JSON_PRETTY_PRINT) . PHP_EOL;
