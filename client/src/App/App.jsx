import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// --- Page Imports ---
// Assuming these are in your src/ folder based on your file tree
import Login from '../Login/Login';
import Dashboard from '../Dashboard/Dashboard';
import LocalityChecker from '../LocalityChecker/LocalityChecker'; // This is your Locality Manager
import VehicleList from '../VehicleList/VehicleList';         // The new file
import GPSChecker from '../GPSChecker/GPSChecker';
import Downloads from '../Downloads/Downloads';

// --- Component Imports ---
// Assuming Sidebar was moved to components folder as discussed
import Sidebar from '../components/Sidebar';

import './Layout.css';

// We create a helper component so we can use the 'useLocation' hook
// to hide the Sidebar on the Login page.
function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <div className="app-wrapper">
      {/* Only show Sidebar if we are NOT on the login page */}
      {!isLoginPage && <Sidebar />}

      <main className="main-content">
        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Locality Manager (Updated path to match Sidebar) */}
          <Route path="/locality-manager" element={<LocalityChecker />} />

          {/* NEW: Vehicle List */}
          <Route path="/vehicle-list" element={<VehicleList />} />

          {/* Other Tools */}
          <Route path="/gps-checker" element={<GPSChecker />} />
          <Route path="/downloads" element={<Downloads />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;