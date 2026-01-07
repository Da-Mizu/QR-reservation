import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Stats.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Stats() {
  const [stats, setStats] = useState(null);
  const [statsTables, setStatsTables] = useState([]);
  const [statsJours, setStatsJours] = useState([]);
  const [statsProduits, setStatsProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('tous');

  useEffect(() => {
    chargerStats();
  }, []);

  const chargerStats = async () => {
    try {
      setLoading(true);
      console.log('Chargement des statistiques depuis:', API_URL);
      
      const [statsRes, tablesRes, joursRes, produitsRes] = await Promise.all([
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/stats/tables`),
        axios.get(`${API_URL}/stats/jours`),
        axios.get(`${API_URL}/stats/produits`)
      ]);
      
      console.log('Réponses reçues:');
      console.log('Stats générales:', statsRes.data);
      console.log('Stats tables:', tablesRes.data);
      console.log('Stats jours:', joursRes.data);
      console.log('Stats produits:', produitsRes.data);
      
      setStats(statsRes.data);
      setStatsTables(tablesRes.data);
      setStatsJours(joursRes.data);
      setStatsProduits(produitsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
      alert('Erreur lors du chargement des statistiques. Vérifiez la console pour plus de détails.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading">Chargement des statistiques...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-container">
        <div className="no-stats">
          <p>Erreur: Impossible de charger les statistiques.</p>
          <button className="btn btn-primary" onClick={chargerStats}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const revenusTotaux = parseFloat(stats.revenus_totaux) || 0;
  const panierMoyen = parseFloat(stats.panier_moyen) || 0;
  const totalCommandes = parseInt(stats.total_commandes) || 0;

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Statistiques</h1>
        <button className="btn btn-primary" onClick={chargerStats}>
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques générales */}
      <div className="stats-grid">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Revenus totaux</h3>
            <p className="stat-value">{revenusTotaux.toFixed(2)}€</p>
          </div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total commandes</h3>
            <p className="stat-value">{totalCommandes}</p>
          </div>
        </div>

        <div className="stat-card stat-average">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Panier moyen</h3>
            <p className="stat-value">{panierMoyen.toFixed(2)}€</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>En attente</h3>
            <p className="stat-value">{stats?.en_attente || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-preparing">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-content">
            <h3>En préparation</h3>
            <p className="stat-value">{stats?.en_preparation || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-ready">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Prêtes</h3>
            <p className="stat-value">{stats?.prete || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <h3>Terminées</h3>
            <p className="stat-value">{stats?.terminee || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-cancelled">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Annulées</h3>
            <p className="stat-value">{stats?.annulee || 0}</p>
          </div>
        </div>
      </div>

      {/* Statistiques par table */}
      {statsTables.length > 0 && (
        <div className="stats-section">
          <h2>🪑 Statistiques par table</h2>
          <div className="table-stats">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Nombre de commandes</th>
                  <th>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {statsTables.map((stat, index) => (
                  <tr key={index}>
                    <td><strong>{stat.table_number}</strong></td>
                    <td>{stat.nombre_commandes}</td>
                    <td>{parseFloat(stat.revenus || 0).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques par jour */}
      {statsJours.length > 0 && (
        <div className="stats-section">
          <h2>📅 Évolution sur 30 jours</h2>
          <div className="days-stats">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nombre de commandes</th>
                  <th>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {statsJours.map((stat, index) => (
                  <tr key={index}>
                    <td>{new Date(stat.date).toLocaleDateString('fr-FR')}</td>
                    <td>{stat.nombre_commandes}</td>
                    <td>{parseFloat(stat.revenus || 0).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Produits les plus commandés */}
      {statsProduits.length > 0 && (
        <div className="stats-section">
          <h2>🍕 Produits les plus commandés</h2>
          <div className="products-stats">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Nombre de commandes</th>
                  <th>Quantité totale</th>
                  <th>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {statsProduits.map((stat, index) => (
                  <tr key={index}>
                    <td><strong>{stat.nom}</strong></td>
                    <td>{stat.nombre_commandes}</td>
                    <td>{stat.quantite_totale}</td>
                    <td>{parseFloat(stat.revenus || 0).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statsTables.length === 0 && statsJours.length === 0 && statsProduits.length === 0 && (
        <div className="no-stats">
          <p>Aucune statistique disponible pour le moment.</p>
          <p>Les statistiques apparaîtront après la première commande.</p>
        </div>
      )}
    </div>
  );
}

export default Stats;
