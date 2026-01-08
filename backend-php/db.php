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

// Table restaurants
$pdo->exec("CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    actif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Table produits avec restaurant_id
$pdo->exec("CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL DEFAULT 1,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Table commandes avec restaurant_id
$pdo->exec("CREATE TABLE IF NOT EXISTS commandes (
    id VARCHAR(50) PRIMARY KEY,
    restaurant_id INT NOT NULL DEFAULT 1,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    table_number VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Table commande_items
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

// Migration: Ajouter restaurant_id s'il n'existe pas
try {
    $pdo->query("ALTER TABLE produits ADD COLUMN restaurant_id INT NOT NULL DEFAULT 1 AFTER id");
    $pdo->query("ALTER TABLE produits ADD FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE");
} catch (Exception $e) {
    // Colonne existe déjà, on ignore
}

try {
    $pdo->query("ALTER TABLE commandes ADD COLUMN restaurant_id INT NOT NULL DEFAULT 1 AFTER id");
    $pdo->query("ALTER TABLE commandes ADD FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE");
} catch (Exception $e) {
    // Colonne existe déjà, on ignore
};

// Seed: Créer un restaurant par défaut si aucun n'existe
$restaurantCount = $pdo->query('SELECT COUNT(*) AS c FROM restaurants')->fetch()['c'] ?? 0;
if ((int)$restaurantCount === 0) {
    $defaultRestaurant = [
        'nom' => 'Restaurant Demo',
        'email' => 'admin@demo.local',
        'password_hash' => password_hash('demo123', PASSWORD_DEFAULT),
        'telephone' => '01 23 45 67 89',
        'adresse' => 'Adresse du restaurant'
    ];
    $stmt = $pdo->prepare('INSERT INTO restaurants (nom, email, password_hash, telephone, adresse) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute(array_values($defaultRestaurant));
    $restaurantId = $pdo->lastInsertId();
} else {
    $restaurantId = $pdo->query('SELECT id FROM restaurants LIMIT 1')->fetch()['id'];
}

// Seed produits si aucun n'existe
$productCount = $pdo->query('SELECT COUNT(*) AS c FROM produits')->fetch()['c'] ?? 0;
if ((int)$productCount === 0) {
    $seed = [
        ['Pizza Margherita', 'Tomate, mozzarella, basilic', 11.50, 1, ''],
        ['Pizza Pepperoni', 'Pepperoni, mozzarella, sauce tomate', 13.00, 1, ''],
        ['Burger Maison', 'Steak, cheddar, salade, sauce maison', 10.00, 1, ''],
        ['Salade César', 'Poulet, parmesan, croûtons', 8.50, 1, ''],
        ['Frites', 'Portion de frites croustillantes', 3.50, 1, ''],
        ['Coca-Cola 33cl', 'Boisson gazeuse', 2.50, 1, ''],
        ['Eau Minérale', 'Bouteille 50cl', 1.80, 1, ''],
    ];
    $stmt = $pdo->prepare('INSERT INTO produits (restaurant_id, nom, description, prix, disponible, image) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($seed as $p) { 
        $stmt->execute(array_merge([$restaurantId], $p)); 
    }
}

function db() {
    global $pdo; return $pdo;
}
