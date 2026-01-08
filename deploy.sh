#!/bin/bash
# Script de déploiement du système d'authentification
# À exécuter une seule fois pour initialiser le système

set -e

echo "=================================="
echo "🚀 Déploiement QR Reservation Auth"
echo "=================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1: Vérifier les prérequis
echo -e "${YELLOW}[1/5] Vérification des prérequis...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js trouvé: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm trouvé: $(npm --version)${NC}"

echo ""

# Étape 2: Installer les dépendances frontend
echo -e "${YELLOW}[2/5] Installation des dépendances frontend...${NC}"
cd frontend-admin
if npm install; then
    echo -e "${GREEN}✓ Dépendances frontend installées${NC}"
else
    echo -e "${RED}✗ Erreur lors de l'installation des dépendances${NC}"
    exit 1
fi
cd ..

echo ""

# Étape 3: Vérifier Apache et PHP
echo -e "${YELLOW}[3/5] Vérification du serveur Apache...${NC}"
if curl -s http://localhost/QR-reservation/backend-php/index.php/api/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Apache et PHP sont accessibles${NC}"
else
    echo -e "${RED}✗ Apache/PHP ne répond pas. Assurez-vous que XAMPP est lancé.${NC}"
    exit 1
fi

echo ""

# Étape 4: Réinitialiser la BD
echo -e "${YELLOW}[4/5] Réinitialisation de la base de données...${NC}"
RESET_RESPONSE=$(curl -s -X POST http://localhost/QR-reservation/backend-php/index.php/api/db/reset \
  -H "Content-Type: application/json")

if echo "$RESET_RESPONSE" | grep -q "réinitialisée"; then
    echo -e "${GREEN}✓ Base de données réinitialisée${NC}"
else
    echo -e "${RED}✗ Erreur lors de la réinitialisation${NC}"
    echo "$RESET_RESPONSE"
    exit 1
fi

echo ""

# Étape 5: Test d'authentification
echo -e "${YELLOW}[5/5] Test d'authentification...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/QR-reservation/backend-php/index.php/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","motdepasse":"demo123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Authentification fonctionnelle${NC}"
else
    echo -e "${RED}✗ Erreur lors du test d'authentification${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Déploiement réussi!${NC}"
echo "=================================="
echo ""
echo "Pour démarrer le frontend:"
echo "  cd frontend-admin"
echo "  npm start"
echo ""
echo "Puis accédez à: http://localhost:3002/login"
echo "Identifiants: admin@demo.local / demo123"
echo ""
