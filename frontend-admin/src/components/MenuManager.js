import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

function MenuManager() {
  const [produits, setProduits] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie: '',
    disponible: true,
    station: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    chargerProduits();
    chargerStations();
  }, [token]);

  const chargerStations = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/stations`, config);
      const data = Array.isArray(response.data) ? response.data : [];
      setStations(data);
    } catch (error) {
      console.error('Erreur chargement stations:', error);
      setStations([]);
      // Non-fatal, continue without stations
    }
  };

  const chargerProduits = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/produits/all`, config);
      setProduits(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setError('Erreur lors du chargement des produits');
      setLoading(false);
    }
  };

  const handleShowModal = (produit = null) => {
    if (produit) {
      setEditingProduit(produit);
      setFormData({
        nom: produit.nom || '',
        description: produit.description || '',
        prix: produit.prix || '',
        categorie: produit.categorie || '',
        disponible: produit.disponible === 1 || produit.disponible === true,
        station: produit.station || ''
      });
      setImagePreview(produit.image || null);
    } else {
      setEditingProduit(null);
      setFormData({
        nom: '',
        description: '',
        prix: '',
        categorie: '',
        disponible: true,
        station: ''
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduit(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!formData.prix || parseFloat(formData.prix) < 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // If an image is selected, use FormData (multipart). Otherwise send JSON.
      if (imageFile) {
        const fd = new FormData();
        fd.append('nom', formData.nom);
        fd.append('description', formData.description || '');
        fd.append('prix', parseFloat(formData.prix));
        fd.append('categorie', formData.categorie || '');
        fd.append('station', formData.station || '');
        fd.append('disponible', formData.disponible ? 1 : 0);
        fd.append('image', imageFile);

        if (editingProduit) {
          // Use POST for multipart updates so PHP receives $_FILES
          await axios.post(`${API_URL}/produits/${editingProduit.id}`, fd, config);
        } else {
          await axios.post(`${API_URL}/produits`, fd, config);
        }
      } else {
        const payload = {
          ...formData,
          prix: parseFloat(formData.prix),
          disponible: formData.disponible ? 1 : 0
        };

        if (editingProduit) {
          await axios.put(`${API_URL}/produits/${editingProduit.id}`, payload, config);
        } else {
          await axios.post(`${API_URL}/produits`, payload, config);
        }
      }

      handleCloseModal();
      chargerProduits();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setError(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API_URL}/produits/${id}`, config);
      chargerProduits();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleDisponible = async (produit) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${API_URL}/produits/${produit.id}/disponible`, {
        disponible: produit.disponible === 1 ? 0 : 1
      }, config);
      chargerProduits();
    } catch (error) {
      console.error('Erreur toggle disponible:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  const categories = [...new Set(produits.map(p => p.categorie).filter(Boolean))];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Gestion du Menu</h2>
            <Button variant="success" onClick={() => handleShowModal()}>
              ➕ Nouveau produit
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Prix</th>
                    <th>Catégorie</th>
                    <th>Poste</th>
                    <th>Disponible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        Aucun produit trouvé
                      </td>
                    </tr>
                  ) : (
                    produits.map(produit => (
                      <tr key={produit.id}>
                        <td><strong>{produit.nom}</strong></td>
                        <td className="small text-muted">{produit.description || '—'}</td>
                        <td><strong>{parseFloat(produit.prix).toFixed(2)}€</strong></td>
                        <td>
                          {produit.categorie ? (
                            <Badge bg="secondary">{produit.categorie}</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {produit.station ? (
                            <Badge bg="info">{produit.station}</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant={produit.disponible === 1 ? 'success' : 'danger'}
                            size="sm"
                            onClick={() => toggleDisponible(produit)}
                          >
                            {produit.disponible === 1 ? '✓ Disponible' : '✗ Indisponible'}
                          </Button>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleShowModal(produit)}
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(produit.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Créer/Modifier */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduit ? 'Modifier le produit' : 'Nouveau produit'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Nom *</Form.Label>
              <Form.Control
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Prix (€) *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Catégorie</Form.Label>
              <Form.Control
                type="text"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <Form.Text className="text-muted">
                Tapez une nouvelle catégorie ou choisissez parmi les existantes
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Poste de préparation</Form.Label>
              <Form.Select
                name="station"
                value={formData.station}
                onChange={handleChange}
              >
                <option value="">Aucun</option>
                {stations.map(station => (
                  <option key={station.id} value={station.nom}>
                    {station.nom}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Sélectionnez le poste responsable de ce produit
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Photo du produit</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Aperçu" style={{maxWidth: '160px', borderRadius: 8}} />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Disponible"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingProduit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default MenuManager;
