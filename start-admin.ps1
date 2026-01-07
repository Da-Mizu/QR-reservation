# Script pour démarrer le frontend admin sur le port 3002
$env:PORT = "3002"
$env:REACT_APP_API_URL = "http://localhost:3001/api"
$env:DANGEROUSLY_DISABLE_HOST_CHECK = "true"
Set-Location frontend-admin
npm start
