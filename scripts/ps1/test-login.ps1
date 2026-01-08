#!/usr/bin/env pwsh
# Test d'authentification API

Write-Host "TEST API AUTHENTIFICATION" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost/QR-reservation/backend-php/api/auth/login"
$email = "admin@demo.local"
$password = "demo123"

Write-Host "URL: $apiUrl" -ForegroundColor Yellow
Write-Host "Email: $email" -ForegroundColor Yellow
Write-Host ""

# Préparer le payload
$body = @{
    email = $email
    motdepasse = $password
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body -UseBasicParsing -ErrorAction Stop
    
    Write-Host "SUCCESS - Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $json = $response.Content | ConvertFrom-Json
    Write-Host "  Token: $($json.token)" -ForegroundColor Green
    Write-Host "  Restaurant ID: $($json.restaurant_id)" -ForegroundColor Green
    Write-Host "  Email: $($json.email)" -ForegroundColor Green
} catch {
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "TIP: If the API works here but not in React, clear browser cache:" -ForegroundColor Yellow
Write-Host "   1. Press Ctrl+Shift+Delete" -ForegroundColor Yellow
Write-Host "   2. Or press Ctrl+Shift+R for hard refresh" -ForegroundColor Yellow
