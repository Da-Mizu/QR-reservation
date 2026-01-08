# Authentication System Implementation

## Summary of Changes

### Backend (PHP)

1. **New Restaurants Table** (`backend-php/db.php`)
   - Added `restaurants` table with encrypted credentials
   - Fields: `id`, `nom`, `email`, `password_hash`, `telephone`, `adresse`, `actif`, `created_at`
   - Default restaurant seed: `admin@demo.local` / `demo123`

2. **Updated Existing Tables**
   - Added `restaurant_id` foreign key to `produits`, `commandes` tables
   - Cascade delete on restaurant deletion

3. **Authentication Endpoints** (`backend-php/index.php`)
   - `POST /api/auth/login` - Login with email/password
   - `POST /api/auth/register` - Register new restaurant
   - `GET /api/auth/verify` - Verify authentication token
   - `POST /api/auth/logout` - Logout

4. **Token Management**
   - Token format: `base64(restaurant_id:email:timestamp)`
   - Token expiration: 7 days
   - Passed via `Authorization: Bearer <token>` header

5. **Data Filtering**
   - All endpoints (commandes, stats) now filter by authenticated `restaurant_id`
   - Backward compatible: uses `restaurant_id = 1` if no token provided

### Frontend Admin (React)

1. **Authentication Context** (`frontend-admin/src/context/AuthContext.js`)
   - Global auth state management
   - Token persistence in localStorage
   - `login()`, `logout()` methods

2. **Login Component** (`frontend-admin/src/components/Login.js`)
   - Email/password login form
   - Toggle between login/registration
   - Demo credentials displayed
   - Error handling and loading states

3. **Protected Routes** (`frontend-admin/src/App.js`)
   - `/login` - Public login page
   - `/` - Protected Dashboard
   - `/stats` - Protected Statistics
   - Auto-redirect to login if not authenticated

4. **Navigation Updates**
   - Navbar shows authenticated user email
   - Logout button in top-right
   - Hidden when on login page

5. **API Integration**
   - Dashboard and Stats now send `Authorization: Bearer <token>` header
   - Automatic token refresh on component mount

## Setup & Testing

### Prerequisites
- XAMPP running with Apache and MySQL
- Node.js 16+ installed

### Database Migration
The authentication system will automatically:
1. Create `restaurants` table on first run
2. Create/update `produits`, `commandes`, `commande_items` tables
3. Seed default restaurant if none exists

### Start Development

**Backend**: Already running on Apache at `http://localhost/QR-reservation/backend-php`

**Frontend Admin**:
```bash
cd frontend-admin
npm start
# Opens on http://localhost:3002
```

### First Login
1. Navigate to `http://localhost:3002/login`
2. Use credentials:
   - Email: `admin@demo.local`
   - Password: `demo123`
3. Dashboard loads with commandes for the authenticated restaurant

### Create New Restaurant
1. Click "S'inscrire" on login page
2. Enter restaurant name, email, password
3. Account created and logged in automatically

## API Examples

### Login
```bash
curl -X POST http://localhost/QR-reservation/backend-php/index.php/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","motdepasse":"demo123"}'
```

Response:
```json
{
  "token": "MzpnaWZfc3RvcmFnZUAxLmxvY2FsOjE3MzIyNzEwNDA=",
  "restaurant_id": 3,
  "email": "admin@demo.local"
}
```

### Use Token to Get Commandes
```bash
curl -X GET http://localhost/QR-reservation/backend-php/index.php/api/commandes \
  -H "Authorization: Bearer MzpnaWZfc3RvcmFnZUAxLmxvY2FsOjE3MzIyNzEwNDA="
```

## Security Notes

- Passwords hashed with PHP's `password_hash()` (bcrypt by default)
- Tokens are base64-encoded and include timestamp for expiration
- Implement HTTPS in production
- Consider adding CSRF tokens for sensitive operations
- Current demo credentials should be changed before production

## File Structure

```
backend-php/
  ├── db.php              (Updated: restaurants table + migrations)
  ├── index.php           (Updated: auth endpoints + token handling)
  ├── encryption.php      (Unchanged: used for nom/email/telephone)
  └── ...

frontend-admin/
  ├── src/
  │   ├── components/
  │   │   ├── Login.js    (New: login/register form)
  │   │   ├── Login.css   (New: styling)
  │   │   ├── Dashboard.js (Updated: uses auth token)
  │   │   ├── Stats.js     (Updated: uses auth token)
  │   │   └── ...
  │   ├── context/
  │   │   └── AuthContext.js (New: auth state management)
  │   ├── App.js          (Updated: routing + protection)
  │   ├── index.js        (Updated: AuthProvider wrapper)
  │   └── ...
  ├── .env                (Unchanged: API_URL)
  └── ...
```

## Next Steps

1. ✅ Created restaurants table with encrypted credentials
2. ✅ Added restaurant_id to all relevant tables
3. ✅ Built authentication endpoints
4. ✅ Created Login component with registration
5. ✅ Protected Dashboard and Stats routes
6. ✅ Integrated token authentication in API calls
7. **TODO**: Update frontend-client if needed for multi-restaurant support
8. **TODO**: Add admin dashboard for restaurant management
9. **TODO**: Implement email verification (optional)
10. **TODO**: Add password reset functionality (optional)
