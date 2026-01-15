import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Modal, Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

export default function StatsModal({ show, onHide }) {
  const { token } = useContext(AuthContext);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/stats/advanced`, config);
      setAdvancedStats(res.data || {});
    } catch (e) {
      console.error('Erreur chargement stats:', e);
      setAdvancedStats({ error: 'Erreur lors du chargement des statistiques' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) loadStats();
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>📊 Statistiques avancées</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center text-muted py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Chargement des statistiques...
          </div>
        )}

        {!loading && advancedStats && advancedStats.error && (
          <div className="alert alert-danger">{advancedStats.error}</div>
        )}

        {!loading && advancedStats && !advancedStats.error && (
          <>
            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-center border-primary">
                  <Card.Body>
                    <Card.Title className="text-muted small">⏱️ Temps moyen de service</Card.Title>
                    <h3 className="text-primary">{advancedStats.temps_moyen_service_minutes || 0} min</h3>
                    <small className="text-muted">7 derniers jours</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-success">
                  <Card.Body>
                    <Card.Title className="text-muted small">🍽️ Produits vendus</Card.Title>
                    <h3 className="text-success">
                      {advancedStats.produits_populaires ? advancedStats.produits_populaires.reduce((sum, p) => sum + parseInt(p.total_vendu || 0), 0) : 0}
                    </h3>
                    <small className="text-muted">30 derniers jours</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-warning">
                  <Card.Body>
                    <Card.Title className="text-muted small">📈 Heure de pointe</Card.Title>
                    <h3 className="text-warning">
                      {advancedStats.heures_pointe && advancedStats.heures_pointe.length > 0 ? (
                        (() => {
                          const max = advancedStats.heures_pointe.reduce((prev, cur) => cur.nombre_commandes > prev.nombre_commandes ? cur : prev, { heure: 0, nombre_commandes: 0 });
                          return max.nombre_commandes > 0 ? `${max.heure}h - ${max.heure + 1}h` : '—';
                        })()
                      ) : '—'}
                    </h3>
                    <small className="text-muted">
                      {advancedStats.heures_pointe ? advancedStats.heures_pointe.reduce((max, h) => h.nombre_commandes > max ? h.nombre_commandes : max, 0) : 0} commandes
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {advancedStats.produits_populaires && advancedStats.produits_populaires.length > 0 && (
              <Row className="mb-4">
                <Col>
                  <h6 className="mb-3">🏆 Top 5 Produits (30 derniers jours)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Produit</th>
                          <th className="text-center">Quantité vendue</th>
                          <th className="text-center">Commandes</th>
                          <th className="text-end">Revenus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedStats.produits_populaires.slice(0, 5).map((p, idx) => (
                          <tr key={p.id}>
                            <td>{idx + 1}</td>
                            <td><strong>{p.nom}</strong>{p.image && <span className="ms-2">🖼️</span>}</td>
                            <td className="text-center">{p.total_vendu}</td>
                            <td className="text-center">{p.nombre_commandes}</td>
                            <td className="text-end">{parseFloat(p.revenu_total || 0).toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Col>
              </Row>
            )}

            {advancedStats.heures_pointe && advancedStats.heures_pointe.length > 0 && (
              <Row>
                <Col>
                  <h6 className="mb-3">🕐 Distribution des commandes par heure (7 derniers jours)</h6>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {advancedStats.heures_pointe.map((h) => {
                      const maxCommandes = Math.max(...advancedStats.heures_pointe.map(x => x.nombre_commandes), 1);
                      const height = (h.nombre_commandes / maxCommandes) * 100;
                      return (
                        <div key={h.heure} style={{ flex: '0 0 30px', height: `${Math.max(height, 2)}%`, backgroundColor: h.nombre_commandes > 0 ? '#0d6efd' : '#e9ecef', borderRadius: '3px 3px 0 0', position: 'relative', minHeight: h.nombre_commandes > 0 ? '8px' : '2px' }} title={`${h.heure}h: ${h.nombre_commandes} commandes`}>
                          {h.nombre_commandes > 0 && (
                            <small style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', whiteSpace: 'nowrap' }}>{h.nombre_commandes}</small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px', overflowX: 'auto' }}>
                    {advancedStats.heures_pointe.map((h) => (
                      <div key={h.heure} style={{ flex: '0 0 30px', textAlign: 'center', fontSize: '10px' }}>{h.heure}h</div>
                    ))}
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
      </Modal.Footer>
    </Modal>
  );
}
