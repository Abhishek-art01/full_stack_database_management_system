import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Downloads() {
    const navigate = useNavigate();

    // Mock Data
    const files = [
        { id: 1, name: "Master_Locality_List_2025.xlsx", date: "2025-01-10", size: "2.4 MB" },
        { id: 2, name: "GPS_Validation_Guidelines.pdf", date: "2024-12-05", size: "1.1 MB" },
        { id: 3, name: "December_2024_MIS_Report.csv", date: "2025-01-02", size: "500 KB" },
    ];

    return (
        <div className="dashboard-container">
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back</button>

            <div className="title-section">
                <h1>📂 Downloads</h1>
                <p>Access project resources and generated reports.</p>
            </div>

            <div className="sub-tasks-panel">
                {files.map(file => (
                    <div key={file.id} className="task-item" style={{ padding: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <strong>{file.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#777' }}>{file.date} • {file.size}</div>
                        </div>
                        <button style={{ padding: '5px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Download
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
