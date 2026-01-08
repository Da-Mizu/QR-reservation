import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Spinner, Row, Col, Card, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Stats.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php/index.php/api';

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
      <>
        <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
          <Container fluid>
            <Navbar.Brand className="fw-bold">Tableau de bord</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbar-nav" />
            <Navbar.Collapse id="navbar-nav" className="justify-content-end">
              <Nav className="gap-2">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={chargerStats}
                >
                  Actualiser
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

  if (!stats) {
    return (
      <>
        <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
          <Container fluid>
            <Navbar.Brand className="fw-bold">Tableau de bord</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbar-nav" />
            <Navbar.Collapse id="navbar-nav" className="justify-content-end">
              <Nav className="gap-2">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={chargerStats}
                >
                  Actualiser
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="py-4">
          <p className="text-center text-muted">Erreur: Impossible de charger les statistiques.</p>
          <div className="text-center">
            <Button 
              variant="primary" 
              onClick={chargerStats}
            >
              Réessayer
            </Button>
          </div>
        </Container>
      </>
    );
  }

  const revenusTotaux = parseFloat(stats.revenus_totaux) || 0;
  const panierMoyen = parseFloat(stats.panier_moyen) || 0;
  const totalCommandes = parseInt(stats.total_commandes) || 0;

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand className="fw-bold">Tableau de bord</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <Nav className="gap-2">
              <Button 
                variant="primary"
                size="sm"
                onClick={chargerStats}
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
            <h2 className="mb-0">Statistiques</h2>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-muted small">Revenus totaux</Card.Title>
                <h2 className="text-success">{revenusTotaux.toFixed(2)}€</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-muted small">Total commandes</Card.Title>
                <h2>{totalCommandes}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-muted small">Panier moyen</Card.Title>
                <h2 className="text-info">{panierMoyen.toFixed(2)}€</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-muted small">En préparation</Card.Title>
                <h2 className="text-warning">{stats?.en_preparation || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Statistiques par table */}
        {statsTables.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="bg-white border-bottom">
                  <Card.Title className="mb-0">🪑 Statistiques par table</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Table</th>
                        <th>Commandes</th>
                        <th>Revenus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsTables.map((stat, index) => (
                        <tr key={index}>
                          <td><strong>Table {stat.table_number}</strong></td>
                          <td>{stat.nombre_commandes}</td>
                          <td>{parseFloat(stat.revenus || 0).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Statistiques par jour */}
        {statsJours.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="bg-white border-bottom">
                  <Card.Title className="mb-0">📅 Évolution sur 30 jours</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Commandes</th>
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
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Produits les plus commandés */}
        {statsProduits.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="bg-white border-bottom">
                  <Card.Title className="mb-0">🍕 Produits les plus commandés</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Commandes</th>
                        <th>Quantité</th>
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
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {statsTables.length === 0 && statsJours.length === 0 && statsProduits.length === 0 && (
          <Row>
            <Col>
              <Card className="text-center">
                <Card.Body className="py-5">
                  <p className="text-muted mb-2">Aucune statistique disponible pour le moment.</p>
                  <p className="text-muted small">Les statistiques apparaîtront après la première commande.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

export default Stats;
