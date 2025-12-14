import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // We will add specific styles for this page below

export default function LocalityChecker() {
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0 });
    const [currentTask, setCurrentTask] = useState(null);
    const [masterLocalities, setMasterLocalities] = useState([]); // The dropdown list

    // Form State
    const [selectedLocalityName, setSelectedLocalityName] = useState('');
    const [selectedLocalityData, setSelectedLocalityData] = useState(null); // Stores ID and Zone
    const [billingKm, setBillingKm] = useState('---');

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        // Load Master Data (Localities) once
        fetch('http://127.0.0.1:8000/api/get-locality-master/')
            .then(res => res.json())
            .then(data => setMasterLocalities(data.localities))
            .catch(err => console.error(err));

        // Load First Task
        fetchNextTask();
    }, []);

    // --- 2. FETCH NEXT PENDING ADDRESS ---
    const fetchNextTask = () => {
        setLoading(true);
        // Reset Form
        setSelectedLocalityName('');
        setSelectedLocalityData(null);
        setBillingKm('---');

        fetch('http://127.0.0.1:8000/api/get-pending-address/')
            .then(res => res.json())
            .then(data => {
                if (data.found) {
                    setCurrentTask(data.data);
                    setStats({ pending: data.pending_count });
                } else {
                    setCurrentTask(null);
                    setStats({ pending: 0 });
                }
                setLoading(false);
            });
    };

    // --- 3. HANDLE LOCALITY SELECTION ---
    const handleLocalityChange = (e) => {
        const val = e.target.value;
        setSelectedLocalityName(val);

        // Find the exact object from master list
        const match = masterLocalities.find(loc => loc.locality_name === val);

        if (match) {
            setSelectedLocalityData(match);
            // Fetch KM automatically based on Zone
            fetch(`http://127.0.0.1:8000/api/get-billing-km/?zone=${match.billing_zone}`)
                .then(res => res.json())
                .then(data => setBillingKm(data.km));
        } else {
            setSelectedLocalityData(null);
            setBillingKm('---');
        }
    };

    // --- 4. SAVE & NEXT ---
    const handleSave = () => {
        if (!currentTask || !selectedLocalityData) return;

        fetch('http://127.0.0.1:8000/api/save-mapping/', {
            method: 'POST',
            body: JSON.stringify({
                address_id: currentTask.id,
                locality_id: selectedLocalityData.id
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    fetchNextTask(); // Automatically load next
                } else {
                    alert("Error saving: " + data.error);
                }
            });
    };

    return (
        <div className="dashboard-container">
            {/* Header / Stats Bar */}
            <div className="checker-header">
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Dashboard</button>
                <div className="stats-badge">
                    <span className="count">{stats.pending}</span>
                    <span className="label">Addresses Pending</span>
                </div>
            </div>

            <div className="title-section">
                <h1>📍 Locality Mapper</h1>
                <p>Map raw addresses to standardized billing localities.</p>
            </div>

            {loading ? (
                <div className="loading-panel">Loading next task...</div>
            ) : !currentTask ? (
                <div className="success-panel">
                    <h2>🎉 All Caught Up!</h2>
                    <p>There are no pending addresses to review.</p>
                </div>
            ) : (
                <div className="mapping-card">
                    {/* Left Side: The Problem (Address) */}
                    <div className="address-display">
                        <label>RAW PICKUP ADDRESS</label>
                        <div className="address-box">
                            {currentTask.address}
                        </div>
                    </div>

                    {/* Right Side: The Solution (Data Entry) */}
                    <div className="form-grid">

                        {/* 1. Locality Input (Datalist for searching) */}
                        <div className="form-group full-width">
                            <label>Assign Locality</label>
                            <input
                                list="locality-options"
                                value={selectedLocalityName}
                                onChange={handleLocalityChange}
                                placeholder="Type to search locality..."
                                className="search-input"
                            />
                            <datalist id="locality-options">
                                {masterLocalities.map(loc => (
                                    <option key={loc.id} value={loc.locality_name} />
                                ))}
                            </datalist>
                        </div>

                        {/* 2. Auto-Populated Zone (Read Only) */}
                        <div className="form-group">
                            <label>Billing Zone</label>
                            <input
                                type="text"
                                value={selectedLocalityData ? selectedLocalityData.billing_zone : "---"}
                                disabled
                                className="readonly-input"
                            />
                        </div>

                        {/* 3. Auto-Populated KM (Read Only) */}
                        <div className="form-group">
                            <label>Billing KM</label>
                            <input
                                type="text"
                                value={billingKm}
                                disabled
                                className="readonly-input"
                            />
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="action-bar">
                        <button className="skip-btn" onClick={fetchNextTask}>Skip This</button>
                        <button
                            className="save-btn"
                            onClick={handleSave}
                            disabled={!selectedLocalityData} // Disable if no valid locality selected
                        >
                            Save & Next ➝
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}