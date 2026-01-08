import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Spinner, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';
import { AuthContext } from '../context/AuthContext';

// Normalise l'URL API pour éviter /index.php/api ou /api/api
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
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
  const { token } = useContext(AuthContext);

  useEffect(() => {
    chargerCommandes();
    let interval;
    if (autoRefresh) {
      interval = setInterval(chargerCommandes, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, token]);

  const chargerCommandes = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/commandes`, config);
      setCommandes(response.data.map(normalizeCommande));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setLoading(false);
    }
  };

  const mettreAJourStatut = async (commandeId, nouveauStatut) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${API_URL}/commandes/${commandeId}/statut`, {
        statut: nouveauStatut
      }, config);
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

  const getStatutVariant = (statut) => {
    const variants = {
      'en_attente': 'warning',
      'en_preparation': 'info',
      'prete': 'success',
      'terminee': 'secondary',
      'annulee': 'danger'
    };
    return variants[statut] || 'secondary';
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
      <>
        <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
          <Container fluid>
            <Navbar.Brand className="fw-bold">Tableau de bord</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbar-nav" />
            <Navbar.Collapse id="navbar-nav" className="justify-content-end">
              <Nav className="gap-2">
                <Button 
                  variant={autoRefresh ? 'success' : 'secondary'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Auto ✓' : 'Auto ✗'}
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand className="fw-bold">Tableau de bord</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <Nav className="gap-2">
              <Link 
                to="/qr-generator"
                className="btn btn-success btn-sm text-white text-decoration-none"
              >
                📱 Générer QR
              </Link>
              <Button 
                variant={autoRefresh ? 'success' : 'secondary'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto ✓' : 'Auto ✗'}
              </Button>
              <Button 
                variant="primary"
                size="sm"
                onClick={chargerCommandes}
              >
                Actualiser
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Gestion des commandes</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-muted small">Total</Card.Title>
              <h2>{stats.total}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-muted small">En attente</Card.Title>
              <h2 className="text-warning">{stats.en_attente}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-muted small">En préparation</Card.Title>
              <h2 className="text-info">{stats.en_preparation}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-muted small">Revenus</Card.Title>
              <h2 className="text-success">{stats.totalRevenus.toFixed(2)}€</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <div className="d-flex gap-2 flex-wrap">
            {['toutes', 'en_attente', 'en_preparation', 'prete', 'terminee'].map(status => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status === 'toutes' ? 'Toutes' : getStatutLabel(status)}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      <Row>
        {commandesFiltrees.length === 0 ? (
          <Col>
            <p className="text-center text-muted">Aucune commande trouvée</p>
          </Col>
        ) : (
          commandesFiltrees.map(commande => (
            <Col lg={6} className="mb-4" key={commande.id}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">Commande #{commande.id.substring(0, 8)}</h5>
                    {commande.table_number && (
                      <small className="text-muted">🪑 Table {commande.table_number}</small>
                    )}
                  </div>
                  <Badge bg={getStatutVariant(commande.statut)}>
                    {getStatutLabel(commande.statut)}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <p className="mb-2"><strong>{commande.nom}</strong></p>
                  {commande.email && <p className="small text-muted">📧 {commande.email}</p>}
                  {commande.telephone && <p className="small text-muted">📞 {commande.telephone}</p>}
                  
                  <hr />
                  
                  <h6 className="mb-2">Articles:</h6>
                  <ul className="small list-unstyled">
                    {commande.items.map((item, index) => (
                      <li key={index} className="mb-1">
                        {item.quantite}× {item.nom} <span className="float-end">{(item.prix * item.quantite).toFixed(2)}€</span>
                      </li>
                    ))}
                  </ul>
                  
                  <hr />
                  <p className="mb-0">
                    <strong>Total: {commande.total.toFixed(2)}€</strong>
                  </p>
                  <small className="text-muted d-block">
                    {new Date(commande.created_at).toLocaleString('fr-FR')}
                  </small>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-flex gap-2 flex-wrap">
                    {commande.statut === 'en_attente' && (
                      <>
                        <Button 
                          variant="info"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'en_preparation')}
                        >
                          Préparer
                        </Button>
                        <Button 
                          variant="danger"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'annulee')}
                        >
                          Annuler
                        </Button>
                      </>
                    )}
                    {commande.statut === 'en_preparation' && (
                      <>
                        <Button 
                          variant="success"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'prete')}
                        >
                          Prête
                        </Button>
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'en_attente')}
                        >
                          Retour
                        </Button>
                      </>
                    )}
                    {commande.statut === 'prete' && (
                      <>
                        <Button 
                          variant="primary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'terminee')}
                        >
                          Terminée
                        </Button>
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => mettreAJourStatut(commande.id, 'en_preparation')}
                        >
                          Retour
                        </Button>
                      </>
                    )}
                    {commande.statut === 'terminee' && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="w-100"
                        onClick={() => mettreAJourStatut(commande.id, 'prete')}
                      >
                        Retour prête
                      </Button>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
    </>
  );
}

export default Dashboard;

