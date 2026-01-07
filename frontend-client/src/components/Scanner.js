import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './Scanner.css';

function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

    scanner.render(
      (result) => {
        setScanResult(result);
        scanner.clear();
        console.log('QR Code scanné:', result);
        
        // Extraire l'URL du résultat
        try {
          const url = new URL(result);
          // Si l'URL contient /menu, rediriger vers cette URL complète (avec les paramètres)
          if (url.pathname.includes('/menu') || url.pathname === '/') {
            // Extraire le chemin et les paramètres de recherche
            const path = url.pathname === '/' ? '/menu' : url.pathname;
            const searchParams = url.search; // Inclut le ? et les paramètres
            navigate(path + searchParams);
          } else {
            // Si c'est juste une URL vers /menu, rediriger
            navigate('/menu' + url.search);
          }
        } catch (e) {
          // Si ce n'est pas une URL valide, essayer de parser manuellement
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
        // Ne pas afficher les erreurs de scan continu
        if (err && !err.includes('NotFoundException')) {
          setError(err);
        }
      }
    );

    return () => {
      scanner.clear();
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
