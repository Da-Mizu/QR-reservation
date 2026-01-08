import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './Scanner.css';

function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (scannedRef.current) return; // Évite les scans multiples
    
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: 250,
          height: 250
        },
        fps: 5,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (result) => {
        if (scannedRef.current) return; // Double-check pour éviter les multiples appels
        scannedRef.current = true;
        
        setScanResult(result);
        console.log('QR Code scanné:', result);
        
        // Arrêter immédiatement le scanner
        try {
          scanner.clear();
        } catch (e) {
          console.error('Erreur lors de l\'arrêt du scanner:', e);
        }
        
        // Extraire l'URL du résultat et rediriger
        try {
          const url = new URL(result);
          const path = url.pathname === '/' ? '/menu' : url.pathname;
          const searchParams = url.search;
          navigate(path + searchParams);
        } catch (e) {
          if (result.includes('table=')) {
            const match = result.match(/table=([^&]*)/);
            if (match) {
              navigate(`/menu?table=${match[1]}`);
            } else {
              navigate('/menu');
            }
          } else {
            navigate('/menu');
          }
        }
      },
      (err) => {
        // Ignorer les erreurs de scan continu
        if (err && !err.includes('NotFoundException')) {
          // Ne pas spammer setError à chaque tentative
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.error('Erreur lors du nettoyage du scanner:', e);
        }
      }
    };
  }, [navigate]);

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <h1>Scanner le QR Code</h1>
        <p className="scanner-instructions">
          Scannez le QR code sur votre table pour accéder au menu
        </p>
        <div id="reader" className="qr-reader"></div>
        {error && <p className="error-message">{error}</p>}
        {scanResult && (
          <div className="scan-success">
            <p>QR Code scanné avec succès !</p>
            <p>Redirection vers le menu...</p>
          </div>
        )}
        <button 
          className="btn btn-secondary skip-btn"
          onClick={() => navigate('/menu')}
        >
          Passer le scan et accéder au menu
        </button>
      </div>
    </div>
  );
}

export default Scanner;
