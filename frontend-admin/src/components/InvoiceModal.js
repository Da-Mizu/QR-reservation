import React, { useRef, useState, useEffect, useContext } from 'react';
import { Modal, Button, Table, Form, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import html2pdf from 'html2pdf.js';
import './InvoiceModal.css';

function InvoiceModal({ show, commande, onClose }) {
  const invoiceRef = useRef();
  const { token } = useContext(AuthContext);
  const [restaurantInfo, setRestaurantInfo] = useState(commande?.restaurant || null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });
  const [loadingRest, setLoadingRest] = useState(false);
  const [savingRest, setSavingRest] = useState(false);

  useEffect(() => {
    setRestaurantInfo(commande?.restaurant || null);
    if (commande?.restaurant) {
      setForm({
        nom: commande.restaurant.nom || '',
        email: commande.restaurant.email || '',
        telephone: commande.restaurant.telephone || '',
        adresse: commande.restaurant.adresse || ''
      });
    }
  }, [commande]);

  const getInvoiceNumber = () => {
    return commande?.id?.substring(0, 8) || 'N/A';
  };

  const generatePDF = () => {
    if (!commande || !commande.id) {
      console.error('Invalid commande data');
      return;
    }
    const element = invoiceRef.current;
    if (!element) {
      console.error('Invoice element not found');
      return;
    }
    const opt = {
      margin: 10,
      filename: `facture-${getInvoiceNumber()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
        putOnlyUsedFonts: true
      }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!commande) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Facture - Commande #{getInvoiceNumber()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={invoiceRef} className="invoice-container" style={{ fontFamily: 'Arial, sans-serif' }}>
          <meta charSet="UTF-8" />
          <div className="invoice-header">
            <div className="restaurant-info">
              <h2>{(commande.restaurant && commande.restaurant.nom) || 'Restaurant'}</h2>
              {commande.restaurant && commande.restaurant.adresse ? (
                <p>{commande.restaurant.adresse}</p>
              ) : (
                <p>Adresse non renseignée</p>
              )}
              {restaurantInfo && restaurantInfo.telephone ? (
                <p>Tél: {restaurantInfo.telephone}</p>
              ) : null}
              {restaurantInfo && restaurantInfo.email ? (
                <p>Email: {restaurantInfo.email}</p>
              ) : null}
            </div>
            <div className="invoice-meta">
              <h3>FACTURE</h3>
              <p><strong>N° Facture:</strong> {getInvoiceNumber().toUpperCase()}</p>
              <p><strong>Date:</strong> {formatDate(commande.created_at)}</p>
              {commande.table_number && (
                <p><strong>Table:</strong> {commande.table_number}</p>
              )}
            </div>
          </div>

          <div className="client-info">
            <h4>Informations Client</h4>
            <p><strong>Nom:</strong> {commande.nom || 'Client'}</p>
            {commande.email && <p><strong>Email:</strong> {commande.email}</p>}
            {commande.telephone && <p><strong>Téléphone:</strong> {commande.telephone}</p>}
          </div>

          <div className="invoice-items">
            <h4>Détails de la commande</h4>
            <Table bordered className="items-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th className="text-center">Quantité</th>
                  <th className="text-end">Prix unitaire</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {commande.items && commande.items.map((item, index) => (
                  <tr key={item.id || `item-${item.nom}-${index}`}>
                    <td>{item.nom}</td>
                    <td className="text-center">{item.quantite}</td>
                    <td className="text-end">{(item.prix || 0).toFixed(2)}€</td>
                    <td className="text-end">{((item.prix || 0) * (item.quantite || 0)).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="3" className="text-end"><strong>Total TTC:</strong></td>
                  <td className="text-end"><strong>{(commande.total || 0).toFixed(2)}€</strong></td>
                </tr>
              </tfoot>
            </Table>
          </div>

          <div className="invoice-footer">
            <p className="text-center">Merci de votre visite !</p>
            <p className="text-center small">TVA non applicable, article 293 B du CGI</p>
          </div>
        </div>
      </Modal.Body>
        {/* Edit restaurant modal */}
        <Modal show={showEdit} onHide={() => setShowEdit(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Modifier les informations du restaurant</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Nom du restaurant</Form.Label>
                <Form.Control value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Adresse</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.adresse} onChange={(e) => setForm({...form, adresse: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Annuler</Button>
            <Button variant="primary" onClick={async () => {
              if (!commande?.restaurant?.id && !commande?.restaurant_id) return;
              const rid = commande?.restaurant?.id || commande.restaurant_id;
              const apiBase = (process.env.REACT_APP_API_BASE || 'http://localhost') + '/QR-reservation/backend-php/api';
              setSavingRest(true);
              try {
                const res = await fetch(`${apiBase}/restaurants/${rid}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(form)
                });
                if (!res.ok) {
                  console.error('Erreur mise à jour restaurant', await res.text());
                  setSavingRest(false);
                  return;
                }
                const updated = await res.json();
                setRestaurantInfo(updated);
                setShowEdit(false);
              } catch (e) {
                console.error('Erreur réseau', e);
              } finally {
                setSavingRest(false);
              }
            }}>
              {savingRest ? <><Spinner animation="border" size="sm" />&nbsp;Enregistrement...</> : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Modal>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
        <Button variant="primary" onClick={generatePDF}>
          📥 Télécharger PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default InvoiceModal;
