import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './KDSStyles.css';
import { useKDSData } from '../../hooks/useKDSData';
import KDSList from './KDSList';
import KDSFilters from './KDSFilters';
import KDSControls from './KDSControls';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL.replace(/\/$/, '');
const API_URL = `${API_BASE}/api`;

function KDSView() {
  const { orders, loading, error, useSSE, updateOrderStatus, assignStation, refresh } = useKDSData();
  const [selectedStation, setSelectedStation] = useState('all');
  const [statusFilter, setStatusFilter] = useState(['en_attente', 'en_preparation', 'prete']);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dbStations, setDbStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  // Load stations from database on mount
  useEffect(() => {
    const chargerStations = async () => {
      try {
        setLoadingStations(true);
        const response = await axios.get(`${API_URL}/stations`);
        const stationsData = Array.isArray(response.data) ? response.data : [];
        setDbStations(stationsData);
      } catch (err) {
        console.error('Erreur chargement stations:', err);
        setDbStations([]);
      } finally {
        setLoadingStations(false);
      }
    };
    chargerStations();
  }, []);

  // Extract unique stations from orders + database stations
  const stations = useMemo(() => {
    const stationSet = new Set(['general']);
    
    // Add stations from database
    dbStations.forEach(station => {
      stationSet.add(station.nom);
    });
    
    // Add stations from items in orders
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.station) stationSet.add(item.station);
        });
      }
    });
    return Array.from(stationSet).sort((a, b) => a.localeCompare(b));
  }, [orders, dbStations]);

  // Utility: get readable text color (#000 or #fff) based on background hex
  const getContrastColor = (hex) => {
    if (!hex) return '#000000';
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    // Perceived luminance
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
  };

  // Filter and group orders by station
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(o => statusFilter.includes(o.statut));

    if (selectedStation !== 'all') {
      // Show orders that have items for this station
      filtered = filtered.filter(o => {
        if (!o.items) return false;
        return o.items.some(item => item.station === selectedStation);
      });
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, selectedStation, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    if (soundEnabled && newStatus === 'prete') {
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    // Simple beep using Web Audio API or fallback
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  return (
    <>
      <Navbar bg="dark" expand="lg" sticky="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand className="fw-bold text-white">KDS</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <Nav className="gap-2 align-items-center">
              <span className={`badge ${useSSE ? 'bg-success' : 'bg-warning'} text-dark`}>
                {useSSE ? 'Temps réel' : 'Polling'}
              </span>
              <KDSControls
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                onRefresh={refresh}
              />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-3">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button className="btn btn-sm btn-outline-danger ms-2" onClick={refresh}>
              Réessayer
            </button>
          </div>
        )}

        {/* Station Selector */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <span className="fw-bold">Poste :</span>
              <Button
                size="sm"
                variant={selectedStation === 'all' ? 'primary' : 'outline-secondary'}
                onClick={() => setSelectedStation('all')}
              >
                Tous
              </Button>
              {stations.map(station => {
                const stationData = dbStations.find(s => s.nom === station);
                const couleur = stationData?.couleur || '#6c757d';
                const isSelected = selectedStation === station;
                const textColor = getContrastColor(couleur);
                return (
                  <Button
                    key={station}
                    size="sm"
                    className="station-btn"
                    style={{
                      backgroundColor: couleur,
                      borderColor: couleur,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      color: textColor
                    }}
                    onClick={() => setSelectedStation(station)}
                  >
                    {station.length > 20 ? station.substring(0, 17) + '...' : station}
                  </Button>
                );
              })}
            </div>
          </Col>
        </Row>

        {/* Filter Controls */}
        <KDSFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : (
          <KDSList
            orders={filteredOrders}
            selectedStation={selectedStation}
            onStatusChange={handleStatusChange}
            onAssignStation={assignStation}
          />
        )}
      </Container>
    </>
  );
}

export default KDSView;
