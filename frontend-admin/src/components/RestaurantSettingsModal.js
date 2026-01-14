import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

export default function RestaurantSettingsModal({ show, onHide }) {
  const { token, user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });

  useEffect(() => {
    if (!show) return;
    const load = async () => {
      if (!user || !user.restaurantId) return;
      setLoading(true);
      setError(null);
      const apiBase = (process.env.REACT_APP_API_BASE || 'http://localhost') + '/QR-reservation/backend-php/api';
      try {
        const res = await fetch(`${apiBase}/restaurants/${user.restaurantId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Erreur chargement restaurant', res.status, txt);
          setError(txt || `Erreur chargement restaurant (${res.status})`);
          return;
        }
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const txt = await res.text();
          console.error('Réponse non-JSON lors du chargement restaurant', res.status, txt);
          setError('Réponse serveur inattendue (HTML). Voir la console pour détails.');
          return;
        }
        const data = await res.json();
        setForm({ nom: data.nom || '', email: data.email || '', telephone: data.telephone || '', adresse: data.adresse || '' });
      } catch (e) {
        console.error('Erreur réseau', e);
        setError('Erreur réseau: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [show, token, user]);

  const handleSave = async () => {
    setError(null);
    if (!user || !user.restaurantId) {
      setError('Vous devez être connecté.');
      return;
    }
    setSaving(true);
    const apiBase = (process.env.REACT_APP_API_BASE || 'http://localhost') + '/QR-reservation/backend-php/api';
    const url = `${apiBase}/restaurants/${user.restaurantId}`;
    const opts = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(form)
    };
    try {
      let res = await fetch(url, opts);
      // If server or environment blocks PATCH, try POST fallback with override
      if (res.status === 405 || res.status === 404) {
        const formData = { ...form, _method: 'PATCH' };
        res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(formData) });
      }
      if (!res.ok) {
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.error || msg; } catch (e) {}
        setError(msg || `Erreur serveur (${res.status})`);
        setSaving(false);
        return;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const txt = await res.text();
        console.error('Réponse non-JSON lors de la sauvegarde restaurant', res.status, txt);
        setError('Réponse serveur inattendue (HTML). Voir la console pour détails.');
        setSaving(false);
        return;
      }
      const updated = await res.json();
      if (login && token) login(token, user.restaurantId, updated.email || user.email);
      onHide();
    } catch (e) {
      console.error('Erreur réseau', e);
      setError('Erreur réseau: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Paramètres du restaurant</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div style={{ textAlign: 'center' }}><Spinner animation="border" /></div>
        ) : (
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nom</Form.Label>
              <Form.Control value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Adresse</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annuler</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </Modal.Footer>
    </Modal>
  );
}
