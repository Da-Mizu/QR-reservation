import React from 'react';
import { Button, Form } from 'react-bootstrap';

function KDSControls({ autoRefresh, setAutoRefresh, soundEnabled, setSoundEnabled, onRefresh }) {
  return (
    <>
      <Button
        variant="outline-light"
        size="sm"
        onClick={onRefresh}
        title="Actualiser manuellement"
      >
        🔄 Actualiser
      </Button>

      <Form.Check
        type="switch"
        id="autoRefreshSwitch"
        label="Auto"
        checked={autoRefresh}
        onChange={(e) => setAutoRefresh(e.target.checked)}
        className="d-inline-block ms-2"
      />

      <Form.Check
        type="switch"
        id="soundSwitch"
        label="🔊"
        checked={soundEnabled}
        onChange={(e) => setSoundEnabled(e.target.checked)}
        className="d-inline-block ms-2"
        title="Alertes sonores"
      />
    </>
  );
}

export default KDSControls;
