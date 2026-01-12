import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, ListGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;

function OrderModal({ show, tableNumber, onClose, onOrderCreated }) {
  const { token, user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientInfo, setClientInfo] = useState({ nom: '', email: '', telephone: '' });
  const [formTableNumber, setFormTableNumber] = useState(tableNumber || '');

  useEffect(() => {
    if (show) setFormTableNumber(tableNumber || '');
  }, [show, tableNumber]);

  useEffect(() => {
    if (!show) return;
    fetchProducts();
  }, [show]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/produits`, config);
      setProducts(res.data || []);
    } catch (e) {
      console.error('Erreur fetch produits', e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addToCart = (prod) => {
    setCart(prev => {
      const found = prev.find(p => p.id === prod.id);
      if (found) {
        return prev.map(p => p.id === prod.id ? { ...p, quantite: p.quantite + 1 } : p);
      }
      return [...prev, { id: prod.id, nom: prod.nom, prix: Number(prod.prix || 0), quantite: 1 }];
    });
  };

  const changeQty = (produitId, delta) => {
    setCart(prev => prev
      .map(i => i.id === produitId ? { ...i, quantite: Math.max(0, i.quantite + delta) } : i)
      .filter(i => i.quantite > 0)
    );
  };

  const getTotal = () => cart.reduce((s, it) => s + (it.prix * it.quantite), 0);

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Le panier est vide');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nom: clientInfo.nom || null,
        email: clientInfo.email || null,
        telephone: clientInfo.telephone || null,
        table_number: formTableNumber || null,
        restaurant_id: user && user.restaurantId ? parseInt(user.restaurantId) : undefined,
        items: cart.map(i => ({ id: i.id, nom: i.nom, prix: i.prix, quantite: i.quantite })),
        total: getTotal()
      };

      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.post(`${API_URL}/commandes`, payload, config);
      // success
      if (onOrderCreated) onOrderCreated(res.data);
      setCart([]);
      setClientInfo({ nom: '', email: '', telephone: '' });
      onClose();
    } catch (e) {
      console.error('Erreur lors de la création de commande', e);
      alert('Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Prendre commande — Table {formTableNumber || '(non renseignée)'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex gap-3" style={{ minHeight: 300 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <h6>Produits</h6>
            {loadingProducts ? (
              <div className="text-center"><Spinner animation="border" size="sm" /></div>
            ) : (
              <ListGroup>
                {products.map(p => (
                  <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{p.nom}</div>
                      <div className="text-muted">{Number(p.prix || 0).toFixed(2)}€</div>
                    </div>
                    <div>
                      <Button size="sm" variant="outline-primary" onClick={() => addToCart(p)}>Ajouter</Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          <div style={{ width: 320 }}>
            <h6>Panier</h6>
            <ListGroup>
              {cart.length === 0 && <ListGroup.Item>Panier vide</ListGroup.Item>}
              {cart.map(item => (
                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{item.nom}</div>
                    <div className="text-muted">{item.prix.toFixed(2)}€ × {item.quantite}</div>
                  </div>
                  <div className="d-flex gap-1 align-items-center">
                    <Button size="sm" variant="outline-secondary" onClick={() => changeQty(item.id, -1)}>-</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => changeQty(item.id, 1)}>+</Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <div className="mt-3">
              <h6>Total: {getTotal().toFixed(2)}€</h6>
            </div>

            <Form className="mt-2">
              <Form.Group className="mb-2">
                <Form.Label>Numéro de table</Form.Label>
                <Form.Control value={formTableNumber} onChange={(e) => setFormTableNumber(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Nom (optionnel)</Form.Label>
                <Form.Control value={clientInfo.nom} onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Email (optionnel)</Form.Label>
                <Form.Control value={clientInfo.email} onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Téléphone (optionnel)</Form.Label>
                <Form.Control value={clientInfo.telephone} onChange={(e) => setClientInfo({ ...clientInfo, telephone: e.target.value })} />
              </Form.Group>
            </Form>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>Annuler</Button>
        <Button variant="success" onClick={submitOrder} disabled={submitting || cart.length === 0}>
          {submitting ? 'Envoi...' : 'Prendre la commande'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OrderModal;
