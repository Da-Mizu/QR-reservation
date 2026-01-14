import React, { useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import html2pdf from 'html2pdf.js';
import './InvoiceModal.css';

function InvoiceModal({ show, commande, onClose }) {
  const invoiceRef = useRef();

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
      filename: `facture-${commande.id.substring(0, 8)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
        <Modal.Title>Facture - Commande #{commande?.id?.substring(0, 8) || 'N/A'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={invoiceRef} className="invoice-container">
          <div className="invoice-header">
            <div className="restaurant-info">
              <h2>Restaurant QR Réservation</h2>
              <p>123 Rue de la Gastronomie</p>
              <p>75001 Paris, France</p>
              <p>Tél: +33 1 23 45 67 89</p>
              <p>Email: contact@qr-reservation.fr</p>
            </div>
            <div className="invoice-meta">
              <h3>FACTURE</h3>
              <p><strong>N° Facture:</strong> {commande?.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
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
