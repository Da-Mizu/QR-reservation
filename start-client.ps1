# Script pour démarrer le frontend client sur le port 3000
$env:PORT = "3000"
$env:REACT_APP_API_URL = "http://localhost:3001/api"
Set-Location frontend-client
npm start
