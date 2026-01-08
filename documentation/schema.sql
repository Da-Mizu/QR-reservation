-- ============================================
-- QR Reservation - Database Schema
-- ============================================

-- Supprimez tout d'abord (optionnel)
-- DROP DATABASE IF EXISTS qr_reservation;
-- CREATE DATABASE qr_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE qr_reservation;

-- ============================================
-- TABLE 1: PRODUITS
-- ============================================
CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 2: COMMANDES
-- ============================================
CREATE TABLE IF NOT EXISTS commandes (
    id VARCHAR(50) PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    table_number VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_statut (statut),
    INDEX idx_table (table_number),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 3: COMMANDE_ITEMS (Liaison)
-- ============================================
-- Stocke la relation entre commandes et produits
-- Chaque ligne = 1 produit dans 1 commande
CREATE TABLE IF NOT EXISTS commande_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id VARCHAR(50) NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT,
    INDEX idx_commande (commande_id),
    INDEX idx_produit (produit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INDICES SUPPLÉMENTAIRES POUR LES STATS
-- ============================================
CREATE INDEX idx_commandes_created ON commandes(created_at);
CREATE INDEX idx_commande_items_prix ON commande_items(prix);

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================
-- Insérer les produits de base
INSERT IGNORE INTO produits (nom, description, prix, disponible) VALUES
('Pizza Margherita', 'Tomate, mozzarella, basilic', 11.50, 1),
('Pizza Pepperoni', 'Pepperoni, mozzarella, sauce tomate', 13.00, 1),
('Burger Maison', 'Steak, cheddar, salade, sauce maison', 10.00, 1),
('Salade César', 'Poulet, parmesan, croûtons', 8.50, 1),
('Frites', 'Portion de frites croustillantes', 3.50, 1),
('Coca-Cola 33cl', 'Boisson gazeuse', 2.50, 1),
('Eau Minérale', 'Bouteille 50cl', 1.80, 1);
