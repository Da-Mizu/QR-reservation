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
3. Démarrer l'application :

2. Parcourir le menu et ajouter des articles au panier
QR Reservation est une application de commande par QR code avec multi‑restaurant. Backend PHP/MySQL (XAMPP/Apache) et deux frontends React : admin (gestion des commandes) et client (scan QR, menu, panier).

## Aperçu rapide
- Backend : `backend-php/` (Apache/PHP, MySQL). Base URL par défaut : `http://localhost/QR-reservation/backend-php`.
- Frontend admin : `frontend-admin` sur le port 3002 (login admin, commandes, stats).
- Frontend client : `frontend-client` sur le port 3003 (scan QR, menu, panier, confirmation).
- QR : les liens contiennent `restaurant=<id>` et `table=<num>`. Exemple : `http://localhost:3003/menu?restaurant=2&table=12`.
- Comptes démo : `admin@demo.local / demo123` (restaurant 1) et `testresto@demo.local / test123` (restaurant 2).

## Prérequis
- Node.js 18+
- npm
- PHP 8+ avec extensions PDO MySQL (XAMPP convient)
- MySQL (BDD `qr_reservation` par défaut)

## Démarrage rapide (dev)
```bash
# Backend PHP (via Apache/XAMPP) : placer le dossier dans htdocs et accéder à /QR-reservation/backend-php

# Admin (port 3002)
cd frontend-admin
npm install
npm start

# Client (port 3003)
cd frontend-client
npm install
npm start
```
- Assurez-vous que `backend-php` est servi par Apache et accessible à l'URL ci-dessus. Les frontends utilisent `REACT_APP_API_URL=http://localhost/QR-reservation/backend-php`.
- Si un port est occupé, changez `PORT` dans `.env` du frontend concerné (3002 admin, 3003 client).

## Flux principal
1) Générer/afficher un QR : ouvrez `generate-qr.html`, saisissez `restaurantId` et `table`. Le lien encode ces deux paramètres.
2) Scanner côté client : le scanner récupère `restaurant` et `table`, les stocke et redirige vers `/menu`.
3) Menu/Panier : ajoute des articles, poste une commande avec `restaurant_id`.
4) Confirmation : récupère la commande avec l'ID et `?restaurant=<id>` si aucun token n'est présent.
5) Admin : connexion, visualisation des commandes filtrées par restaurant (token), statistiques.

## Scripts utiles (PowerShell)
- `test-login.ps1` : vérifie l'auth login.
- `test-auth.ps1` : login, verify, commandes, stats.
- `test-commande-restaurant.ps1` : crée une commande pour restaurant 1.
- `test-commande-restaurant-2.ps1` : crée une commande pour restaurant 2.

## Configuration
- Backend : voir `CONFIGURATION.md` pour les variables DB (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME).
- Frontends : `frontend-admin/.env` et `frontend-client/.env` (API URL et ports).
- Auth : jeton base64(restaurant_id:email:timestamp), validité 7 jours. Endpoints :
  - POST `/api/auth/login`
  - POST `/api/auth/register`
  - GET `/api/auth/verify`
  - POST `/api/auth/logout`

## Déploiement (idées rapides)
- Servir `backend-php` derrière Apache avec mod_rewrite (voir `.htaccess`).
- Construire les frontends (`npm run build`) et déployer les dossiers `build/` derrière un serveur statique ou un vhost Apache/Nginx pointant sur `/menu` et `/` (admin) avec fallback React.

## Dépannage
- Port occupé : ajuster `PORT` dans `.env` du frontend.
- CORS/Authorization : l'en-tête `Authorization` est déjà exposé côté backend.
- Commande non trouvée après scan : vérifier que l'URL contient `restaurant=<id>` ou que le token d'admin est présent.

## Autres documents
- `QUICKSTART.md` : pas-à-pas concis.
- `CONFIGURATION.md` : variables d'environnement et URLs.
- `IMPLEMENTATION_SUMMARY.md` : architecture et choix techniques.
- `CHANGELOG_AUTH_SYSTEM.md` : historique rapide de l'auth et multi-restaurant.

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
