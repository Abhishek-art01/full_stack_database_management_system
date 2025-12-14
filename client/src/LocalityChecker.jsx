import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Reusing your existing styles for consistency

export default function LocalityChecker() {
    const navigate = useNavigate();
    const [locality, setLocality] = useState('');
    const [status, setStatus] = useState(null);

    const handleCheck = (e) => {
        e.preventDefault();
        // Mock logic: In future, connect this to your Django API
        setStatus(locality.length > 3 ? "✅ Valid Locality" : "❌ Invalid / Not Found");
    };

    return (
        <div className="dashboard-container">
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back</button>

            <div className="title-section">
                <h1>📍 Locality Checker</h1>
                <p>Verify locality names against the master database.</p>
            </div>

            <div className="sub-tasks-panel" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <form onSubmit={handleCheck}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Enter Locality Name:</label>
                        <input
                            type="text"
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            placeholder="e.g. Dwarka Sector 10"
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                        />
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', background: '#3498db', color: 'white', border: 'none' }}>
                        Check Locality
                    </button>
                </form>

                {status && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}