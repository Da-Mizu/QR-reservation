import React, { useMemo } from 'react';
import { Card, Badge, Button, ButtonGroup, ListGroup } from 'react-bootstrap';
import './KDSStyles.css';

function KDSOrderCard({ order, selectedStation, onStatusChange, onAssignStation }) {
  // Get time elapsed since order creation
  const elapsedMinutes = useMemo(() => {
    if (!order.created_at) return 0;
    const createdTime = new Date(order.created_at);
    const now = new Date();
    return Math.floor((now - createdTime) / 60000);
  }, [order.created_at]);

  // Color by status
  const statusColorMap = {
    en_attente: 'danger',
    en_preparation: 'warning',
    prete: 'success',
  };

  const statusLabelMap = {
    en_attente: 'En attente',
    en_preparation: 'En préparation',
    prete: 'Prête',
    servie: 'Servie',
    annulee: 'Annulée',
  };

  // Filter items for selected station (if not "all")
  const relevantItems = selectedStation === 'all'
    ? order.items || []
    : (order.items || []).filter(item => item.station === selectedStation);

  return (
    <Card className={`kds-card kds-card-${order.statut}`}>
      <Card.Header className={`bg-${statusColorMap[order.statut] || 'secondary'} text-white`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              Commande #{order.id.substring(0, 8)}
            </h5>
            {order.table_number && (
              <small>Table {order.table_number}</small>
            )}
          </div>
          <div className="text-end">
            <Badge bg="light" text="dark">{elapsedMinutes}m</Badge>
            {elapsedMinutes > 20 && (
              <Badge bg="danger" className="ms-2">RETARD</Badge>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body className="py-2">
        {/* Relevant items for this station */}
        {relevantItems.length > 0 && (
          <ListGroup className="mb-2" variant="flush">
            {relevantItems.map((item, idx) => (
              <ListGroup.Item key={idx} className="px-0 py-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{item.quantite}x</strong> {item.nom}
                  </div>
                  <small className="text-muted">{item.prix}€</small>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {/* Order notes */}
        {order.notes && (
          <div className="alert alert-light mb-2 py-1 px-2 small">
            📝 {order.notes}
          </div>
        )}

        {/* Status and Action buttons */}
        <div className="d-grid gap-2 mt-3">
          <ButtonGroup vertical size="sm">
            {order.statut === 'en_attente' && (
              <Button
                variant="outline-warning"
                onClick={() => onStatusChange(order.id, 'en_preparation')}
              >
                ▶️ Commencer
              </Button>
            )}
            {order.statut === 'en_preparation' && (
              <>
                <Button
                  variant="outline-success"
                  onClick={() => onStatusChange(order.id, 'prete')}
                >
                  ✅ Prête
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onStatusChange(order.id, 'en_attente')}
                >
                  ↩️ Retour
                </Button>
              </>
            )}
            {order.statut === 'prete' && (
              <Button
                variant="outline-primary"
                onClick={() => onStatusChange(order.id, 'servie')}
              >
                🍽️ Servie
              </Button>
            )}
          </ButtonGroup>
        </div>
      </Card.Body>

      <Card.Footer className="bg-light text-muted py-2 px-2 small">
        <div className="d-flex justify-content-between">
          <span>{statusLabelMap[order.statut]}</span>
          <span>{order.total}€</span>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default KDSOrderCard;
