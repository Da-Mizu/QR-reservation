import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './QRGenerator.css';

function QRGenerator() {
  const [url, setUrl] = useState('');
  const [restaurantId, setRestaurantId] = useState('1');
  const [tableNumber, setTableNumber] = useState('');
  const qrContainerRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [finalUrl, setFinalUrl] = useState('');

  // Initialiser l'URL par défaut
  useEffect(() => {
    let defaultUrl;
    
    // Détecter si on est en développement ou production
    const port = window.location.port;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    
    if (port === '3000') {
      // Admin sur port 3000 -> client sur port 3001
      defaultUrl = `${protocol}//${host}:3001`;
    } else if (port === '3001') {
      // Frontend client en dev
      defaultUrl = `${protocol}//${host}:3001`;
    } else {
      // Mode production - via Apache/XAMPP
      defaultUrl = `${protocol}//${window.location.host}/QR-reservation/frontend-client/`;
    }
    
    setUrl(defaultUrl);
  }, []);

  // Générer le QR code
  const generateQR = () => {
    if (!url) {
      alert('Veuillez entrer une URL');
      return;
    }

    // Construire l'URL finale
    let builtUrl = url;
    const params = [];
    if (restaurantId) {
      params.push(`restaurant=${encodeURIComponent(restaurantId)}`);
    }
    if (tableNumber) {
      params.push(`table=${encodeURIComponent(tableNumber)}`);
    }
    if (params.length > 0) {
      builtUrl += `?${params.join('&')}`;
    }

    setFinalUrl(builtUrl);

    // Charger la librairie QRCode
    if (window.QRCode) {
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = '';
      }

      new window.QRCode(qrContainerRef.current, {
        text: builtUrl,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });

      setQrGenerated(true);
    } else {
      alert('Erreur: Librairie QRCode non chargée');
    }
  };

  // Télécharger le QR code
  const downloadQR = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    if (!canvas) {
      alert('Veuillez d\'abord générer un QR code');
      return;
    }

    const url = canvas.toDataURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-table-${tableNumber || restaurantId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateClick = () => {
    generateQR();
  };

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand className="fw-bold">Générateur de QR Code</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <Nav className="gap-2">
              <Link to="/" className="btn btn-outline-secondary btn-sm">
                ← Retour
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col lg={8} className="mx-auto">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">🎯 Générateur de QR Code pour les tables</h3>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>URL du menu (frontend client)</Form.Label>
                    <Form.Control
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="http://localhost:3001 (dev) ou http://localhost/QR-reservation/frontend-client/ (prod)"
                    />
                    <Form.Text className="text-muted">
                      En développement: http://localhost:3001 | En production: http://localhost/QR-reservation/frontend-client/
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>ID du restaurant</Form.Label>
                        <Form.Control
                          type="number"
                          value={restaurantId}
                          onChange={(e) => setRestaurantId(e.target.value)}
                          min="1"
                          placeholder="1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Numéro de table (optionnel)</Form.Label>
                        <Form.Control
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Table 1, Table 2, etc."
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mb-3">
                    <Button 
                      variant="primary" 
                      onClick={handleGenerateClick}
                      size="lg"
                    >
                      ✓ Générer le QR Code
                    </Button>
                    {qrGenerated && (
                      <Button 
                        variant="success" 
                        onClick={downloadQR}
                        size="lg"
                      >
                        ⬇ Télécharger
                      </Button>
                    )}
                  </div>
                </Form>

                {/* Affichage du QR code */}
                <div ref={qrContainerRef} className="qr-display"></div>

                {qrGenerated && finalUrl && (
                  <div className="mt-3 p-3 bg-light border rounded">
                    <small className="text-muted">
                      <strong>URL générée :</strong><br />
                      {finalUrl}
                    </small>
                  </div>
                )}

                {/* Instructions */}
                <Card className="mt-4 bg-light border-0">
                  <Card.Body>
                    <h5>💡 Instructions</h5>
                    <ul>
                      <li>Entrez l'URL de votre frontend client</li>
                      <li>Entrez l'ID du restaurant pour identifier à quel restaurant appartient cette table</li>
                      <li>Optionnellement, ajoutez un numéro de table pour personnaliser le QR code</li>
                      <li>Générez le QR code et téléchargez-le pour l'afficher sur les tables</li>
                      <li>Les clients pourront scanner ce QR code pour accéder au menu</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default QRGenerator;
