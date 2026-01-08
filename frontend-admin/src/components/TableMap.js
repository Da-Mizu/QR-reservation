import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Navbar, Nav, Form, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TableMap.css';
import { AuthContext } from '../context/AuthContext';

// Normalise l'URL API
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

function TableMap() {
  const [commandes, setCommandes] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const containerRef = useRef(null);
  const { token } = useContext(AuthContext);

  // Charger les commandes
  useEffect(() => {
    chargerCommandes();
    chargerTables();
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

  const chargerTables = () => {
    const savedTables = localStorage.getItem('restaurant_tables');
    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      // Tables par défaut
      setTables([
        { id: 1, number: '1', x: 100, y: 100 },
        { id: 2, number: '2', x: 300, y: 100 },
        { id: 3, number: '3', x: 500, y: 100 },
        { id: 4, number: '4', x: 100, y: 300 },
        { id: 5, number: '5', x: 300, y: 300 },
        { id: 6, number: '6', x: 500, y: 300 },
      ]);
    }
  };

  const saveTables = (newTables) => {
    localStorage.setItem('restaurant_tables', JSON.stringify(newTables));
    setTables(newTables);
  };

  const ajouterTable = () => {
    if (!newTableNumber.trim()) {
      alert('Veuillez entrer un numéro de table');
      return;
    }

    const newTable = {
      id: Date.now(),
      number: newTableNumber,
      x: 200 + Math.random() * 300,
      y: 200 + Math.random() * 300,
    };

    const updatedTables = [...tables, newTable];
    saveTables(updatedTables);
    setNewTableNumber('');
    setShowAddTable(false);
  };

  const supprimerTable = (tableId) => {
    if (isLocked) {
      alert('Impossible de supprimer une table quand le plan est verrouillé');
      return;
    }
    const updatedTables = tables.filter(t => t.id !== tableId);
    saveTables(updatedTables);
  };

  const incrementerStatut = async (tableNumber) => {
    const commande = commandes.find(c => String(c.table_number) === String(tableNumber));
    
    if (!commande) {
      alert('Aucune commande associée à cette table');
      return;
    }

    console.log('Commande trouvée:', commande);
    console.log('Statut de la commande:', commande.statut);

    // Définir la progression des statuts
    const progressionStatuts = {
      'en_attente': 'en_preparation',
      'en_preparation': 'prete',
      'prete': 'servie',
      'servie': 'en_attente_de_paiement',
      'en_attente_de_paiement': 'terminee',
      'terminee': null, // Ne rien faire
      'annulee': null // Ne rien faire
    };

    const nouveauStatut = progressionStatuts[commande.statut];

    if (!nouveauStatut) {
      alert(`Impossible de changer l'état de la commande (état actuel: ${getStatusLabel(commande.statut)})`);
      return;
    }

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      console.log('Appel endpoint statut pour commande:', commande.id, 'nouveau statut:', nouveauStatut);
      const response = await axios.patch(`${API_URL}/commandes/${commande.id}/statut`, 
        { statut: nouveauStatut }, 
        config
      );
      console.log('Réponse:', response);
      chargerCommandes();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };


  const deplacerTable = (tableId, newX, newY) => {
    if (isLocked) return; // Empêcher le déplacement si verrouillé
    const updatedTables = tables.map(t =>
      t.id === tableId ? { ...t, x: newX, y: newY } : t
    );
    saveTables(updatedTables);
  };

  const getTableStatus = (tableNumber) => {
    const commande = commandes.find(c => 
      String(c.table_number) === String(tableNumber) || 
      String(c.numero_table) === String(tableNumber) ||
      String(c.table) === String(tableNumber)
    );
    return commande ? commande.statut : null;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'en_attente': '#FFC107',
      'en_preparation': '#17A2B8',
      'prete': '#28A745',
      'servie': '#20C997',
      'en_attente_de_paiement': '#007BFF',
      'terminee': '#6C757D',
      'annulee': '#DC3545'
    };
    return colors[statut] || '#E9ECEF';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'en_preparation': 'Préparation',
      'prete': 'Prête',      'servie': 'Servie',
      'payee': 'Payée',      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return labels[statut] || 'Libre';
  };

  // Gestion du pan et zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };

  const handleMouseDown = (e) => {
    if (e.button === 2 || e.ctrlKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTableMouseDown = (e, tableId) => {
    if (isLocked) return; // Ne pas déplacer si verrouillé
    
    if (e.button === 0 && e.detail === 1) {
      // Single click only, ignore double click
      const rect = containerRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - panX) / scale;
      const startY = (e.clientY - rect.top - panY) / scale;

      const handleDrag = (moveEvent) => {
        const currentX = (moveEvent.clientX - rect.left - panX) / scale;
        const currentY = (moveEvent.clientY - rect.top - panY) / scale;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        const table = tables.find(t => t.id === tableId);
        if (table) {
          deplacerTable(tableId, table.x + deltaX, table.y + deltaY);
        }
      };

      const handleEnd = () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleEnd);
      };

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleEnd);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
          <Container fluid>
            <Navbar.Brand className="fw-bold">Vue Plan du Restaurant</Navbar.Brand>
          </Container>
        </Navbar>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          Chargement...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand className="fw-bold">Vue Plan du Restaurant</Navbar.Brand>
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
              <Button 
                variant={isLocked ? 'danger' : 'warning'}
                size="sm"
                onClick={() => setIsLocked(!isLocked)}
                title={isLocked ? 'Plan verrouillé' : 'Plan déverrouillé'}
              >
                {isLocked ? '🔒 Verrouillé' : '🔓 Déverrouillé'}
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => chargerCommandes()}
              >
                🔄 Actualiser
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowAddTable(true)}
                disabled={isLocked}
              >
                ➕ Ajouter Table
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div 
        className="table-map-container"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="table-map-canvas"
          style={{
            backgroundImage: 'url(/background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
            transformOrigin: '0 0',
          }}
        >
          {tables.map(table => {
            const status = getTableStatus(table.number);
            const backgroundColor = getStatusColor(status);

            return (
              <div
                key={table.id}
                className={`table-item ${isLocked ? 'locked' : ''}`}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  backgroundColor: backgroundColor,
                  cursor: isLocked ? 'default' : 'grab',
                }}
                onMouseDown={(e) => {
                  if (e.button === 0 && e.detail === 2) {
                    // Double click - incrementer statut
                    e.stopPropagation();
                    incrementerStatut(table.number);
                  } else if (e.button === 0 && e.detail === 1) {
                    // Single click - drag table
                    handleTableMouseDown(e, table.id);
                  }
                }}
                title={`Table ${table.number} - ${getStatusLabel(status)} (Double-clic pour passer à l'étape suivante)`}
              >
                <div className="table-number">{table.number}</div>
                {status && <div className="table-status">{getStatusLabel(status).charAt(0)}</div>}
                <div 
                  className="table-delete"
                  onClick={() => supprimerTable(table.id)}
                  title="Supprimer cette table"
                >
                  ✕
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="table-legend">
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#FFC107' }}></div>
          En attente
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#17A2B8' }}></div>
          Préparation
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#28A745' }}></div>
          Prête
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#20C997' }}></div>
          Servie
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#007BFF' }}></div>
          En attente de paiement
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#6C757D' }}></div>
          Terminée
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#DC3545' }}></div>
          Annulée
        </div>
      </div>

      {/* Modal pour ajouter une table */}
      <Modal show={showAddTable} onHide={() => setShowAddTable(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une table</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Numéro de table</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Table 7, T-7, etc."
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') ajouterTable();
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTable(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={ajouterTable}>
            Ajouter
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TableMap;
