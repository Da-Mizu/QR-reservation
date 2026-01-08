<?php
// API PHP (Apache + MySQL) compatible avec les endpoints existants
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . '/db.php';
require __DIR__ . '/encryption.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Découpe l'URL et ne garde que ce qui suit "api" pour supporter un sous-dossier (ex: /QR-reservation/...)
$rawParts = array_values(array_filter(explode('/', $path)));
$apiIndex = array_search('api', $rawParts, true);
$parts = $apiIndex === false ? [] : array_slice($rawParts, $apiIndex);

function json_input() {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    return $data ?: [];
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Router: doit commencer par api
if (!isset($parts[0]) || $parts[0] !== 'api') {
    respond(['error' => 'Not found'], 404);
}

$pdo = db();

try {
    // Produits
    if (isset($parts[1]) && $parts[1] === 'produits') {
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
    }

    // Commandes
    if (isset($parts[1]) && $parts[1] === 'commandes') {
        if ($method === 'POST' && !isset($parts[2])) {
            $data = json_input();
            $nom = $data['nom'] ?? null;
            $email = $data['email'] ?? null;
            $telephone = $data['telephone'] ?? null;
            $table_number = $data['table_number'] ?? null;
            $items = $data['items'] ?? null;
            $total = $data['total'] ?? null;
            if (!$nom || !$items || !$total) respond(['error' => 'Nom, items et total sont requis'], 400);
            $id = bin2hex(random_bytes(16));
            $nomEnc = encrypt_value($nom);
            $emailEnc = $email ? encrypt_value($email) : null;
            $telephoneEnc = $telephone ? encrypt_value($telephone) : null;
            $stmt = $pdo->prepare('INSERT INTO commandes (id, nom, email, telephone, table_number, total, statut) VALUES (?,?,?,?,?,?,?)');
            $stmt->execute([$id, $nomEnc, $emailEnc, $telephoneEnc, $table_number, $total, 'en_attente']);
            $stmtItem = $pdo->prepare('INSERT INTO commande_items (commande_id, produit_id, quantite, prix) VALUES (?,?,?,?)');
            foreach ($items as $item) {
                $stmtItem->execute([$id, $item['id'] ?? 0, $item['quantite'] ?? 0, $item['prix'] ?? 0]);
            }
            respond(['id' => $id, 'message' => 'Commande créée avec succès'], 201);
        }

        if ($method === 'GET' && !isset($parts[2])) {
            $stmt = $pdo->query('SELECT * FROM commandes ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            $out = [];
            foreach ($rows as $row) {
                $itemsStmt = $pdo->prepare('SELECT ci.produit_id as id, p.nom, ci.prix, ci.quantite FROM commande_items ci JOIN produits p ON ci.produit_id = p.id WHERE ci.commande_id = ?');
                $itemsStmt->execute([$row['id']]);
                $row['items'] = $itemsStmt->fetchAll();
                $row['nom'] = $row['nom'] ? decrypt_value($row['nom']) : null;
                $row['email'] = $row['email'] ? decrypt_value($row['email']) : null;
                $row['telephone'] = $row['telephone'] ? decrypt_value($row['telephone']) : null;
                $row['table_number'] = $row['table_number'] ?: null;
                $out[] = $row;
            }
            respond($out);
        }

        if ($method === 'GET' && isset($parts[2])) {
            $stmt = $pdo->prepare('SELECT * FROM commandes WHERE id = ?');
            $stmt->execute([$parts[2]]);
            $row = $stmt->fetch();
            if (!$row) respond(['error' => 'Commande non trouvée'], 404);
            $itemsStmt = $pdo->prepare('SELECT ci.produit_id as id, p.nom, ci.prix, ci.quantite FROM commande_items ci JOIN produits p ON ci.produit_id = p.id WHERE ci.commande_id = ?');
            $itemsStmt->execute([$row['id']]);
            $row['items'] = $itemsStmt->fetchAll();
            $row['nom'] = $row['nom'] ? decrypt_value($row['nom']) : null;
            $row['email'] = $row['email'] ? decrypt_value($row['email']) : null;
            $row['telephone'] = $row['telephone'] ? decrypt_value($row['telephone']) : null;
            respond($row);
        }

        if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'statut') {
            $data = json_input();
            $statut = $data['statut'] ?? null;
            $valid = ['en_attente','en_preparation','prete','terminee','annulee'];
            if (!$statut || !in_array($statut, $valid, true)) respond(['error' => 'Statut invalide'], 400);
            $stmt = $pdo->prepare('UPDATE commandes SET statut = ? WHERE id = ?');
            $stmt->execute([$statut, $parts[2]]);
            if ($stmt->rowCount() === 0) respond(['error' => 'Commande non trouvée'], 404);
            respond(['message' => 'Statut mis à jour avec succès']);
        }
    }

    // Stats
    if (isset($parts[1]) && $parts[1] === 'stats') {
        if ($method === 'GET' && !isset($parts[2])) {
            $row = $pdo->query("SELECT 
                COUNT(*) as total_commandes,
                COALESCE(SUM(total),0) as revenus_totaux,
                COALESCE(AVG(total),0) as panier_moyen,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut = 'en_preparation' THEN 1 ELSE 0 END) as en_preparation,
                SUM(CASE WHEN statut = 'prete' THEN 1 ELSE 0 END) as prete,
                SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as terminee,
                SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as annulee
            FROM commandes" )->fetch();
            respond($row ?: []);
        }
        if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'tables') {
            $stmt = $pdo->query("SELECT table_number, COUNT(*) as nombre_commandes, COALESCE(SUM(total),0) as revenus FROM commandes WHERE table_number IS NOT NULL AND table_number != '' GROUP BY table_number ORDER BY nombre_commandes DESC");
            respond($stmt->fetchAll());
        }
        if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'jours') {
            $stmt = $pdo->query("SELECT DATE(created_at) as date, COUNT(*) as nombre_commandes, COALESCE(SUM(total),0) as revenus FROM commandes GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30");
            respond($stmt->fetchAll());
        }
        if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'produits') {
            $stmt = $pdo->query('SELECT ci.produit_id as id, p.nom, SUM(ci.quantite) as quantite_totale, COUNT(DISTINCT ci.commande_id) as nombre_commandes, SUM(ci.prix * ci.quantite) as revenus FROM commande_items ci JOIN produits p ON ci.produit_id = p.id GROUP BY ci.produit_id, p.nom ORDER BY nombre_commandes DESC LIMIT 10');
            respond($stmt->fetchAll());
        }
    }

    // Health
    if (isset($parts[1]) && $parts[1] === 'health') {
        respond(['status' => 'OK', 'message' => 'API fonctionnelle']);
    }

    // Reset DB
    if (isset($parts[1]) && $parts[1] === 'db' && isset($parts[2]) && $parts[2] === 'reset' && $method === 'POST') {
        try {
            $pdo->exec('DROP TABLE IF EXISTS commande_items');
            $pdo->exec('DROP TABLE IF EXISTS commandes');
            $pdo->exec('DROP TABLE IF EXISTS produits');
            // Recréer les tables
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
            respond(['message' => 'Base de données réinitialisée', 'status' => 'success']);
        } catch (Exception $e) {
            respond(['error' => 'Erreur lors de la réinitialisation: ' . $e->getMessage()], 500);
        }
    }

    // Seed menu
    if (isset($parts[1]) && $parts[1] === 'menu' && isset($parts[2]) && $parts[2] === 'seed' && $method === 'POST') {
        $seed = [
            ['Pizza Margherita', 'Tomate, mozzarella, basilic', 11.50, 1, ''],
            ['Pizza Pepperoni', 'Pepperoni, mozzarella, sauce tomate', 13.00, 1, ''],
            ['Burger Maison', 'Steak, cheddar, salade, sauce maison', 10.00, 1, ''],
            ['Salade César', 'Poulet, parmesan, croûtons', 8.50, 1, ''],
            ['Frites', 'Portion de frites croustillantes', 3.50, 1, ''],
            ['Coca-Cola 33cl', 'Boisson gazeuse', 2.50, 1, ''],
            ['Eau Minérale', 'Bouteille 50cl', 1.80, 1, ''],
        ];
        $pdo->exec('DELETE FROM produits');
        $stmt = $pdo->prepare('INSERT INTO produits (nom, description, prix, disponible, image) VALUES (?,?,?,?,?)');
        foreach ($seed as $p) { $stmt->execute($p); }
        respond(['message' => 'Menu seedé', 'count' => count($seed)]);
    }

    respond(['error' => 'Not found'], 404);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}
