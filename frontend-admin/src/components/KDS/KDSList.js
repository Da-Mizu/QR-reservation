import React from 'react';
import { Row, Col } from 'react-bootstrap';
import KDSOrderCard from './KDSOrderCard';

function KDSList({ orders, selectedStation, onStatusChange, onAssignStation }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="alert alert-info text-center py-5">
        Aucune commande à afficher
      </div>
    );
  }

  return (
    <Row className="g-3">
      {orders.map(order => (
        <Col key={order.id} lg={6} xl={4} className="mb-3">
          <KDSOrderCard
            order={order}
            selectedStation={selectedStation}
            onStatusChange={onStatusChange}
            onAssignStation={onAssignStation}
          />
        </Col>
      ))}
    </Row>
  );
}

export default KDSList;
