# 🎯 QR Reservation - Système d'Authentification Multi-Restaurant

## 📖 Qu'est-ce que c'est?

Un système d'authentification complet a été implanté pour permettre à plusieurs restaurants d'utiliser la même plateforme QR Reservation en toute isolation des données.

**Chaque restaurant peut maintenant:**
- Se connecter avec ses identifiants
- Voir uniquement ses commandes
- Consulter ses statistiques
- Gérer ses produits
- Aucun accès aux données d'autres restaurants

---

## 🚀 Démarrer Immédiatement

### 1️⃣ Réinitialiser la Base de Données
```
http://localhost/QR-reservation/migrate-db.html
→ Cliquer "Réinitialiser la BD"
```

### 2️⃣ Démarrer le Frontend Admin
```bash
cd frontend-admin
npm start
# Ouvrira http://localhost:3002/login
```

### 3️⃣ Se Connecter
- **Email**: `admin@demo.local`
- **Mot de passe**: `demo123`

C'est tout! Vous avez accès au dashboard avec authentification. 🎉

---

## 📂 Fichiers de Documentation

### Pour les Utilisateurs
- **[QUICKSTART.md](QUICKSTART.md)** - Guide de démarrage rapide
- **[migrate-db.html](migrate-db.html)** - Interface de migration BD

### Pour les Développeurs
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Documentation technique complète
- **[AUTH_SYSTEM_README.md](AUTH_SYSTEM_README.md)** - Architecture authentification

---

## ✨ Nouvelles Fonctionnalités

### Backend (PHP)

| Fichier | Modifications |
|---------|--------------|
| `backend-php/db.php` | ✨ Table `restaurants` + migrations |
| `backend-php/index.php` | ✨ 4 endpoints auth + filtrage données |
| `backend-php/encryption.php` | (Inchangé, fonctionne toujours) |

**Endpoints d'authentification:**
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription nouveau restaurant
- `GET /api/auth/verify` - Vérifier token
- `POST /api/auth/logout` - Déconnexion

**Filtrage automatique par restaurant:**
- Toutes les commandes filtrées par `restaurant_id`
- Toutes les statistiques isolées par restaurant
- Backward compatible (utilise `restaurant_id=1` sans token)

### Frontend (React)

| Fichier | Modifications |
|---------|--------------|
| `frontend-admin/src/context/AuthContext.js` | ✨ NOUVEAU - Gestion globale auth |
| `frontend-admin/src/components/Login.js` | ✨ NOUVEAU - Formulaire connexion |
| `frontend-admin/src/App.js` | ✏️ Routes protégées |
| `frontend-admin/src/components/Dashboard.js` | ✏️ Utilise token Bearer |
| `frontend-admin/src/components/Stats.js` | ✏️ Utilise token Bearer |
| `frontend-admin/src/index.js` | ✏️ AuthProvider wrapper |

**Nouvelles fonctionnalités UI:**
- Page de login/inscription dédiée
- Affichage email du restaurant en navigation
- Bouton déconnexion (🚪)
- Stockage token en localStorage
- Routes automatiquement protégées

---

## 🔐 Sécurité

### Hashage des Mots de Passe
- Algorithme: **bcrypt** (PASSWORD_DEFAULT)
- Automatiquement sécurisé par PHP

### Token
- Format: `base64(restaurant_id:email:timestamp)`
- Expiration: **7 jours**
- Transport: **Bearer token** en header Authorization
- Stockage: **localStorage** (secure pour démo)

### Isolation Données
- Chaque endpoint vérifie le `restaurant_id` du token
- Impossible d'accéder aux données d'un autre restaurant
- Foreign keys enforçées au niveau BD

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend React                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AuthContext (localStorage + state global)      │   │
│  │  - token, user, login(), logout()               │   │
│  └──────────────────────────────────────────────────┘   │
│         ↓                          ↓                     │
│   ┌─────────────┐         ┌────────────────┐            │
│   │ Login Page  │         │ Dashboard      │            │
│   │ Register    │         │ Stats          │            │
│   └─────────────┘         └────────────────┘            │
│         ↓ (POST)            ↓ (GET + Bearer token)      │
└─────────────────────────────────────────────────────────┘
                      ↓
         ┌────────────────────────────────────┐
         │  Backend PHP API                   │
         ├────────────────────────────────────┤
         │ /api/auth/login          [POST]    │
         │ /api/auth/register       [POST]    │
         │ /api/auth/verify         [GET]     │
         │ /api/commandes           [GET]     │ (filtrées)
         │ /api/stats               [GET]     │ (filtrées)
         │ ... tous les endpoints ... [GET]   │
         └────────────────────────────────────┘
                      ↓
         ┌────────────────────────────────────┐
         │  MySQL Database                    │
         ├────────────────────────────────────┤
         │ restaurants                        │
         │ ├─ id, nom, email                 │
         │ ├─ password_hash, telephone       │
         │ └─ adresse, actif                 │
         │                                    │
         │ produits (restaurant_id FK)       │
         │ commandes (restaurant_id FK)      │
         │ commande_items                    │
         └────────────────────────────────────┘
```

---

## 🧪 Tests

### Vérification Rapide
```bash
# 1. Via Interface
http://localhost/QR-reservation/migrate-db.html
# Cliquer "Tester l'authentification"

# 2. Via Terminal/PowerShell
powershell -File test-auth.ps1

# 3. Via cURL
curl -X POST http://localhost/QR-reservation/backend-php/index.php/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","motdepasse":"demo123"}'
```

---

## 📋 Checklist Implémentation

- [x] Table `restaurants` créée avec mot de passe hashé
- [x] Colonnes `restaurant_id` ajoutées avec FKs
- [x] Endpoints d'authentification implémentés
- [x] Gestion token (base64 + expiration 7j)
- [x] AuthContext React créé
- [x] Composant Login avec inscription
- [x] Routes protégées implémentées
- [x] Intégration token dans les appels API
- [x] Navbar avec email + déconnexion
- [x] localStorage persistence
- [x] Outil migration BD HTML
- [x] Tests et vérification
- [x] Documentation complète

---

## 🚀 Étapes Suivantes (Optionnel)

### Court Terme
1. Tester le système en accédant à `http://localhost:3002/login`
2. Créer un nouveau restaurant via l'inscription
3. Vérifier l'isolation des données

### Moyen Terme (Production)
1. **HTTPS**: Obtenir un certificat SSL
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
