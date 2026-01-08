# Script de déploiement du système d'authentification
# À exécuter une seule fois pour initialiser le système
# Usage: powershell -File deploy.ps1

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🚀 Déploiement QR Reservation Auth" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Vérifier les prérequis
Write-Host "[1/5] Vérification des prérequis..." -ForegroundColor Yellow

$nodeCheck = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js n'est pas installé" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js trouvé: $nodeCheck" -ForegroundColor Green

$npmCheck = npm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm n'est pas installé" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm trouvé: $npmCheck" -ForegroundColor Green

Write-Host ""

# Étape 2: Installer les dépendances frontend
Write-Host "[2/5] Installation des dépendances frontend..." -ForegroundColor Yellow
Push-Location frontend-admin

$npmInstall = npm install 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dépendances frontend installées" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    Write-Host $npmInstall
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# Étape 3: Vérifier Apache et PHP
Write-Host "[3/5] Vérification du serveur Apache..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost/QR-reservation/backend-php/index.php/api/health" -UseBasicParsing -ErrorAction Stop
    if ($healthCheck.Content -like "*OK*") {
        Write-Host "✓ Apache et PHP sont accessibles" -ForegroundColor Green
    } else {
        Write-Host "✗ Apache/PHP ne répond pas correctement" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Apache/PHP ne répond pas. Assurez-vous que XAMPP est lancé." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 4: Réinitialiser la BD
Write-Host "[4/5] Réinitialisation de la base de données..." -ForegroundColor Yellow

try {
    $resetResponse = Invoke-WebRequest -Uri "http://localhost/QR-reservation/backend-php/index.php/api/db/reset" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -UseBasicParsing `
        -ErrorAction Stop

    if ($resetResponse.Content -like "*réinitialisée*") {
        Write-Host "✓ Base de données réinitialisée" -ForegroundColor Green
    } else {
        Write-Host "✗ Erreur lors de la réinitialisation" -ForegroundColor Red
        Write-Host $resetResponse.Content
        exit 1
    }
} catch {
    Write-Host "✗ Erreur lors de la réinitialisation" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host ""

# Étape 5: Test d'authentification
Write-Host "[5/5] Test d'authentification..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost/QR-reservation/backend-php/index.php/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"admin@demo.local","motdepasse":"demo123"}' `
        -UseBasicParsing `
        -ErrorAction Stop

    if ($loginResponse.Content -like "*token*") {
        Write-Host "✓ Authentification fonctionnelle" -ForegroundColor Green
    } else {
        Write-Host "✗ Erreur lors du test d'authentification" -ForegroundColor Red
        Write-Host $loginResponse.Content
        exit 1
    }
} catch {
    Write-Host "✗ Erreur lors du test d'authentification" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour démarrer le frontend:"
Write-Host "  cd frontend-admin" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puis accédez à: http://localhost:3002/login" -ForegroundColor Yellow
Write-Host "Identifiants: admin@demo.local / demo123" -ForegroundColor Yellow
Write-Host ""
