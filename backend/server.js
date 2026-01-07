const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialiser la base de données
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Créer les tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS commandes (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    table_number TEXT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ajouter la colonne table_number si elle n'existe pas (migration)
  db.all("PRAGMA table_info(commandes)", (err, columns) => {
    if (err) {
      console.error('Erreur lors de la vérification des colonnes:', err);
      return;
    }
    const hasTableNumber = columns.some(col => col.name === 'table_number');
    if (!hasTableNumber) {
      db.run(`ALTER TABLE commandes ADD COLUMN table_number TEXT`, (err) => {
        if (err) {
          console.error('Erreur lors de l\'ajout de la colonne table_number:', err);
        } else {
          console.log('Colonne table_number ajoutée avec succès');
        }
      });
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    prix REAL NOT NULL,
    disponible BOOLEAN DEFAULT 1,
    image TEXT
  )`);

  // Insérer quelques produits par défaut
  db.get("SELECT COUNT(*) as count FROM produits", (err, row) => {
    if (row.count === 0) {
      const produits = [
        ['Pizza Margherita', 'Pizza classique avec tomate et mozzarella', 12.50, 1, ''],
        ['Pizza 4 Fromages', 'Pizza avec 4 fromages différents', 14.50, 1, ''],
        ['Burger Classique', 'Burger avec steak, salade, tomate', 9.90, 1, ''],
        ['Coca-Cola', 'Boisson gazeuse 33cl', 2.50, 1, ''],
        ['Frites', 'Portion de frites', 3.50, 1, '']
      ];

      const stmt = db.prepare("INSERT INTO produits (nom, description, prix, disponible, image) VALUES (?, ?, ?, ?, ?)");
      produits.forEach(produit => {
        stmt.run(produit);
      });
      stmt.finalize();
    }
  });
});

// Routes API

// Obtenir tous les produits
app.get('/api/produits', (req, res) => {
  db.all("SELECT * FROM produits WHERE disponible = 1", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtenir un produit par ID
app.get('/api/produits/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM produits WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }
    res.json(row);
  });
});

// Créer une commande
app.post('/api/commandes', (req, res) => {
  const { nom, email, telephone, table_number, items, total } = req.body;
  
  console.log('=== NOUVELLE COMMANDE ===');
  console.log('Données reçues:', req.body);
  console.log('table_number reçu:', table_number);
  console.log('Type de table_number:', typeof table_number);
  
  if (!nom || !items || !total) {
    res.status(400).json({ error: 'Nom, items et total sont requis' });
    return;
  }

  const id = uuidv4();
  const itemsJson = JSON.stringify(items);
  
  console.log('Valeurs à insérer:', {
    id,
    nom,
    email: email || null,
    telephone: telephone || null,
    table_number: table_number || null,
    total,
    statut: 'en_attente'
  });
  
  db.run(
    "INSERT INTO commandes (id, nom, email, telephone, table_number, items, total, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, nom, email || null, telephone || null, table_number || null, itemsJson, total, 'en_attente'],
    function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('Commande créée avec succès, ID:', id);
      res.status(201).json({ id, message: 'Commande créée avec succès' });
    }
  );
});

// Obtenir toutes les commandes (pour le gérant)
app.get('/api/commandes', (req, res) => {
  db.all("SELECT * FROM commandes ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parser les items JSON
    const commandes = rows.map(row => {
      const commande = {
        ...row,
        items: JSON.parse(row.items),
        table_number: row.table_number || null
      };
      // Debug: vérifier les données
      if (rows.length > 0 && rows.indexOf(row) === 0) {
        console.log('Première commande retournée:', commande);
        console.log('table_number:', commande.table_number);
      }
      return commande;
    });
    res.json(commandes);
  });
});

// Obtenir une commande par ID
app.get('/api/commandes/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM commandes WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }
    res.json({
      ...row,
      items: JSON.parse(row.items)
    });
  });
});

// Mettre à jour le statut d'une commande
app.patch('/api/commandes/:id/statut', (req, res) => {
  const id = req.params.id;
  const { statut } = req.body;
  
  if (!statut || !['en_attente', 'en_preparation', 'prete', 'terminee', 'annulee'].includes(statut)) {
    res.status(400).json({ error: 'Statut invalide' });
    return;
  }

  db.run(
    "UPDATE commandes SET statut = ? WHERE id = ?",
    [statut, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Commande non trouvée' });
        return;
      }
      res.json({ message: 'Statut mis à jour avec succès' });
    }
  );
});

// Statistiques
app.get('/api/stats', (req, res) => {
  console.log('Requête stats reçue');
  // Statistiques générales
  db.all(`
    SELECT 
      COUNT(*) as total_commandes,
      COALESCE(SUM(total), 0) as revenus_totaux,
      COALESCE(AVG(total), 0) as panier_moyen,
      COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
      COUNT(CASE WHEN statut = 'en_preparation' THEN 1 END) as en_preparation,
      COUNT(CASE WHEN statut = 'prete' THEN 1 END) as prete,
      COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as terminee,
      COUNT(CASE WHEN statut = 'annulee' THEN 1 END) as annulee
    FROM commandes
  `, (err, rows) => {
    if (err) {
      console.error('Erreur stats:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Stats retournées:', rows[0]);
    res.json(rows[0] || {
      total_commandes: 0,
      revenus_totaux: 0,
      panier_moyen: 0,
      en_attente: 0,
      en_preparation: 0,
      prete: 0,
      terminee: 0,
      annulee: 0
    });
  });
});

// Statistiques par table
app.get('/api/stats/tables', (req, res) => {
  console.log('Requête stats/tables reçue');
  db.all(`
    SELECT 
      table_number,
      COUNT(*) as nombre_commandes,
      COALESCE(SUM(total), 0) as revenus
    FROM commandes
    WHERE table_number IS NOT NULL AND table_number != ''
    GROUP BY table_number
    ORDER BY nombre_commandes DESC
  `, (err, rows) => {
    if (err) {
      console.error('Erreur stats/tables:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Stats tables retournées:', rows);
    res.json(rows || []);
  });
});

// Statistiques par jour
app.get('/api/stats/jours', (req, res) => {
  console.log('Requête stats/jours reçue');
  db.all(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as nombre_commandes,
      COALESCE(SUM(total), 0) as revenus
    FROM commandes
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `, (err, rows) => {
    if (err) {
      console.error('Erreur stats/jours:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Stats jours retournées:', rows);
    res.json(rows || []);
  });
});

// Produits les plus commandés
app.get('/api/stats/produits', (req, res) => {
  console.log('Requête stats/produits reçue');
  // Récupérer toutes les commandes et analyser les items
  db.all("SELECT items FROM commandes", (err, rows) => {
    if (err) {
      console.error('Erreur stats/produits:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    console.log('Nombre de commandes à analyser:', rows.length);
    
    // Analyser les items de toutes les commandes
    const produitsStats = {};
    
    rows.forEach(row => {
      try {
        const items = JSON.parse(row.items);
        items.forEach(item => {
          const key = `${item.id}_${item.nom}`;
          if (!produitsStats[key]) {
            produitsStats[key] = {
              id: item.id,
              nom: item.nom,
              nombre_commandes: 0,
              quantite_totale: 0,
              revenus: 0
            };
          }
          produitsStats[key].nombre_commandes += 1;
          produitsStats[key].quantite_totale += item.quantite;
          produitsStats[key].revenus += item.prix * item.quantite;
        });
      } catch (e) {
        console.error('Erreur lors du parsing des items:', e);
      }
    });
    
    // Convertir en tableau et trier
    const result = Object.values(produitsStats)
      .sort((a, b) => b.nombre_commandes - a.nombre_commandes)
      .slice(0, 10);
    
    console.log('Stats produits retournées:', result);
    res.json(result || []);
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});

// Fermer la base de données à l'arrêt
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connexion à la base de données fermée.');
    process.exit(0);
  });
});
