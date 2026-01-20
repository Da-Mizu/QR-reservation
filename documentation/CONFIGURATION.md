# Configuration du Système d'Authentification

## Variables d'Environnement

### Backend PHP (backend-php/db.php)

Les connexions à la base de données utilisent des variables d'environnement avec des valeurs par défaut XAMPP:

```php
$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';        // Host MySQL
$DB_PORT = getenv('DB_PORT') ?: '3306';              // Port MySQL
$DB_USER = getenv('DB_USER') ?: 'root';              // Utilisateur MySQL
$DB_PASS = getenv('DB_PASS') ?: '';                  // Mot de passe MySQL (vide par défaut)
$DB_NAME = getenv('DB_NAME') ?: 'qr_reservation';   // Nom base de données
```

**Valeurs par défaut (XAMPP):**

### Frontend Admin (frontend-admin/.env)

```env
REACT_APP_API_URL=http://localhost/QR-reservation/backend-php
PORT=3002
SKIP_PREFLIGHT_CHECK=true
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

Note: `REACT_APP_API_URL` doit pointer vers la racine du backend. Les frontends construisent ensuite l'URL finale vers `/api`.

## Langue / i18n
Les frontends supportent FR/EN via `i18next`. La langue est détectée automatiquement et sauvegardée dans `localStorage`. Pour forcer une langue en dev, définissez `i18next` key dans `localStorage` ou utilisez le sélecteur UI.

## Migration Stations
Le fichier `documentation/MIGRATION_STATIONS.sql` contient la migration pour ajouter la table `stations` et la colonne `produits.station`. Exécutez-la si vous souhaitez activer la gestion des postes.
```

**Modifications:**

## Configuration Production

Pour une configuration production, modifiez les variables:

### 1. Backend PHP
```bash
# Fichier .env ou variables système
export DB_HOST="db.example.com"
export DB_PORT="3306"
export DB_USER="app_user"
export DB_PASS="secure_password_123"
export DB_NAME="qr_reservation_prod"
```

### 2. Frontend React
```bash
# frontend-admin/.env.production
REACT_APP_API_URL=https://api.example.com/qr-reservation/backend-php/index.php/api
```

## Secrets et Sécurité
# Configuration

## Backend PHP / MySQL
- DB_NAME: `qr_reservation`
- DB_USER: `root`
- DB_PASS: (vide par défaut XAMPP)
- DB_HOST: `127.0.0.1`
- DB_PORT: `3306`
- Token: base64(restaurant_id:email:timestamp), validité 7 jours
- CORS: `Authorization` autorisé
- URL backend attendue: `http://localhost/QR-reservation/backend-php`
- Apache: mod_rewrite actif via `backend-php/.htaccess`

## Frontend admin (`frontend-admin/.env`)
- `REACT_APP_API_URL=http://localhost/QR-reservation/backend-php`
- `PORT=3002`

## Frontend client (`frontend-client/.env`)
- `REACT_APP_API_URL=http://localhost/QR-reservation/backend-php`
- `PORT=3003`

## Comptes de démonstration
- Restaurant 1 : admin@demo.local / demo123
- Restaurant 2 : testresto@demo.local / test123

## QR codes
- Paramètres requis : `restaurant=<id>` et `table=<num>`
- Exemple : `http://localhost:3003/menu?restaurant=2&table=12`

## Production (pistes)
- Forcer HTTPS et restreindre `Access-Control-Allow-Origin`
- Créer un utilisateur MySQL dédié (pas root)
- Séparer les secrets hors dépôt
- Activer logs Apache (access/error)

