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
      async (result) => {
        if (scannedRef.current) return; // Double-check pour éviter les multiples appels
        scannedRef.current = true;

        setScanResult(result);
        console.log('QR Code scanné:', result);

        // Arrêter immédiatement le scanner (clear() retourne une Promise)
        try {
          await scanner.clear().catch((e) => {
            // Ignorer les erreurs liées au DOM (removeChild race conditions)
            console.warn('scanner.clear() rejected, ignored:', e && e.message ? e.message : e);
          });
        } catch (e) {
          console.warn('Erreur lors de l\'arrêt du scanner (catch):', e);
        }
        
        // Extraire l'URL du résultat et rediriger
        try {
          const url = new URL(result);
          const path = url.pathname === '/' ? '/menu' : url.pathname;
          
          // Récupérer tous les paramètres (restaurant, table, etc.)
          const restaurant = url.searchParams.get('restaurant');
          const table = url.searchParams.get('table');
          
          // Construire les paramètres pour la navigation
          const params = new URLSearchParams();
          if (restaurant) params.append('restaurant', restaurant);
          if (table) params.append('table', table);
          
          const searchString = params.toString() ? `?${params.toString()}` : '';
          console.log('Navigation vers:', path + searchString, { restaurant, table });
          navigate(path + searchString);
        } catch (e) {
          // Si l'URL n'est pas valide, essayer de parser les paramètres directement
          const restaurantMatch = result.match(/restaurant=([^&]*)/);
          const tableMatch = result.match(/table=([^&]*)/);
          
          const params = new URLSearchParams();
          if (restaurantMatch) params.append('restaurant', restaurantMatch[1]);
          if (tableMatch) params.append('table', tableMatch[1]);
          
          const searchString = params.toString() ? `?${params.toString()}` : '';
          navigate(`/menu${searchString}`);
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
        // clear() peut rejeter si le DOM a déjà changé, on ignore
        scannerRef.current.clear().catch((e) => {
          console.warn('Erreur lors du nettoyage du scanner (ignored):', e && e.message ? e.message : e);
        });
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
