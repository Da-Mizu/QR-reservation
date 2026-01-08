$API_URL = "http://localhost/QR-reservation/backend-php/index.php/api"

Write-Host "=== QR Reservation Authentication Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login
Write-Host "1. Testing LOGIN endpoint..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@demo.local"
    motdepasse = "demo123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginPayload `
        -UseBasicParsing

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    $restaurantId = $loginData.restaurant_id
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $token" -ForegroundColor Gray
    Write-Host "  Restaurant ID: $restaurantId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Test 2: Verify Token
Write-Host "2. Testing VERIFY endpoint..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-WebRequest -Uri "$API_URL/auth/verify" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -UseBasicParsing

    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    Write-Host "✓ Token verified!" -ForegroundColor Green
    Write-Host "  Restaurant ID: $($verifyData.restaurant_id)" -ForegroundColor Gray
    Write-Host "  Email: $($verifyData.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Token verification failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 3: Get Commandes with Token
Write-Host "3. Testing COMMANDES endpoint with auth..." -ForegroundColor Yellow
try {
    $commandesResponse = Invoke-WebRequest -Uri "$API_URL/commandes" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -UseBasicParsing

    $commandesData = $commandesResponse.Content | ConvertFrom-Json
    Write-Host "✓ Commandes retrieved!" -ForegroundColor Green
    Write-Host "  Total commandes: $($commandesData.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Commandes retrieval failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 4: Get Stats with Token
Write-Host "4. Testing STATS endpoint with auth..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "$API_URL/stats" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -UseBasicParsing

    $statsData = $statsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Stats retrieved!" -ForegroundColor Green
    Write-Host "  Total commandes: $($statsData.total_commandes)" -ForegroundColor Gray
    Write-Host "  Total revenus: $($statsData.revenus_totaux)€" -ForegroundColor Gray
    Write-Host "  En attente: $($statsData.en_attente)" -ForegroundColor Gray
    Write-Host "  En préparation: $($statsData.en_preparation)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Stats retrieval failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "=== All tests completed ===" -ForegroundColor Cyan
Write-Host "Frontend should be accessible at: http://localhost:3002/login" -ForegroundColor White
