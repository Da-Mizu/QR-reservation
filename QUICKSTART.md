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

```bash
cd c:/xampp/htdocs/QR-reservation/frontend-admin
npm start
```

Le navigateur devrait automatiquement ouvrir `http://localhost:3002`

### Étape 3: Se Connecter

1. Vous devriez voir la page de login
2. Identifiants de démonstration:
   - **Email**: `admin@demo.local`
   - **Mot de passe**: `demo123`
3. Cliquer "Se connecter"
4. → Accès au Dashboard des commandes

### Étape 4: Tester les Fonctionnalités

**Dashboard (Commandes):**
- Liste de toutes les commandes
- Actualiser les données
- Mettre à jour le statut des commandes

**Statistiques:**
- Vue d'ensemble des revenus
- Statistiques par table
- Statistiques par jour
- Top produits

**Déconnexion:**
- Cliquer le bouton 🚪 en haut à droite
- Redirection vers `/login`

### Étape 5 (Optionnel): Créer un Nouveau Restaurant

1. Sur la page de login, cliquer "S'inscrire"
2. Remplir le formulaire:
   - Nom du restaurant (ex: "Mon Restaurant")
   - Email (ex: "contact@myrestaurant.com")
   - Mot de passe (minimal 6 caractères)
3. Cliquer "S'inscrire"
4. → Auto-login avec le nouveau restaurant
5. Les commandes/statistiques sont isolées par restaurant

---

## 🔍 Verification de Fonctionnement

### Test 1: Vérifier que la BD est créée
```bash
# Via le fichier migrate-db.html:
# - Cliquer "Tester l'authentification"
# - Vous devriez voir "✓ Authentification fonctionnelle!"
```

### Test 2: Vérifier les endpoints API
```bash
# Login
curl -X POST http://localhost/QR-reservation/backend-php/index.php/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","motdepasse":"demo123"}'

# Copier le "token" de la réponse

# Verify token
curl -X GET http://localhost/QR-reservation/backend-php/index.php/api/auth/verify \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"

# Get commandes (devraient être filtrées par restaurant)
curl -X GET http://localhost/QR-reservation/backend-php/index.php/api/commandes \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

### Test 3: Vérifier que les données sont isolées par restaurant

1. Se connecter avec `admin@demo.local`
2. Créer un restaurant via le formulaire d'inscription
3. Les deux restaurants doivent avoir des données différentes

---

## 📝 Notes Importantes

### ✅ Ce qui est implémenté
- [x] Système d'authentification complet
- [x] Isolation des données par restaurant
- [x] Contexte d'authentification React
- [x] Composant Login avec inscription
- [x] Routes protégées
- [x] Stockage du token en localStorage
- [x] Outil de migration BD

### ⚠️ À Faire en Production
- [ ] Implémenter HTTPS (SSL Certificate)
- [ ] Ajouter un rate limiting sur les endpoints
- [ ] Implémenter la vérification par email
- [ ] Ajouter un système de récupération mot de passe
- [ ] Implémenter des JWT tokens au lieu de base64
- [ ] Ajouter un CSRF token
- [ ] Configurer les headers CORS correctement
- [ ] Ajouter logging/audit trail

---

## 🐛 Dépannage

### Le login ne fonctionne pas
1. Vérifier que la BD a été réinitialisée (`migrate-db.html`)
2. Vérifier que le serveur Apache est actif
3. Vérifier les identifiants : `admin@demo.local` / `demo123`

### "Invalid token" en se connectant
1. Le token peut avoir expiré (7 jours)
2. Rafraîchir la page et vous reconnecter
3. Vérifier dans DevTools (F12) → Storage → Local Storage

### "Restaurant non trouvé"
1. Assurez-vous que les tables ont bien été créées
2. Vérifier dans phpmyadmin que les tables `restaurants`, `produits`, `commandes` existent
3. Réinitialiser la BD via `migrate-db.html`

### Le frontend admin n'accède pas à l'API
1. Vérifier que `REACT_APP_API_URL` est correcte dans `.env`
2. Vérifier que le backend PHP répond: 
   ```bash
   curl http://localhost/QR-reservation/backend-php/index.php/api/health
   ```
3. Vérifier les CORS headers dans le navigateur (DevTools → Network)

---

## 📚 Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `migrate-db.html` | Interface pour réinitialiser la BD |
| `backend-php/db.php` | Schéma BD et migrations |
| `backend-php/index.php` | Endpoints authentification |
| `frontend-admin/src/context/AuthContext.js` | Gestion authentification |
| `frontend-admin/src/components/Login.js` | Formulaire login |
| `frontend-admin/src/App.js` | Routes protégées |
| `IMPLEMENTATION_SUMMARY.md` | Documentation complète |

---

## 🎯 Vérification Finale

Avant de considérer le système opérationnel:

1. ✅ Accédez à `http://localhost:3002/login`
2. ✅ Connectez-vous avec `admin@demo.local` / `demo123`
3. ✅ Vous voyez le Dashboard avec des commandes
4. ✅ Cliquez sur "Statistiques" → Affichage des stats
5. ✅ Cliquez sur le bouton 🚪 → Déconnecte et retour au login
6. ✅ Créez un nouveau restaurant via "S'inscrire"
7. ✅ Vérifiez que chaque restaurant a ses données isolées

Si tous les points ci-dessus sont validés, le système est prêt pour la production! 🎉
