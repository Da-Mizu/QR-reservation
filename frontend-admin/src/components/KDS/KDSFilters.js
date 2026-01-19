import React from 'react';
import { Form, ButtonGroup, Button } from 'react-bootstrap';

function KDSFilters({ statusFilter, setStatusFilter }) {
  const statusOptions = [
    { value: 'en_attente', label: '⏰ En attente' },
    { value: 'en_preparation', label: '👨‍🍳 En préparation' },
    { value: 'prete', label: '✅ Prête' },
  ];

  const toggleStatus = (status) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  return (
    <div className="mb-4 p-3 bg-light rounded">
      <label className="fw-bold mb-2 d-block">Filtrer par statut :</label>
      <ButtonGroup>
        {statusOptions.map(opt => (
          <Button
            key={opt.value}
            variant={statusFilter.includes(opt.value) ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => toggleStatus(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}

export default KDSFilters;
