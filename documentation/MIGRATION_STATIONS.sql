-- Migration: Add stations support
-- Run this after initial schema setup

-- Add station column to produits table
ALTER TABLE produits ADD COLUMN station VARCHAR(100) DEFAULT NULL AFTER categorie;
ALTER TABLE produits ADD INDEX idx_station (station);

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#0d6efd',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_restaurant_nom (restaurant_id, nom),
    INDEX idx_restaurant (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
