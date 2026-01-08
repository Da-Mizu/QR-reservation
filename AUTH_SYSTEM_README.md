# Authentication System (Résumé)

Multi-restaurant auth for QR Reservation (backend PHP/MySQL, frontends React).

## Endpoints
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/auth/verify`
- POST `/api/auth/logout`

Token : `base64(restaurant_id:email:timestamp)` (7 jours), envoyé en `Authorization: Bearer`.

## Comptes démo
- admin@demo.local / demo123 (restaurant 1)
- testresto@demo.local / test123 (restaurant 2)

## URLs & ports (dev)
- Backend : http://localhost/QR-reservation/backend-php
- Admin : http://localhost:3002
- Client : http://localhost:3003

## Fichiers clés
- `backend-php/index.php`, `backend-php/db.php`
- `frontend-admin/src/context/AuthContext.js`, `frontend-admin/src/components/Login.js`
- `frontend-client/src/components/Scanner.js`

## Références
- Aperçu : [README.md](README.md)
- Démarrage rapide : [QUICKSTART.md](QUICKSTART.md)
- Config : [CONFIGURATION.md](CONFIGURATION.md)
- Résumé technique : [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
