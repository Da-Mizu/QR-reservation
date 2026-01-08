import React, { useEffect, useState } from 'react';
import './DebugCommandes.css';

function DebugCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/debug_list_commandes.php`);
        const data = await res.json();
        if (data.success) setCommandes(data.commandes || []);
        else setError(data.error || 'Erreur inconnue');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCommandes();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Debug — Commandes récentes</h2>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table className="debug-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Resto</th>
              <th>Table</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Créée</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map(c => (
              <tr key={c.id}>
                <td style={{ maxWidth: 300, overflowWrap: 'anywhere' }}>{c.id}</td>
                <td>{c.restaurant_id}</td>
                <td>{c.table_number}</td>
                <td>{c.total}</td>
                <td>{c.statut}</td>
                <td>{c.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DebugCommandes;
