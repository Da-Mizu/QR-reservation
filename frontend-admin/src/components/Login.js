import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import './Login.css';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [motdepasse, setMotdepasse] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Normalise l'URL API pour éviter les doublons du style index.php/api/api
  const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
  const API_BASE = RAW_API_URL
    .replace(/\/$/, '')            // retire le slash final
    .replace(/\/index\.php\/?$/, '') // retire index.php
    .replace(/\/api\/?$/, '');       // retire api s'il est déjà présent
  const API_URL = `${API_BASE}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? 'auth/login' : 'auth/register';
      const payload = isLogin 
        ? { email, motdepasse }
        : { nom, email, motdepasse };
      
      const url = `${API_URL}/${endpoint}`;
      console.log('🔍 Login URL:', url);
      console.log('🔍 API_URL:', API_URL);
      console.log('🔍 Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'authentification');
        return;
      }

      // Sauvegarder le token et naviguer
      login(data.token, data.restaurant_id, data.email);
      navigate('/');
    } catch (err) {
      setError('Erreur de connexion au serveur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="shadow-sm login-card">
            <Card.Body className="p-5">
              <h1 className="text-center mb-4">{isLogin ? 'Connexion' : 'Inscription'}</h1>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                {!isLogin && (
                  <Form.Group className="mb-3">
                    <Form.Label>Nom du restaurant</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez le nom du restaurant"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={motdepasse}
                    onChange={(e) => setMotdepasse(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading && <Spinner animation="border" size="sm" className="me-2" />}
                  {isLogin ? 'Se connecter' : 'S\'inscrire'}
                </Button>
              </Form>

              <div className="text-center">
                <small>
                  {isLogin ? 'Pas de compte ?' : 'Vous avez un compte ?'}{' '}
                  <button
                    type="button"
                    className="btn-link-text"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                  >
                    {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
                  </button>
                </small>
              </div>

              <hr className="my-4" />

              <div className="alert alert-info" role="alert">
                <small>
                  <strong>Mode démo :</strong> Utilisez <code>admin@demo.local</code> et <code>demo123</code>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
