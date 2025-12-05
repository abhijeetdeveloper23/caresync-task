import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ProviderAvailability from './components/ProviderAvailability';
import PatientBooking from './components/PatientBooking';
import './App.css';

function NavLinks() {
  const location = useLocation();
  const isProviderActive = location.pathname === '/' || location.pathname === '/provider';
  const isPatientActive = location.pathname === '/patient';

  return (
    <nav className="nav">
      <NavLink to="/provider" className={isProviderActive ? 'active' : ''}>
        <span className="nav-icon">👨‍⚕️</span>
        <span className="nav-text">Provider Portal</span>
      </NavLink>
      <NavLink 
        to="/patient" 
        className={isPatientActive ? 'active' : ''}
      >
        <span className="nav-icon">📅</span>
        <span className="nav-text">Patient Booking</span>
      </NavLink>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="header-content">
            <div className="header-brand">
              <span className="brand-icon">🏥</span>
              <h1>CareSync</h1>
            </div>
            <NavLinks />
          </div>
        </header>
        <div className="container">
          <Routes>
            <Route path="/" element={<ProviderAvailability />} />
            <Route path="/provider" element={<ProviderAvailability />} />
            <Route path="/patient" element={<PatientBooking />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

