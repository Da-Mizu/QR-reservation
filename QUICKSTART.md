## 🚀 Démarrage Rapide du Système d'Authentification

### Étape 1: Réinitialiser la Base de Données

**Option A: Via Interface Web (Recommandé)**
1. Ouvrir dans le navigateur: `http://localhost/QR-reservation/migrate-db.html`
2. Cliquer le bouton "Réinitialiser la BD"
3. Attendre le message "✓ Base de données réinitialisée avec succès"
4. (Optionnel) Cliquer "Tester l'authentification"

**Option B: Via cURL**
```bash
curl -X POST http://localhost/QR-reservation/backend-php/index.php/api/db/reset \
  -H "Content-Type: application/json"
```

### Étape 2: Démarrer le Frontend Admin
# Quickstart

## Prérequis
- Node 18+ et npm
- PHP 8+ avec PDO MySQL (XAMPP convient)
- MySQL (BDD par défaut `qr_reservation`)

## URLs et ports (dev)
- Backend PHP : http://localhost/QR-reservation/backend-php
- Frontend admin : http://localhost:3002
- Frontend client : http://localhost:3003

## Backend PHP (Apache/XAMPP)
- Placez le dossier dans `htdocs/QR-reservation/backend-php`.
- Vérifiez l'accès en appelant un endpoint (ex: `/api/auth/login`).

## Frontends
```bash
# Admin
cd frontend-admin
npm install
npm start

# Client
cd ../frontend-client
npm install
npm start
```
Ports configurables via `.env` (PORT=3002 admin, PORT=3003 client).

## Comptes démo
- admin@demo.local / demo123 (restaurant 1)
- testresto@demo.local / test123 (restaurant 2)

## Générer et tester un QR
1) Ouvrir `generate-qr.html` et saisir `restaurantId` + `table`.
2) Scanner avec le frontend client → redirection vers `/menu?restaurant=...&table=...`.
3) Ajouter des produits, valider la commande.
4) Vérifier dans l'admin (port 3002) que la commande apparaît pour le bon restaurant.

## Scripts de test (PowerShell)
- `test-login.ps1` : login
- `test-auth.ps1` : login + verify + commandes + stats
- `test-commande-restaurant.ps1` : commande resto 1
- `test-commande-restaurant-2.ps1` : commande resto 2

