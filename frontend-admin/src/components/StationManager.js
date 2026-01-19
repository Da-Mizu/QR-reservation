import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Table, Badge, Row, Col, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

// Normalise API URL
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

function StationManager({ show, onHide }) {
  const { token } = useContext(AuthContext);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newStation, setNewStation] = useState({ nom: '', description: '', couleur: '#0d6efd' });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  useEffect(() => {
    if (show) {
      loadStations();
    }
  }, [show]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/stations`, config);
      const data = Array.isArray(res.data) ? res.data : [];
      setStations(data);
      setError(null);
    } catch (err) {
      console.error('Error loading stations:', err);
      setStations([]);
      setError('Erreur lors du chargement des postes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!newStation.nom.trim()) {
      setError('Le nom du poste est requis');
      return;
    }

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${API_URL}/stations`, newStation, config);
      setNewStation({ nom: '', description: '', couleur: '#0d6efd' });
      await loadStations();
      setError(null);
    } catch (err) {
      console.error('Error adding station:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleEditStation = async (id) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${API_URL}/stations/${id}`, editingData, config);
      setEditingId(null);
      setEditingData({});
      await loadStations();
      setError(null);
    } catch (err) {
      console.error('Error updating station:', err);
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteStation = async (id) => {
    if (!window.confirm('Êtes-vous sûr ? Cette action ne peut pas être annulée.')) {
      return;
    }

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API_URL}/stations/${id}`, config);
      await loadStations();
      setError(null);
    } catch (err) {
      console.error('Error deleting station:', err);
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>🍳 Gestion des Postes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        {/* Add new station */}
        <Form onSubmit={handleAddStation} className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3">Ajouter un nouveau poste</h6>
          <Row>
            <Col md={5}>
              <Form.Group className="mb-2">
                <Form.Label>Nom du poste</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="ex: Grill, Friture, Pâtisserie"
                  value={newStation.nom}
                  onChange={(e) => setNewStation({ ...newStation, nom: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Couleur</Form.Label>
                <Form.Control
                  type="color"
                  value={newStation.couleur}
                  onChange={(e) => setNewStation({ ...newStation, couleur: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>&nbsp;</Form.Label>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100"
                  disabled={loading}
                >
                  ➕ Ajouter
                </Button>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Description (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="ex: Poste de cuisson à gaz"
              value={newStation.description}
              onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
            />
          </Form.Group>
        </Form>

        {/* List existing stations */}
        <div>
          <h6 className="mb-3">Postes existants</h6>
          {loading ? (
            <p className="text-muted">Chargement...</p>
          ) : stations.length === 0 ? (
            <p className="text-muted">Aucun poste pour le moment.</p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Couleur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map(station => (
                    <tr key={station.id}>
                      <td>
                        {editingId === station.id ? (
                          <Form.Control
                            type="text"
                            size="sm"
                            value={editingData.nom !== undefined ? editingData.nom : station.nom}
                            onChange={(e) => setEditingData({ ...editingData, nom: e.target.value })}
                          />
                        ) : (
                          station.nom
                        )}
                      </td>
                      <td>
                        {editingId === station.id ? (
                          <Form.Control
                            as="textarea"
                            size="sm"
                            rows={2}
                            value={editingData.description !== undefined ? editingData.description : station.description}
                            onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                          />
                        ) : (
                          station.description || '—'
                        )}
                      </td>
                      <td>
                        {editingId === station.id ? (
                          <Form.Control
                            type="color"
                            size="sm"
                            value={editingData.couleur !== undefined ? editingData.couleur : station.couleur}
                            onChange={(e) => setEditingData({ ...editingData, couleur: e.target.value })}
                          />
                        ) : (
                          <Badge style={{ backgroundColor: station.couleur }}>
                            {station.couleur}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {editingId === station.id ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleEditStation(station.id)}
                              className="me-1"
                            >
                              💾 Sauvegarder
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditingData({});
                              }}
                            >
                              ❌ Annuler
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(station.id);
                                setEditingData({ nom: station.nom, description: station.description, couleur: station.couleur });
                              }}
                              className="me-1"
                            >
                              ✏️ Éditer
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteStation(station.id)}
                            >
                              🗑️ Supprimer
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default StationManager;
