# Migrations de base de données

Ce dossier contient les scripts de migration SQL pour mettre à jour le schéma de la base de données.

## Comment exécuter une migration

### Option 1: Via phpMyAdmin
1. Ouvrez phpMyAdmin: `http://localhost/phpmyadmin`
2. Sélectionnez votre base de données (ex: `qr_reservation`)
3. Cliquez sur l'onglet "SQL"
4. Copiez-collez le contenu du fichier de migration
5. Cliquez sur "Exécuter"

### Option 2: Via ligne de commande MySQL
```bash
# Depuis le dossier QR-reservation
cd documentation/migrations

# Exécuter la migration
mysql -u root -p qr_reservation < 001_add_categorie_to_produits.sql
```

### Option 3: Via PowerShell (XAMPP)
```powershell
# Depuis le dossier QR-reservation
cd documentation\migrations

# Exécuter via XAMPP MySQL
C:\xampp\mysql\bin\mysql.exe -u root -p qr_reservation < 001_add_categorie_to_produits.sql
```

## Liste des migrations

| Fichier | Date | Description |
|---------|------|-------------|
| `001_add_categorie_to_produits.sql` | 2026-01-13 | Ajoute la colonne `categorie` à la table `produits` |

## Ordre d'exécution

Les migrations doivent être exécutées dans l'ordre numérique du préfixe (001, 002, etc.).

## Vérification

Après exécution d'une migration, vérifiez que tout fonctionne:
```sql
-- Vérifier la structure de la table
DESCRIBE produits;

-- Vérifier les données
SELECT * FROM produits LIMIT 5;
```
