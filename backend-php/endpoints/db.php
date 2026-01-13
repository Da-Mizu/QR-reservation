// DB reset and seed endpoints
if (isset($parts[2]) && $parts[2] === 'reset' && $method === 'POST') {
    try {
        $pdo->exec('DROP TABLE IF EXISTS commande_items');
        $pdo->exec('DROP TABLE IF EXISTS commandes');
        $pdo->exec('DROP TABLE IF EXISTS produits');
        $pdo->exec('DROP TABLE IF EXISTS restaurants');

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
            categorie VARCHAR(100) DEFAULT NULL,
            disponible TINYINT(1) DEFAULT 1,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
            INDEX idx_categorie (categorie)
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
