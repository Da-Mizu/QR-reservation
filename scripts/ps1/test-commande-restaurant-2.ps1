#!/usr/bin/env pwsh
# Test de creation de commande avec restaurant_id=2

Write-Host "TEST CREATION DE COMMANDE AVEC RESTAURANT_ID=2" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost/QR-reservation/backend-php/api/commandes"

$commande = @{
    nom = "Test Client 2"
    email = "test2@example.com"
    telephone = "0601020305"
    table_number = "Table 2"
    restaurant_id = 2
    items = @(
        @{id = 1; nom = "Pizza"; prix = 10.50; quantite = 1}
    )
    total = 10.50
} | ConvertTo-Json

Write-Host "Commande JSON:" -ForegroundColor Yellow
Write-Host $commande
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $commande -UseBasicParsing -ErrorAction Stop
    
    Write-Host "SUCCESS - Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $json = $response.Content | ConvertFrom-Json
    Write-Host "  ID Commande: $($json.id)" -ForegroundColor Green
    Write-Host "  Message: $($json.message)" -ForegroundColor Green
    Write-Host "  Restaurant ID: $($json.restaurant_id)" -ForegroundColor Green
} catch {
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}
