import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dashboard from './components/Dashboard';
import Stats from './components/Stats';
import Login from './components/Login';
import QRGenerator from './components/QRGenerator';
import TableMap from './components/TableMap';
import MenuManager from './components/MenuManager';
import KDSView from './components/KDS/KDSView';
import { AuthContext } from './context/AuthContext';
import './App.css';

import RestaurantSettingsModal from './components/RestaurantSettingsModal';
// StatsModal removed: use full `/stats` page instead

function Navigation() {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  
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
            {t('navbar.dashboard')}
          </Link>
          <Link 
            to="/stats" 
            className={location.pathname === '/stats' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {t('navbar.stats')}
          </Link>
          <Link 
            to="/qr-generator" 
            className={location.pathname === '/qr-generator' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {t('navbar.qrGenerator')}
          </Link>
          <Link 
            to="/table-map" 
            className={location.pathname === '/table-map' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {t('navbar.dashboard')}
          </Link>
          <Link 
            to="/menu" 
            className={location.pathname === '/menu' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {t('navbar.menu')}
          </Link>
          <Link 
            to="/kds" 
            className={location.pathname === '/kds' ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {t('navbar.kds')}
          </Link>
          
          <div className="nav-user">
            <select 
              value={i18n.language} 
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="language-select"
            >
              <option value="fr">{t('settings.french')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
            <a href="#" className="user-email" onClick={(e) => { e.preventDefault(); setShowRestModal(true); }}>{user?.email}</a>
            <button className="btn-logout" onClick={() => {
              logout();
              setMenuOpen(false);
            }}>
              {t('navbar.logout')}
            </button>
          </div>
          <RestaurantSettingsModal show={showRestModal} onHide={() => setShowRestModal(false)} />
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const { t } = useTranslation();
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, loading } = useContext(AuthContext);
  const { t } = useTranslation();
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>;
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
          <Route 
            path="/kds" 
            element={
              <ProtectedRoute>
                <KDSView />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
