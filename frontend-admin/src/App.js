import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Stats from './components/Stats';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="admin-nav">
      <div className="nav-container">
        <h1 className="nav-title">QR Reservation - Admin</h1>
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            📋 Commandes
          </Link>
          <Link 
            to="/stats" 
            className={location.pathname === '/stats' ? 'nav-link active' : 'nav-link'}
          >
            📊 Statistiques
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
