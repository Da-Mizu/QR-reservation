import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Stats from './components/Stats';
import Login from './components/Login';
import QRGenerator from './components/QRGenerator';
import TableMap from './components/TableMap';
import MenuManager from './components/MenuManager';
import { AuthContext } from './context/AuthContext';
import './App.css';

function Navigation() {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <nav className="admin-nav">
      <div className="nav-container">
        <h1 className="nav-title">QR Reservation - Admin</h1>
        <button className="nav-burger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            📋 Commandes
          </Link>
          <Link 
            to="/stats" 
            className={location.pathname === '/stats' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            📊 Statistiques
          </Link>
          <Link 
            to="/qr-generator" 
            className={location.pathname === '/qr-generator' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            📱 Générer QR
          </Link>
          <Link 
            to="/table-map" 
            className={location.pathname === '/table-map' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            🗺️ Plan du restaurant
          </Link>
          <Link 
            to="/menu" 
            className={location.pathname === '/menu' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            🍽️ Gestion Menu
          </Link>
          
          <div className="nav-user">
            <span className="user-email">{user?.email}</span>
            <button className="btn-logout" onClick={() => {
              logout();
              setMenuOpen(false);
            }}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }
  
  return (
    <Router>
      <div className="App">
        {user && <Navigation />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stats" 
            element={
              <ProtectedRoute>
                <Stats />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qr-generator" 
            element={
              <ProtectedRoute>
                <QRGenerator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/table-map" 
            element={
              <ProtectedRoute>
                <TableMap />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/menu" 
            element={
              <ProtectedRoute>
                <MenuManager />
              </ProtectedRoute>
            } 
          />
// Reports route removed — export CSV now in Stats
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
