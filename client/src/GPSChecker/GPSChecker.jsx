import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function GPSChecker() {
    const navigate = useNavigate();
    const [coords, setCoords] = useState('');

    return (
        <div className="dashboard-container">
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back</button>

            <div className="title-section">
                <h1>🛰️ GPS Checker</h1>
                <p>Validate GPS coordinates or upload GPX files.</p>
            </div>

            <div className="sub-tasks-panel" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Paste Coordinates (Lat, Long):</label>
                    <textarea
                        value={coords}
                        onChange={(e) => setCoords(e.target.value)}
                        placeholder="e.g. 28.6139, 77.2090"
                        rows="4"
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <button style={{ width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none' }}>
                    Validate Coordinates
                </button>
            </div>
        </div>
    );
}