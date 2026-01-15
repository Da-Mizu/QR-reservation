import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Spinner, Row, Col, Card, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Stats.css';
import { AuthContext } from '../context/AuthContext';

// Normalise l'URL API pour éviter /index.php/api ou /api/api
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

function Stats() {
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    chargerStatsAvancees();
  }, [token]);

  const chargerStatsAvancees = async () => {
    try {
      setLoading(true);
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/stats/advanced`, config);
      setAdvancedStats(res.data || {});
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques avancées:', error, error.response?.data || '');
      setAdvancedStats({ error: 'Erreur lors du chargement des statistiques' });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const lines = [];
    const esc = (v) => ("\"" + String(v).replace(/\"/g, '""') + "\"");
    // General (from advancedStats.generales)
    const gen = advancedStats?.generales || {};
    const revenus = parseFloat(gen.revenu_total || gen.revenus_totaux || 0) || 0;
    const total = parseInt(gen.total_commandes || gen.total_commandes || 0) || 0;
    const panier = parseFloat(gen.panier_moyen || gen.panier_moyen || 0) || 0;

    lines.push(['Clé', 'Valeur']);
    lines.push(['Revenus totaux', revenus.toFixed(2)]);
    lines.push(['Total commandes', total]);
    lines.push(['Panier moyen', panier.toFixed(2)]);
    lines.push([]);

    // Top produits
    if (advancedStats?.produits_populaires && advancedStats.produits_populaires.length) {
      lines.push(['Produit', 'Quantité vendue', 'Commandes', 'Revenus']);
      advancedStats.produits_populaires.forEach(p => lines.push([p.nom, p.total_vendu, p.nombre_commandes, parseFloat(p.revenu_total || 0).toFixed(2)]));
      lines.push([]);
    }

    // Evolution 7j
    if (advancedStats?.evolution_7j && advancedStats.evolution_7j.length) {
      lines.push(['Date', 'Commandes', 'Revenus']);
      advancedStats.evolution_7j.forEach(d => lines.push([new Date(d.date).toLocaleDateString('fr-FR'), d.nombre_commandes, parseFloat(d.revenu || 0).toFixed(2)]));
      lines.push([]);
    }

    const csv = lines.map(r => r.map(c => esc(c)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `stats_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                  onClick={chargerStatsAvancees}
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

  if (!advancedStats) {
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
                  onClick={chargerStatsAvancees}
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
              onClick={chargerStatsAvancees}
            >
              Réessayer
            </Button>
          </div>
        </Container>
      </>
    );
  }

  const generales = advancedStats.generales || {};
  const revenusTotaux = parseFloat(generales.revenu_total || generales.revenus_totaux || 0) || 0;
  const panierMoyen = parseFloat(generales.panier_moyen || generales.panier_moyen || 0) || 0;
  const totalCommandes = parseInt(generales.total_commandes || generales.total_commandes || 0) || 0;

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
                  onClick={chargerStatsAvancees}
                >
                  Actualiser
                </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportCSV}
              >
                Export CSV
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h2 className="mb-0">Statistiques avancées</h2>
          </Col>
        </Row>

        {!advancedStats || advancedStats.error ? (
          <Card className="mb-4">
            <Card.Body>
              <p className="text-center text-muted">{advancedStats?.error || 'Aucune statistique disponible.'}</p>
              <div className="text-center">
                <Button variant="primary" onClick={chargerStatsAvancees}>Réessayer</Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <>
            <Row className="mb-4">
              <Col md={4} className="mb-3">
                <Card className="text-center border-primary">
                  <Card.Body>
                    <Card.Title className="text-muted small">⏱️ Temps moyen de service</Card.Title>
                    <h3 className="text-primary">{advancedStats.temps_moyen_service_minutes || 0} min</h3>
                    <small className="text-muted">7 derniers jours</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="text-center border-success">
                  <Card.Body>
                    <Card.Title className="text-muted small">🍽️ Produits vendus</Card.Title>
                    <h3 className="text-success">{advancedStats.produits_populaires ? advancedStats.produits_populaires.reduce((s,p)=>s+parseInt(p.total_vendu||0),0) : 0}</h3>
                    <small className="text-muted">30 derniers jours</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="text-center border-warning">
                  <Card.Body>
                    <Card.Title className="text-muted small">📈 Heure de pointe</Card.Title>
                    <h3 className="text-warning">{(() => { const max = advancedStats.heures_pointe.reduce((prev,cur)=>cur.nombre_commandes>prev.nombre_commandes?cur:prev,{heure:0,nombre_commandes:0}); return max.nombre_commandes>0?`${max.heure}h - ${max.heure+1}h`:'—'; })()}</h3>
                    <small className="text-muted">{advancedStats.heures_pointe ? advancedStats.heures_pointe.reduce((m,h)=>h.nombre_commandes>m?h.nombre_commandes:m,0):0} commandes</small>
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
                      <thead className="table-light"><tr><th>#</th><th>Produit</th><th className="text-center">Quantité</th><th className="text-center">Commandes</th><th className="text-end">Revenus</th></tr></thead>
                      <tbody>
                        {advancedStats.produits_populaires.slice(0,5).map((p,idx)=> (
                          <tr key={p.id}><td>{idx+1}</td><td><strong>{p.nom}</strong>{p.image && <span className="ms-2">🖼️</span>}</td><td className="text-center">{p.total_vendu}</td><td className="text-center">{p.nombre_commandes}</td><td className="text-end">{parseFloat(p.revenu_total||0).toFixed(2)}€</td></tr>
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
                  <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'120px',overflowX:'auto',paddingBottom:10}}>
                    {advancedStats.heures_pointe.map(h=>{
                      const maxCommandes = Math.max(...advancedStats.heures_pointe.map(x=>x.nombre_commandes),1);
                      const height = (h.nombre_commandes / maxCommandes) * 100;
                      return (<div key={h.heure} style={{flex:'0 0 30px',height:`${Math.max(height,2)}%`,backgroundColor:h.nombre_commandes>0?'#0d6efd':'#e9ecef',borderRadius:'3px 3px 0 0',position:'relative',minHeight:h.nombre_commandes>0?8:2}} title={`${h.heure}h: ${h.nombre_commandes} commandes`}>{h.nombre_commandes>0 && (<small style={{position:'absolute',top:'-18px',left:'50%',transform:'translateX(-50%)',fontSize:10,whiteSpace:'nowrap'}}>{h.nombre_commandes}</small>)}</div>);
                    })}
                  </div>
                  <div style={{display:'flex',gap:'4px',marginTop:5,overflowX:'auto'}}>{advancedStats.heures_pointe.map(h=>(<div key={h.heure} style={{flex:'0 0 30px',textAlign:'center',fontSize:10}}>{h.heure}h</div>))}</div>
                </Col>
              </Row>
            )}

            {advancedStats.evolution_7j && advancedStats.evolution_7j.length>0 && (
              <Row className="mt-4">
                <Col>
                  <h6 className="mb-3">📈 Évolution (7 derniers jours)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead><tr><th>Date</th><th>Commandes</th><th className="text-end">Revenus</th></tr></thead>
                      <tbody>{advancedStats.evolution_7j.map((d,idx)=>(<tr key={idx}><td>{new Date(d.date).toLocaleDateString('fr-FR')}</td><td>{d.nombre_commandes}</td><td className="text-end">{parseFloat(d.revenu||0).toFixed(2)}€</td></tr>))}</tbody>
                    </table>
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </>
  );
}

export default Stats;
