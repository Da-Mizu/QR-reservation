<?php
// db.php - connexion PDO MySQL et création des tables

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_PORT = getenv('DB_PORT') ?: '3306';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_NAME = getenv('DB_NAME') ?: 'qr_reservation';

$dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connexion DB impossible', 'detail' => $e->getMessage()]);
    exit;
}

// Création des tables si nécessaire
$pdo->exec("CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    image TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS commandes (
    id VARCHAR(50) PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    table_number VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS commande_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id VARCHAR(50) NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Seed minimal si aucun produit
$count = $pdo->query('SELECT COUNT(*) AS c FROM produits')->fetch()['c'] ?? 0;
if ((int)$count === 0) {
    $seed = [
        ['Pizza Margherita', 'Tomate, mozzarella, basilic', 11.50, 1, ''],
        ['Pizza Pepperoni', 'Pepperoni, mozzarella, sauce tomate', 13.00, 1, ''],
        ['Burger Maison', 'Steak, cheddar, salade, sauce maison', 10.00, 1, ''],
        ['Salade César', 'Poulet, parmesan, croûtons', 8.50, 1, ''],
        ['Frites', 'Portion de frites croustillantes', 3.50, 1, ''],
        ['Coca-Cola 33cl', 'Boisson gazeuse', 2.50, 1, ''],
        ['Eau Minérale', 'Bouteille 50cl', 1.80, 1, ''],
    ];
    $stmt = $pdo->prepare('INSERT INTO produits (nom, description, prix, disponible, image) VALUES (?,?,?,?,?)');
    foreach ($seed as $p) { $stmt->execute($p); }
}

function db() {
    global $pdo; return $pdo;
}
