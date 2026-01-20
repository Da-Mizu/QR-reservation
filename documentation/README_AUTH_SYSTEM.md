# README - Système d'Authentification

Authentification multi-restaurant pour QR Reservation (backend PHP/MySQL, frontends React).

## Endpoints
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/auth/verify`
- POST `/api/auth/logout`

Token : `base64(restaurant_id:email:timestamp)` (7 jours), envoyé en `Authorization: Bearer`.

## Comptes démo
- admin@demo.local / demo123 (restaurant 1)
- testresto@demo.local / test123 (restaurant 2)

## Ports / URLs (dev)
- Backend : http://localhost/QR-reservation/backend-php
- Admin : http://localhost:3002
- Client : http://localhost:3003

## Fichiers clés
- `backend-php/index.php`, `backend-php/db.php`
- `frontend-admin/src/context/AuthContext.js`, `frontend-admin/src/components/Login.js`
- `frontend-client/src/components/Scanner.js`

## Nouvelles fonctionnalités & notes
- KDS (Kitchen Display System) : affichage et filtrage des commandes par poste. Frontend : `frontend-admin/src/components/KDS/*`. Backend SSE endpoint : `backend-php/endpoints/commandes_stream.php`.
- Stations (postes) : table `stations` + colonne `produits.station`. Migration : `documentation/MIGRATION_STATIONS.sql`. API : `backend-php/endpoints/stations.php` (GET/POST/PATCH/DELETE + /assign).
- Multilingue : FR/EN supportés dans les frontends via `i18next`. Traductions stockées sous `public/locales/{fr,en}/translation.json` des deux frontends.

## Remarques techniques
- `stations.php` utilise désormais les helpers exposés par `index.php` (`respond()`, `json_input()`, `getAuthToken()`), évitant les déclarations redondantes.
- Pour activer les postes, exécutez `documentation/MIGRATION_STATIONS.sql` puis redémarrez Apache/MySQL.

## Liens utiles
- Aperçu & flux : [README.md](README.md)
- Démarrage rapide : [QUICKSTART.md](QUICKSTART.md)
- Config : [CONFIGURATION.md](CONFIGURATION.md)
- Résumé technique : [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
2. **JWT**: Remplacer base64 par JWT tokens
3. **Email Verification**: Vérifier les emails à l'inscription
4. **Password Reset**: Système de récupération mot de passe
5. **Rate Limiting**: Protection contre brute-force

### Long Terme
1. **Admin Dashboard**: Gestion centrale des restaurants
2. **Two-Factor Auth**: Authentification 2FA
3. **Audit Logs**: Historique complet des actions
4. **SSO**: Intégration avec authentification externalisée

---

## 📞 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| Login échoue | Vérifier que `/migrate-db.html` a réinitialisé la BD |
| Token invalide | Le token expire après 7 jours, se reconnecter |
| Données mélangées | Vérifier que les restaurantId sont différents |
| Frontend ne se lance | Vérifier que Node.js est installé et `npm start` |
| Erreur CORS | Vérifier que Apache est lancé et BD connectée |

Voir [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) pour le dépannage détaillé.

---

## 📚 Fichiers Clés

```
QR-reservation/
├── backend-php/
│   ├── db.php                    ← Migrations BD
│   ├── index.php                 ← Endpoints API
│   └── encryption.php            ← Chiffrement données sensibles
│
├── frontend-admin/
│   └── src/
│       ├── context/
│       │   └── AuthContext.js    ← NOUVEAU: Gestion auth
│       ├── components/
│       │   ├── Login.js          ← NOUVEAU: Formulaire login
│       │   ├── Dashboard.js      ← Modifié: utilise token
│       │   └── Stats.js          ← Modifié: utilise token
│       ├── App.js                ← Routes protégées
│       └── index.js              ← AuthProvider wrapper
│
├── migrate-db.html               ← NOUVEAU: Outil migration
├── test-auth.ps1                 ← NOUVEAU: Tests PowerShell
├── IMPLEMENTATION_SUMMARY.md     ← NOUVEAU: Doc technique
├── AUTH_SYSTEM_README.md         ← NOUVEAU: Architecture
├── QUICKSTART.md                 ← NOUVEAU: Guide démarrage
└── README.md                      ← CE FICHIER
```

---

## ✅ Validation

Pour considérer le système opérationnel:

1. ✅ Naviguer vers `http://localhost:3002/login`
2. ✅ Se connecter avec démo: `admin@demo.local` / `demo123`
3. ✅ Voir le Dashboard avec commandes
4. ✅ Accéder aux Statistiques
5. ✅ Cliquer déconnexion → Retour login
6. ✅ S'inscrire comme nouveau restaurant
7. ✅ Vérifier que les données sont isolées par restaurant

**Si tous les points sont ✅, le système est prêt!** 🎉

---

## 📞 Support & Questions

Consultez les fichiers de documentation:
- **Utilisateurs**: [QUICKSTART.md](QUICKSTART.md)
- **Développeurs**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Architecture**: [AUTH_SYSTEM_README.md](AUTH_SYSTEM_README.md)

---

**Implémenté avec ❤️ pour une gestion multi-restaurant sécurisée**
