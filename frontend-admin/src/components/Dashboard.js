import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php/index.php/api';

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  // support "3,5" coming de la BDD
  const normalized = String(val).replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeCommande = (c) => ({
  ...c,
  total: toNumber(c.total),
  items: (c.items || []).map((it) => ({
    ...it,
    prix: toNumber(it.prix),
    quantite: toNumber(it.quantite),
  })),
});

function Dashboard() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('toutes');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    chargerCommandes();
    
    // Auto-refresh toutes les 5 secondes si activé
    let interval;
    if (autoRefresh) {
      interval = setInterval(chargerCommandes, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const chargerCommandes = async () => {
    try {
      const response = await axios.get(`${API_URL}/commandes`);
      // Debug: vérifier les données
      console.log('Commandes chargées:', response.data);
      if (response.data.length > 0) {
        console.log('Première commande:', response.data[0]);
        console.log('table_number de la première commande:', response.data[0].table_number);
      }
      setCommandes(response.data.map(normalizeCommande));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setLoading(false);
    }
  };

  const mettreAJourStatut = async (commandeId, nouveauStatut) => {
    try {
      await axios.patch(`${API_URL}/commandes/${commandeId}/statut`, {
        statut: nouveauStatut
      });
      chargerCommandes();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const commandesFiltrees = filter === 'toutes' 
    ? commandes 
    : commandes.filter(c => c.statut === filter);

  const stats = {
    total: commandes.length,
    en_attente: commandes.filter(c => c.statut === 'en_attente').length,
    en_preparation: commandes.filter(c => c.statut === 'en_preparation').length,
    prete: commandes.filter(c => c.statut === 'prete').length,
    terminee: commandes.filter(c => c.statut === 'terminee').length,
    totalRevenus: commandes.reduce((sum, c) => sum + toNumber(c.total), 0)
  };

  const getStatutColor = (statut) => {
    const colors = {
      'en_attente': '#ffc107',
      'en_preparation': '#17a2b8',
      'prete': '#28a745',
      'terminee': '#6c757d',
      'annulee': '#dc3545'
    };
    return colors[statut] || '#6c757d';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'en_preparation': 'En préparation',
      'prete': 'Prête',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Tableau de bord - Gestion des commandes</h1>
        <div className="header-actions">
          <button 
            className={`btn ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
          </button>
          <button className="btn btn-primary" onClick={chargerCommandes}>
            Actualiser
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total commandes</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card stat-warning">
          <h3>En attente</h3>
          <p className="stat-value">{stats.en_attente}</p>
        </div>
        <div className="stat-card stat-info">
          <h3>En préparation</h3>
          <p className="stat-value">{stats.en_preparation}</p>
        </div>
        <div className="stat-card stat-success">
          <h3>Prêtes</h3>
          <p className="stat-value">{stats.prete}</p>
        </div>
        <div className="stat-card stat-revenue">
          <h3>Revenus totaux</h3>
          <p className="stat-value">{stats.totalRevenus.toFixed(2)}€</p>
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'toutes' ? 'active' : ''}`}
          onClick={() => setFilter('toutes')}
        >
          Toutes
        </button>
        <button 
          className={`filter-btn ${filter === 'en_attente' ? 'active' : ''}`}
          onClick={() => setFilter('en_attente')}
        >
          En attente
        </button>
        <button 
          className={`filter-btn ${filter === 'en_preparation' ? 'active' : ''}`}
          onClick={() => setFilter('en_preparation')}
        >
          En préparation
        </button>
        <button 
          className={`filter-btn ${filter === 'prete' ? 'active' : ''}`}
          onClick={() => setFilter('prete')}
        >
          Prêtes
        </button>
        <button 
          className={`filter-btn ${filter === 'terminee' ? 'active' : ''}`}
          onClick={() => setFilter('terminee')}
        >
          Terminées
        </button>
      </div>

      <div className="commandes-list">
        {commandesFiltrees.length === 0 ? (
          <div className="no-commandes">
            <p>Aucune commande trouvée</p>
          </div>
        ) : (
          commandesFiltrees.map(commande => (
            <div key={commande.id} className="commande-card">
              <div className="commande-header">
                <div className="commande-info">
                  <h3>Commande #{commande.id.substring(0, 8)}</h3>
                  {commande.table_number ? (
                    <p className="commande-table">🪑 Table: {commande.table_number}</p>
                  ) : (
                    <p className="commande-table-empty">🪑 Table: Non spécifiée</p>
                  )}
                  <p className="commande-client">{commande.nom}</p>
                  {commande.email && <p className="commande-contact">📧 {commande.email}</p>}
                  {commande.telephone && <p className="commande-contact">📞 {commande.telephone}</p>}
                </div>
                <div className="commande-meta">
                  <span 
                    className="statut-badge"
                    style={{ backgroundColor: getStatutColor(commande.statut) }}
                  >
                    {getStatutLabel(commande.statut)}
                  </span>
                  <p className="commande-date">
                    {new Date(commande.created_at).toLocaleString('fr-FR')}
                  </p>
                  <p className="commande-total">{commande.total.toFixed(2)}€</p>
                </div>
              </div>

              <div className="commande-items">
                <h4>Articles:</h4>
                <ul>
                  {commande.items.map((item, index) => (
                    <li key={index}>
                      {item.quantite}× {item.nom} - {(item.prix * item.quantite).toFixed(2)}€
                    </li>
                  ))}
                </ul>
              </div>

              <div className="commande-actions">
                {commande.statut === 'en_attente' && (
                  <>
                    <button 
                      className="btn btn-info"
                      onClick={() => mettreAJourStatut(commande.id, 'en_preparation')}
                    >
                      Commencer la préparation
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => mettreAJourStatut(commande.id, 'annulee')}
                    >
                      Annuler
                    </button>
                  </>
                )}
                {commande.statut === 'en_preparation' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => mettreAJourStatut(commande.id, 'prete')}
                    >
                      Marquer comme prête
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => mettreAJourStatut(commande.id, 'en_attente')}
                    >
                      Retour en attente
                    </button>
                  </>
                )}
                {commande.statut === 'prete' && (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => mettreAJourStatut(commande.id, 'terminee')}
                    >
                      Marquer comme terminée
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => mettreAJourStatut(commande.id, 'en_preparation')}
                    >
                      Retour en préparation
                    </button>
                  </>
                )}
                {commande.statut === 'terminee' && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => mettreAJourStatut(commande.id, 'prete')}
                  >
                    Retour à prête
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
