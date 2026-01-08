import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Menu.css';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

// Force les champs numériques à être des nombres pour éviter les .toFixed sur des strings
const normalizeProduit = (p) => ({
  ...p,
  prix: Number(p.prix) || 0,
});

function Menu() {
  const [produits, setProduits] = useState([]);
  const [panier, setPanier] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    chargerProduits();
    // Charger le panier depuis localStorage
    const panierSauvegarde = localStorage.getItem('panier');
    if (panierSauvegarde) {
      setPanier(JSON.parse(panierSauvegarde).map(normalizeProduit));
    }
    
    // Récupérer le numéro de table et le restaurantId depuis l'URL et les stocker
    const tableNumber = searchParams.get('table');
    const restaurantId = searchParams.get('restaurant') || '1'; // Par défaut restaurant_id = 1
    
    console.log('Numéro de table depuis URL:', tableNumber);
    console.log('ID restaurant depuis QR:', restaurantId);
    
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
      console.log('Numéro de table sauvegardé:', tableNumber);
    }
    
    // Toujours sauvegarder le restaurantId (important pour multi-restaurant)
    localStorage.setItem('restaurantId', restaurantId);
    console.log('ID restaurant sauvegardé:', restaurantId);
  }, [searchParams]);

  const chargerProduits = async () => {
    try {
      const response = await axios.get(`${API_URL}/produits`);
      setProduits(response.data.map(normalizeProduit));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setLoading(false);
    }
  };

  const ajouterAuPanier = (produit) => {
    const produitNormalise = normalizeProduit(produit);
    const produitExistant = panier.find(item => item.id === produitNormalise.id);
    
    if (produitExistant) {
      const nouveauPanier = panier.map(item =>
        item.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
          : item
      );
      setPanier(nouveauPanier);
      localStorage.setItem('panier', JSON.stringify(nouveauPanier));
    } else {
      const nouveauPanier = [...panier, { ...produitNormalise, quantite: 1 }];
      setPanier(nouveauPanier);
      localStorage.setItem('panier', JSON.stringify(nouveauPanier));
    }
  };

  const retirerDuPanier = (produitId) => {
    const nouveauPanier = panier
      .map(item =>
        item.id === produitId
          ? { ...item, quantite: item.quantite - 1 }
          : item
      )
      .filter(item => item.quantite > 0);
    
    setPanier(nouveauPanier);
    localStorage.setItem('panier', JSON.stringify(nouveauPanier));
  };

  const getQuantiteDansPanier = (produitId) => {
    const item = panier.find(item => item.id === produitId);
    return item ? item.quantite : 0;
  };

  const getTotalPanier = () => {
    return panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
  };

  if (loading) {
    return (
      <div className="menu-container">
        <div className="loading">Chargement du menu...</div>
      </div>
    );
  }

  const tableNumber = localStorage.getItem('tableNumber');

  return (
    <div className="menu-container">
      <div className="menu-header">
        <div>
          <h1>Notre Menu</h1>
          {tableNumber && (
            <p className="table-info">Table: {tableNumber}</p>
          )}
        </div>
        <button 
          className="btn btn-primary panier-btn"
          onClick={() => navigate('/panier')}
        >
          Panier ({panier.length}) - {getTotalPanier().toFixed(2)}€
        </button>
      </div>

      <div className="produits-grid">
        {produits.map(produit => (
          <div key={produit.id} className="produit-card">
            <div className="produit-info">
              <h3>{produit.nom}</h3>
              <p className="produit-description">{produit.description}</p>
              <p className="produit-prix">{produit.prix.toFixed(2)}€</p>
            </div>
            <div className="produit-actions">
              {getQuantiteDansPanier(produit.id) > 0 ? (
                <div className="quantite-controls">
                  <button 
                    className="btn-quantite"
                    onClick={() => retirerDuPanier(produit.id)}
                  >
                    -
                  </button>
                  <span className="quantite">{getQuantiteDansPanier(produit.id)}</span>
                  <button 
                    className="btn-quantite"
                    onClick={() => ajouterAuPanier(produit)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => ajouterAuPanier(produit)}
                >
                  Ajouter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Menu;
