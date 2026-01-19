import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './KDSStyles.css';
import { useKDSData } from '../../hooks/useKDSData';
import KDSList from './KDSList';
import KDSFilters from './KDSFilters';
import KDSControls from './KDSControls';

function KDSView() {
  const { orders, loading, error, useSSE, updateOrderStatus, assignStation, refresh } = useKDSData();
  const [selectedStation, setSelectedStation] = useState('all');
  const [statusFilter, setStatusFilter] = useState(['en_attente', 'en_preparation', 'prete']);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Extract unique stations from orders
  const stations = useMemo(() => {
    const stationSet = new Set(['general']);
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.station) stationSet.add(item.station);
        });
      }
    });
    return Array.from(stationSet).sort();
  }, [orders]);

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
          <Navbar.Brand className="fw-bold text-white">🍳 KDS</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <Nav className="gap-2 align-items-center">
              <span className={`badge ${useSSE ? 'bg-success' : 'bg-warning'} text-dark`}>
                {useSSE ? '🔴 Temps réel' : '⏱️ Polling'}
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
              {stations.map(station => (
                <Button
                  key={station}
                  size="sm"
                  variant={selectedStation === station ? 'primary' : 'outline-secondary'}
                  onClick={() => setSelectedStation(station)}
                >
                  {station.charAt(0).toUpperCase() + station.slice(1)}
                </Button>
              ))}
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
