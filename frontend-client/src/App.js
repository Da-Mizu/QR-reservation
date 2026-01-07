import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Scanner from './components/Scanner';
import Menu from './components/Menu';
import Panier from './components/Panier';
import Confirmation from './components/Confirmation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Scanner />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
