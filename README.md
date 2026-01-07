# QR Reservation - Système de commande par QR Code

Un système complet de réservation et commande par QR code pour restaurants, cafés et établissements similaires.

## 🚀 Fonctionnalités

- **Scanner QR Code** : Les clients peuvent scanner un QR code pour accéder au menu
- **Commande en ligne** : Interface intuitive pour parcourir le menu et passer commande
- **Gestion des commandes** : Interface d'administration pour le gérant
- **Pas d'authentification** : Accès simple et rapide pour les clients
- **Design moderne** : Interface utilisateur élégante et responsive

## 📁 Structure du projet

```
QR-reservation/
├── backend/              # API REST (Node.js/Express)
├── frontend-client/      # Interface client (React)
├── frontend-admin/       # Interface gérant (React)
└── README.md
```

## 🛠️ Installation

### Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn

### Backend

1. Naviguer dans le dossier backend :
```bash
cd backend
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer le serveur :
```bash
npm start
```

Le serveur backend sera accessible sur `http://localhost:3001`

### Frontend Client

1. Naviguer dans le dossier frontend-client :
```bash
cd frontend-client
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer l'application :
```bash
npm start
```

L'application client sera accessible sur `http://localhost:3000`

### Frontend Admin

1. Naviguer dans le dossier frontend-admin :
```bash
cd frontend-admin
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer l'application :
```bash
npm start
```

L'application admin sera accessible sur `http://localhost:3000` (ou un autre port si 3000 est occupé)

## 📖 Utilisation

### Pour les clients

1. Scanner le QR code affiché sur la table
2. Parcourir le menu et ajouter des articles au panier
3. Remplir les informations de contact (nom requis)
4. Valider la commande
5. Recevoir une confirmation avec le numéro de commande

### Pour le gérant

1. Accéder à l'interface d'administration
2. Visualiser toutes les commandes en temps réel
3. Filtrer les commandes par statut
4. Mettre à jour le statut des commandes :
   - En attente → En préparation → Prête → Terminée
5. Consulter les statistiques (nombre de commandes, revenus, etc.)

## 🔌 API Endpoints

### Produits
- `GET /api/produits` - Obtenir tous les produits disponibles
- `GET /api/produits/:id` - Obtenir un produit par ID

### Commandes
- `GET /api/commandes` - Obtenir toutes les commandes (pour le gérant)
- `GET /api/commandes/:id` - Obtenir une commande par ID
- `POST /api/commandes` - Créer une nouvelle commande
- `PATCH /api/commandes/:id/statut` - Mettre à jour le statut d'une commande

## 🎨 Personnalisation

### Changer le style

Chaque frontend (client et admin) peut être personnalisé indépendamment :

- **Frontend Client** : Modifier les fichiers CSS dans `frontend-client/src/components/`
- **Frontend Admin** : Modifier les fichiers CSS dans `frontend-admin/src/components/`

### Ajouter des produits

Les produits sont stockés dans la base de données SQLite. Vous pouvez :
1. Les ajouter via l'API
2. Les modifier directement dans la base de données
3. Ajouter une interface d'administration pour gérer les produits

## 📝 Notes

- La base de données SQLite est créée automatiquement au premier démarrage du backend
- Des produits d'exemple sont ajoutés automatiquement
- Le panier est sauvegardé dans le localStorage du navigateur
- L'auto-refresh est activé par défaut dans l'interface admin (rafraîchit toutes les 5 secondes)

### Base de données (SQLite) et chiffrement à froid

- **Fichier de la base de données :** le fichier SQLite est créé dans le dossier `backend` sous le nom `database.sqlite` (chemin : `backend/database.sqlite`). Le backend l'ouvre via `path.join(__dirname, 'database.sqlite')` dans `backend/server.js`.
- **Chiffrement à froid (optionnel) :** une couche d'encryptage applicatif a été ajoutée pour chiffrer certains champs sensibles avant écriture (ex. `nom`, `email`, `telephone`, `items`).
- **Variable d'environnement :** pour activer le chiffrement définissez `DB_ENCRYPTION_KEY`. Recommandation : une clé 32-octets encodée en base64.

   - Générer une clé 32-octets (Node.js) :
      ```bash
      node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
      ```

   - Exemple (PowerShell) :
      ```powershell
      $env:DB_ENCRYPTION_KEY = '<votre_cle_base64>'
      npm start
      ```

   - Exemple (Linux / macOS) :
      ```bash
      export DB_ENCRYPTION_KEY='<votre_cle_base64>'
      npm start
      ```

- **Comportement si non défini :** si `DB_ENCRYPTION_KEY` n'est pas défini, le chiffrement est désactivé et une alerte est affichée au démarrage. Le système est rétro-compatible : les valeurs non préfixées restent lisibles.

## 🔒 Sécurité

⚠️ **Note importante** : Cette application est conçue pour un usage en développement ou dans un environnement contrôlé. Pour un déploiement en production, considérez :

- Ajouter une authentification pour l'interface admin
- Implémenter des validations côté serveur plus strictes
- Utiliser HTTPS
- Ajouter une protection contre les attaques CSRF
- Implémenter un système de logs et de monitoring

## 📄 Licence

ISC

## 👨‍💻 Développement

Pour le développement avec rechargement automatique :

```bash
# Backend
cd backend
npm run dev

# Frontend Client (dans un autre terminal)
cd frontend-client
npm start

# Frontend Admin (dans un autre terminal)
cd frontend-admin
npm start
```
