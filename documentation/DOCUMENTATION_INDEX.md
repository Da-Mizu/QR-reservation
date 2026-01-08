# 📚 Index de Documentation - Système d'Authentification QR Reservation

## 🎯 Démarrage Rapide

1. **👤 Utilisateur Novice**
   - Start: [QUICKSTART.md](QUICKSTART.md)
   - Action: Réinitialiser BD → Démarrer frontend → Se connecter

2. **👨‍💼 Administrateur**
   - Start: [README_AUTH_SYSTEM.md](README_AUTH_SYSTEM.md)
   - Action: Comprendre l'architecture → Configurer → Déployer

3. **👨‍💻 Développeur**
   - Start: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
   - Action: Comprendre l'implémentation → Modifier → Tester

---

## 📖 Documentation Par Type

### 🔧 Configuration & Déploiement
# Documentation Index

## Que lire en premier
- Aperçu + flux complet : [README.md](README.md)
- Démarrage express : [QUICKSTART.md](QUICKSTART.md)
- Config (ports, API URL, DB) : [CONFIGURATION.md](CONFIGURATION.md)
- Architecture/résumé technique : [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- Historique auth/multi-resto : [CHANGELOG_AUTH_SYSTEM.md](CHANGELOG_AUTH_SYSTEM.md)

## Ports et URLs (dev)
- Backend PHP : http://localhost/QR-reservation/backend-php
- Admin : http://localhost:3002
- Client : http://localhost:3003

## Scripts utiles
- Tests API : `test-login.ps1`, `test-auth.ps1`
- Commandes : `test-commande-restaurant.ps1`, `test-commande-restaurant-2.ps1`
- Génération QR : `generate-qr.html`

## Fichiers clés
- Backend : `backend-php/index.php`, `backend-php/db.php`, `backend-php/encryption.php`
- Frontend admin : `frontend-admin/src/context/AuthContext.js`, `frontend-admin/src/components/{Dashboard,Stats,Login}.js`, `frontend-admin/src/App.js`
- Frontend client : `frontend-client/src/components/{Scanner,Menu,Panier,Confirmation}.js`

## Check rapide
- Frontends pointent vers `REACT_APP_API_URL=http://localhost/QR-reservation/backend-php`
- Ports fixés : 3002 (admin) / 3003 (client)
- QR contiennent `restaurant` + `table`
1. Cherchez dans les documents ci-dessus
2. Consultez le fichier [QUICKSTART.md - Dépannage](QUICKSTART.md#-dépannage)
3. Exécutez [test-auth.ps1](test-auth.ps1) ou [deploy.ps1](deploy.ps1)
4. Consultez les logs Apache/PHP en cas d'erreur

---

**Documentation: Complète et à jour! ✅**
