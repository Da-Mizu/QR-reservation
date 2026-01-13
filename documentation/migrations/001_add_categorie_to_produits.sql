-- ============================================
-- Migration: Ajouter colonne categorie à produits
-- Date: 2026-01-13
-- Description: Ajoute une colonne 'categorie' pour organiser les produits par type
-- ============================================

-- Ajouter la colonne categorie si elle n'existe pas déjà
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS categorie VARCHAR(100) DEFAULT NULL AFTER prix;

-- Créer un index pour améliorer les performances de recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);

-- Optionnel: Mettre à jour les produits existants avec des catégories par défaut
-- Décommentez les lignes ci-dessous si vous voulez catégoriser automatiquement

-- UPDATE produits SET categorie = 'Pizza' WHERE nom LIKE '%Pizza%';
-- UPDATE produits SET categorie = 'Burger' WHERE nom LIKE '%Burger%';
-- UPDATE produits SET categorie = 'Salade' WHERE nom LIKE '%Salade%';
-- UPDATE produits SET categorie = 'Boissons' WHERE nom LIKE '%Coca%' OR nom LIKE '%Eau%' OR nom LIKE '%Jus%';
-- UPDATE produits SET categorie = 'Accompagnements' WHERE nom LIKE '%Frites%';

-- Vérifier les changements
SELECT id, nom, prix, categorie FROM produits LIMIT 10;
