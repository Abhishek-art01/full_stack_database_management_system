import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import LocalityChecker from './LocalityChecker';
import GPSChecker from './GPSChecker';
import Downloads from './Downloads';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/locality-checker" element={<LocalityChecker />} />
        <Route path="/gps-checker" element={<GPSChecker />} />
        <Route path="/downloads" element={<Downloads />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;