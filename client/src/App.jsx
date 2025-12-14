import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import LocalityChecker from './LocalityChecker';
import GPSChecker from './GPSChecker';
import Downloads from './Downloads';
import Header from './Header';
import Footer from './Footer';
import './Layout.css'; // Import the CSS

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {/* Header appears on every page */}
        <Header />

        {/* Main content area changes based on route */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/locality-checker" element={<LocalityChecker />} />
            <Route path="/gps-checker" element={<GPSChecker />} />
            <Route path="/downloads" element={<Downloads />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter >
  );
}

export default App;