Set-Location "C:/xampp/htdocs/QR-reservation"

git add -A

git commit -m "Sécurise mot de passe demo, supprime debug, ajoute scripts de test"

git --no-pager log -1 --pretty=format:"%h %s"
