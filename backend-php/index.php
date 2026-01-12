<?php
// API PHP (Apache + MySQL) compatible avec les endpoints existants
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . '/db.php';
require __DIR__ . '/encryption.php';

$method = $_SERVER['REQUEST_METHOD'];

// Récupérer le chemin de la requête
// Si mod_rewrite est actif, PATH_INFO contient le chemin après le rewrite
// Sinon, on utilise REQUEST_URI
$path = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

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

// Authentification helpers
function getAuthToken() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/', $auth, $m)) return $m[1];
    return $_COOKIE['auth_token'] ?? null;
}

function verifyAuthToken($token) {
    // Token format: base64(restaurant_id:email:timestamp)
    $decoded = base64_decode($token, true);
    if (!$decoded) return null;
    list($rid, $email, $ts) = explode(':', $decoded, 3);
    // Vérifier que le token n'a pas plus de 7 jours
    if (time() - (int)$ts > 7 * 86400) return null;
    return ['restaurant_id' => (int)$rid, 'email' => $email, 'timestamp' => (int)$ts];
}

try {
    // Authentication
    if (isset($parts[1]) && $parts[1] === 'auth') {
        if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'login') {
            $data = json_input();
            $email = $data['email'] ?? null;
            $motdepasse = $data['motdepasse'] ?? null;
            if (!$email || !$motdepasse) respond(['error' => 'Email et mot de passe requis'], 400);
            
            $stmt = $pdo->prepare('SELECT id, email, password_hash FROM restaurants WHERE email = ? AND actif = 1');
            $stmt->execute([$email]);
            $restaurant = $stmt->fetch();
            
            if (!$restaurant) {
                respond(['error' => 'Identifiants invalides'], 401);
            }
            
            // Vérifier le mot de passe : soit hashé avec password_verify, soit en clair
            $passwordMatch = false;
            if (password_needs_rehash($restaurant['password_hash'], PASSWORD_DEFAULT) === false) {
                // C'est un hash bcrypt valide
                $passwordMatch = password_verify($motdepasse, $restaurant['password_hash']);
            } else {
                // C'est peut-être un mot de passe en clair (mode debug)
                $passwordMatch = ($motdepasse === $restaurant['password_hash']);
            }
            
            if (!$passwordMatch) {
                respond(['error' => 'Identifiants invalides'], 401);
            }
            
            // Créer un token
            $token = base64_encode($restaurant['id'] . ':' . $email . ':' . time());
            respond(['token' => $token, 'restaurant_id' => (int)$restaurant['id'], 'email' => $email], 200);
        }
        
        if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'register') {
            $data = json_input();
            $nom = $data['nom'] ?? null;
            $email = $data['email'] ?? null;
            $motdepasse = $data['motdepasse'] ?? null;
            if (!$nom || !$email || !$motdepasse) respond(['error' => 'Nom, email et mot de passe requis'], 400);
            
            $hash = password_hash($motdepasse, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO restaurants (nom, email, password_hash) VALUES (?, ?, ?)');
            try {
                $stmt->execute([$nom, $email, $hash]);
                $rid = $pdo->lastInsertId();
                $token = base64_encode($rid . ':' . $email . ':' . time());
                respond(['token' => $token, 'restaurant_id' => (int)$rid, 'email' => $email, 'message' => 'Restaurant créé avec succès'], 201);
            } catch (Exception $e) {
                if (strpos($e->getMessage(), 'Duplicate') !== false) {
                    respond(['error' => 'Email ou nom déjà utilisé'], 409);
                }
                throw $e;
            }
        }
        
        if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'verify') {
            $token = getAuthToken();
            if (!$token) respond(['error' => 'Non authentifié'], 401);
            
            $auth = verifyAuthToken($token);
            if (!$auth) respond(['error' => 'Token invalide ou expiré'], 401);
            
            respond($auth);
        }
        
        if ($method === 'POST' && isset($parts[2]) && $parts[2] === 'logout') {
            respond(['message' => 'Déconnecté avec succès']);
        }
    }

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
        // Récupérer le restaurant_id du token (ou 1 par défaut pour la compatibilité)
        $token = getAuthToken();
        $restaurantId = 1;
        if ($token) {
            $auth = verifyAuthToken($token);
            if ($auth) $restaurantId = $auth['restaurant_id'];
        } else {
            // Si pas de token, permettre override via ?restaurant=ID dans l'URL (utile pour QR mobile)
            if (isset($_GET['restaurant']) && is_numeric($_GET['restaurant'])) {
                $restaurantId = (int)$_GET['restaurant'];
            }
        }
        
        if ($method === 'POST' && !isset($parts[2])) {
            $data = json_input();
            $nom = $data['nom'] ?? null;
            $email = $data['email'] ?? null;
            $telephone = $data['telephone'] ?? null;
            $table_number = $data['table_number'] ?? null;
            $items = $data['items'] ?? null;
            $total = $data['total'] ?? null;
            
            // Récupérer le restaurant_id : priorité au token, sinon utiliser celui envoyé par le client
            $clientRestaurantId = $data['restaurant_id'] ?? null;
            if ($clientRestaurantId && $clientRestaurantId !== $restaurantId) {
                // Si un token est présent et un restaurant_id client, utiliser le token (sécurité)
                if ($token) {
                    // Token exists, use it
                    $restaurantId = $restaurantId;
                } else {
                    // No token, use client provided restaurant_id
                    $restaurantId = (int)$clientRestaurantId;
                }
            } elseif ($clientRestaurantId) {
                $restaurantId = (int)$clientRestaurantId;
            }
            
            if (!$nom || !$items || !$total) respond(['error' => 'Nom, items et total sont requis'], 400);
            $id = bin2hex(random_bytes(16));
            $nomEnc = encrypt_value($nom);
            $emailEnc = $email ? encrypt_value($email) : null;
            $telephoneEnc = $telephone ? encrypt_value($telephone) : null;
            $stmt = $pdo->prepare('INSERT INTO commandes (id, restaurant_id, nom, email, telephone, table_number, total, statut) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([$id, $restaurantId, $nomEnc, $emailEnc, $telephoneEnc, $table_number, $total, 'en_attente']);
            $stmtItem = $pdo->prepare('INSERT INTO commande_items (commande_id, produit_id, quantite, prix) VALUES (?,?,?,?)');
            foreach ($items as $item) {
                $stmtItem->execute([$id, $item['id'] ?? 0, $item['quantite'] ?? 0, $item['prix'] ?? 0]);
            }
            // Log pour debug afin de vérifier quel restaurant_id a été utilisé
            error_log("[QR-RESERVATION] Commande créée: id={$id} restaurant_id={$restaurantId} table={$table_number} total={$total}");
            respond(['id' => $id, 'message' => 'Commande créée avec succès', 'restaurant_id' => (int)$restaurantId], 201);
        }

        if ($method === 'GET' && !isset($parts[2])) {
            $stmt = $pdo->prepare('SELECT * FROM commandes WHERE restaurant_id = ? ORDER BY created_at DESC');
            $stmt->execute([$restaurantId]);
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
            $stmt = $pdo->prepare('SELECT * FROM commandes WHERE id = ? AND restaurant_id = ?');
            $stmt->execute([$parts[2], $restaurantId]);
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

        if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'liberer') {
            // Libérer une table (vider table_number)
            $stmt = $pdo->prepare('UPDATE commandes SET table_number = NULL WHERE id = ? AND restaurant_id = ?');
            $stmt->execute([$parts[2], $restaurantId]);
            if ($stmt->rowCount() === 0) respond(['error' => 'Commande non trouvée'], 404);
            respond(['message' => 'Table libérée avec succès']);
        }

        if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'statut') {
            $data = json_input();
            $statut = $data['statut'] ?? null;
            $valid = ['en_attente','en_preparation','prete','servie','en_attente_de_paiement','terminee','annulee'];
            if (!$statut || !in_array($statut, $valid, true)) respond(['error' => 'Statut invalide'], 400);
            $stmt = $pdo->prepare('UPDATE commandes SET statut = ? WHERE id = ? AND restaurant_id = ?');
            $stmt->execute([$statut, $parts[2], $restaurantId]);
            if ($stmt->rowCount() === 0) respond(['error' => 'Commande non trouvée'], 404);
            respond(['message' => 'Statut mis à jour avec succès']);
        }

    }

    // Stats
    if (isset($parts[1]) && $parts[1] === 'stats') {
        // Récupérer le restaurant_id du token
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
    }

    // (reports endpoint removed — CSV export provided client-side in Stats component)

    // Health
    if (isset($parts[1]) && $parts[1] === 'health') {
        respond(['status' => 'OK', 'message' => 'API fonctionnelle']);
    }

    // Reset DB
    if (isset($parts[1]) && $parts[1] === 'db' && isset($parts[2]) && $parts[2] === 'reset' && $method === 'POST') {
        try {
            // Drop tables (in correct order due to FKs)
            $pdo->exec('DROP TABLE IF EXISTS commande_items');
            $pdo->exec('DROP TABLE IF EXISTS commandes');
            $pdo->exec('DROP TABLE IF EXISTS produits');
            $pdo->exec('DROP TABLE IF EXISTS restaurants');
            
            // Recréer les tables avec le nouveau schéma
            $pdo->exec("CREATE TABLE restaurants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                telephone VARCHAR(20),
                adresse TEXT,
                actif TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            $pdo->exec("CREATE TABLE produits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT NOT NULL,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                prix DECIMAL(10,2) NOT NULL,
                disponible TINYINT(1) DEFAULT 1,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            $pdo->exec("CREATE TABLE commandes (
                id VARCHAR(50) PRIMARY KEY,
                restaurant_id INT NOT NULL,
                nom TEXT NOT NULL,
                email TEXT,
                telephone TEXT,
                table_number VARCHAR(50),
                total DECIMAL(10,2) NOT NULL,
                statut VARCHAR(50) DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            $pdo->exec("CREATE TABLE commande_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                commande_id VARCHAR(50) NOT NULL,
                produit_id INT NOT NULL,
                quantite INT NOT NULL DEFAULT 1,
                prix DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
                FOREIGN KEY (produit_id) REFERENCES produits(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            // Create default restaurant
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
            
            // Seed products
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
            
            respond(['message' => 'Base de données réinitialisée', 'status' => 'success', 'restaurant_id' => $restaurantId]);
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
