import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Panier.css';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

function Panier() {
  const [panier, setPanier] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const panierSauvegarde = localStorage.getItem('panier');
    if (panierSauvegarde) {
      setPanier(JSON.parse(panierSauvegarde));
    } else {
      navigate('/menu');
    }
  }, [navigate]);

  const modifierQuantite = (produitId, changement) => {
    const nouveauPanier = panier
      .map(item =>
        item.id === produitId
          ? { ...item, quantite: item.quantite + changement }
          : item
      )
      .filter(item => item.quantite > 0);
    
    setPanier(nouveauPanier);
    localStorage.setItem('panier', JSON.stringify(nouveauPanier));
  };

  const retirerProduit = (produitId) => {
    const nouveauPanier = panier.filter(item => item.id !== produitId);
    setPanier(nouveauPanier);
    localStorage.setItem('panier', JSON.stringify(nouveauPanier));
  };

  const getTotal = () => {
    return panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    setLoading(true);

    try {
      // Récupérer le numéro de table et le restaurant_id depuis localStorage
      const tableNumber = localStorage.getItem('tableNumber');
      const restaurantId = localStorage.getItem('restaurantId') || '1';
      console.log('Numéro de table récupéré:', tableNumber);
      console.log('ID restaurant récupéré:', restaurantId);
      
      const commande = {
        nom: formData.nom,
        email: formData.email || null,
        telephone: formData.telephone || null,
        table_number: tableNumber || null,
        restaurant_id: parseInt(restaurantId) || 1,  // IMPORTANT: Ajouter le restaurant_id
        items: panier.map(item => ({
          id: item.id,
          nom: item.nom,
          prix: item.prix,
          quantite: item.quantite
        })),
        total: getTotal()
      };
      
      console.log('Commande à envoyer:', commande);
      console.log('restaurant_id dans la commande:', commande.restaurant_id);

      const response = await axios.post(`${API_URL}/commandes`, commande);
      
      // Vider le panier
      localStorage.removeItem('panier');
      
      // Rediriger vers la page de confirmation
      navigate(`/confirmation?id=${response.data.id}`);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Une erreur est survenue lors de la commande. Veuillez réessayer.');
      setLoading(false);
    }
  };

  if (panier.length === 0) {
    return (
      <div className="panier-container">
        <div className="panier-card">
          <h1>Votre panier est vide</h1>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panier-container">
      <div className="panier-card">
        <h1>Votre Panier</h1>
        
        <div className="panier-items">
          {panier.map(item => (
            <div key={item.id} className="panier-item">
              <div className="item-info">
                <h3>{item.nom}</h3>
                <p>{item.prix.toFixed(2)}€ × {item.quantite}</p>
              </div>
              <div className="item-actions">
                <div className="quantite-controls">
                  <button 
                    className="btn-quantite"
                    onClick={() => modifierQuantite(item.id, -1)}
                  >
                    -
                  </button>
                  <span className="quantite">{item.quantite}</span>
                  <button 
                    className="btn-quantite"
                    onClick={() => modifierQuantite(item.id, 1)}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="btn-remove"
                  onClick={() => retirerProduit(item.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="panier-total">
          <h2>Total: {getTotal().toFixed(2)}€</h2>
        </div>

        <form onSubmit={handleSubmit} className="commande-form">
          <div className="input-group">
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email (optionnel)</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label htmlFor="telephone">Téléphone (optionnel)</label>
            <input
              type="tel"
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/menu')}
            >
              Retour au menu
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Traitement...' : 'Valider la commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Panier;
