import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Confirmation.css';

// Normalise API URL
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

const normalizeCommande = (cmd) => {
  if (!cmd) return cmd;
  return {
    ...cmd,
    total: Number(cmd.total) || 0,
    items: (cmd.items || []).map(it => ({
      ...it,
      prix: Number(it.prix) || 0,
      quantite: Number(it.quantite) || 0,
    })),
  };
};

function Confirmation() {
  const [searchParams] = useSearchParams();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const commandeId = searchParams.get('id');

  useEffect(() => {
    if (commandeId) {
      chargerCommande();
    } else {
      setLoading(false);
    }
  }, [commandeId]);

  const chargerCommande = async () => {
    try {
      // Passer restaurant depuis localStorage si disponible (QR flow)
      const restaurantId = localStorage.getItem('restaurantId');
      const url = restaurantId
        ? `${API_URL}/commandes/${commandeId}?restaurant=${encodeURIComponent(restaurantId)}`
        : `${API_URL}/commandes/${commandeId}`;
      const response = await axios.get(url);
      setCommande(normalizeCommande(response.data));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h1>Commande non trouvée</h1>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <h1>Commande confirmée !</h1>
        <p className="confirmation-message">
          Merci {commande.nom} ! Votre commande a été enregistrée avec succès.
        </p>
        
        <div className="commande-details">
          <h2>Détails de la commande</h2>
          <p className="commande-id">ID: {commande.id}</p>
          {commande.table_number && (
            <p className="commande-table">Table: {commande.table_number}</p>
          )}
          
          <div className="commande-items">
            <h3>Articles commandés:</h3>
            {commande.items.map((item, index) => (
              <div key={index} className="commande-item">
                <span>{item.nom}</span>
                <span>{item.quantite} × {item.prix.toFixed(2)}€</span>
              </div>
            ))}
          </div>

          <div className="commande-total">
            <strong>Total: {commande.total.toFixed(2)}€</strong>
          </div>

          <div className="commande-statut">
            <p>Statut: <span className={`statut statut-${commande.statut}`}>
              {commande.statut.replace('_', ' ').toUpperCase()}
            </span></p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Nouvelle commande
        </button>
      </div>
    </div>
  );
}

export default Confirmation;
