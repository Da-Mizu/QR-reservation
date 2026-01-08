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
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: `` (vide)
- Database: `qr_reservation`

### Frontend Admin (frontend-admin/.env)

```env
REACT_APP_API_URL=http://localhost/QR-reservation/backend-php/index.php/api
PORT=3002
SKIP_PREFLIGHT_CHECK=true
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

**Modifications:**
- `REACT_APP_API_URL`: URL de l'API backend (utilisée dans tous les appels axios)
- `PORT`: Port du serveur de développement React

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

### Passwords (Hachés avec bcrypt)
- **Backend**: Tous les mots de passe restaurant sont hachés avec `password_hash(..., PASSWORD_DEFAULT)`
- **Frontend**: Aucun mot de passe n'est stocké côté client
- **Transport**: Envoyé en POST sur HTTPS en production

### Tokens
- **Format**: `base64(restaurant_id:email:timestamp)`
- **Expiration**: 7 jours
- **Storage**: localStorage (côté client)
- **Transport**: Bearer token en header Authorization

### Données Sensibles
Certains champs sont chiffrés au niveau BD (hérité de la migration):
- `nom` (client)
- `email` (client)
- `telephone` (client)

Utilise AES-256-GCM via `encryption.php`

## Configuration Apache (XAMPP)

### Virtual Host (Optionnel)
Si vous déployez en production, configurez un virtual host:

```apache
<VirtualHost *:80>
    ServerName qr-reservation.local
    ServerAlias www.qr-reservation.local
    
    DocumentRoot /var/www/html/QR-reservation
    
    <Directory /var/www/html/QR-reservation>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Redirige / vers le frontend React
    ProxyPreserveHost On
    ProxyPass /QR-reservation/backend-php http://localhost/QR-reservation/backend-php
    ProxyPassReverse /QR-reservation/backend-php http://localhost/QR-reservation/backend-php
</VirtualHost>
```

## Configuration CORS

Le backend PHP accepte les requêtes CORS par défaut:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type,Authorization');
```

**Pour production**, limitez l'origin:
```php
header('Access-Control-Allow-Origin: https://qr-reservation.example.com');
```

## Configuration HTTPS (Production)

### Certification SSL
1. Obtenir un certificat SSL (Let's Encrypt)
2. Configurer Apache:

```apache
<VirtualHost *:443>
    ServerName qr-reservation.example.com
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cert.pem
    SSLCertificateKeyFile /etc/ssl/private/key.pem
    
    DocumentRoot /var/www/html/QR-reservation
    
    # ... reste de la config ...
</VirtualHost>

# Redirection HTTP → HTTPS
<VirtualHost *:80>
    ServerName qr-reservation.example.com
    Redirect permanent / https://qr-reservation.example.com/
</VirtualHost>
```

### Frontend
Mettre à jour le `.env`:
```env
REACT_APP_API_URL=https://qr-reservation.example.com/backend-php/index.php/api
```

## MySQL Configuration (Production)

### Backup Régulier
```bash
mysqldump -u root -p qr_reservation > backup_$(date +%Y%m%d).sql
```

### Users MySQL
```sql
-- Créer utilisateur spécifique (au lieu d'utiliser root)
CREATE USER 'qr_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON qr_reservation.* TO 'qr_app'@'localhost';
FLUSH PRIVILEGES;
```

### Optimisations BD
```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_restaurant_id ON produits(restaurant_id);
CREATE INDEX idx_restaurant_id ON commandes(restaurant_id);
CREATE INDEX idx_commande_id ON commande_items(commande_id);
CREATE INDEX idx_email ON restaurants(email);
```

## Variables de Debugging

Pour le développement, vous pouvez ajouter des variables:

### Backend PHP
```php
// À ajouter dans index.php pour déboguer
define('DEBUG_MODE', getenv('DEBUG_MODE') ?: false);

if (DEBUG_MODE) {
    error_log("Token reçu: " . $token);
    error_log("Restaurant ID: " . $restaurantId);
}
```

### Frontend React
```javascript
// À ajouter dans App.js
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

if (DEBUG) {
    console.log('Auth Context:', { user, token });
}
```

Puis dans le `.env`:
```env
REACT_APP_DEBUG=true
```

## Validation de Configuration

Script de test pour vérifier la configuration:

```bash
# Tester la connexion à la BD
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1;" $DB_NAME

# Tester l'API
curl http://localhost/QR-reservation/backend-php/index.php/api/health

# Tester l'authentification
curl -X POST http://localhost/QR-reservation/backend-php/index.php/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","motdepasse":"demo123"}'
```

## Troubleshooting Configuration

| Problème | Solution |
|----------|----------|
| "Connection refused" | Vérifier que MySQL est lancé |
| "Access denied" | Vérifier DB_USER et DB_PASS |
| "Database not found" | Vérifier que DB_NAME existe |
| CORS error | Vérifier Access-Control-Allow-Origin header |
| Token expired | Token expire après 7 jours |
| 401 Unauthorized | Token manquant ou invalide |

---

**Configuration: Prête pour développement et production!** ✅
