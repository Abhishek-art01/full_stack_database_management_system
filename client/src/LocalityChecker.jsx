import { useState, useEffect } from 'react';
import './LocalityChecker.css';

// --- Simple Icons ---
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconList = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;

export default function LocalityManager() {
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'update', 'edit'
    const [localities, setLocalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0 });

    // Inputs for forms
    const [selectedLocalityId, setSelectedLocalityId] = useState('');
    const [statusInput, setStatusInput] = useState('Pending');
    const [editForm, setEditForm] = useState({ id: '', name: '', address: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // REPLACE WITH YOUR ACTUAL DJANGO ENDPOINT
            // const res = await fetch('http://127.0.0.1:8000/api/localities/'); 
            // const data = await res.json();

            // Mock Data for demonstration
            const mockData = [
                { id: 1, locality_name: "Sector 45, Gurgaon", address: "Near Huda City", status: "Pending" },
                { id: 2, locality_name: "Dwarka Sec 10", address: "Plot 4B", status: "Approved" },
                { id: 3, locality_name: "Noida Sec 62", address: "IT Park", status: "Rejected" },
            ];

            setTimeout(() => {
                setLocalities(mockData);
                const pendingCount = mockData.filter(i => i.status === 'Pending').length;
                setStats({ pending: pendingCount });
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Handlers ---
    const handleUpdateStatus = (e) => {
        e.preventDefault();
        alert(`Updating ID ${selectedLocalityId} to ${statusInput}`);
        // Add API call here: POST /api/update-status/
        setActiveView('dashboard');
        fetchData(); // Refresh list
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        alert(`Saving: ${editForm.name} - ${editForm.address}`);
        // Add API call here: POST /api/edit-locality/
        setActiveView('dashboard');
        fetchData();
    };

    const startEdit = (loc) => {
        setEditForm({ id: loc.id, name: loc.locality_name, address: loc.address });
        setActiveView('edit');
    };

    // --- Filtered List for Dashboard ---
    const filteredList = localities.filter(l =>
        l.locality_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="lm-container">
            {/* 1. Header & Metric Corner */}
            <header className="lm-header">
                <div className="header-titles">
                    <h1>🏙️ Locality Manager</h1>
                    <p>Overview of system localities and status</p>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <IconAlert />
                    </div>
                    <div className="metric-info">
                        <span className="metric-label">Pending Localities</span>
                        <span className="metric-value">{stats.pending}</span>
                    </div>
                </div>
            </header>

            <div className="divider"></div>

            {/* 2. Horizontal Action Buttons */}
            <div className="action-bar">
                <button
                    className={`btn-action ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >
                    <IconList /> View All
                </button>
                <button
                    className={`btn-action ${activeView === 'update' ? 'active' : ''}`}
                    onClick={() => setActiveView('update')}
                >
                    <IconRefresh /> Update Status
                </button>
                <button
                    className={`btn-action ${activeView === 'edit' ? 'active' : ''}`}
                    onClick={() => setActiveView('edit')}
                >
                    <IconEdit /> Edit Locality
                </button>
            </div>

            {/* 3. Dynamic Content Area */}
            <div className="lm-content">

                {/* VIEW: DASHBOARD TABLE */}
                {activeView === 'dashboard' && (
                    <div className="view-dashboard">
                        <div className="table-controls">
                            <input
                                type="text"
                                placeholder="Search localities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Locality Name</th>
                                        <th>Address</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                                    ) : filteredList.map((loc) => (
                                        <tr key={loc.id}>
                                            <td>#{loc.id}</td>
                                            <td>{loc.locality_name}</td>
                                            <td>{loc.address}</td>
                                            <td>
                                                <span className={`status-badge status-${loc.status.toLowerCase()}`}>
                                                    {loc.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-icon-small" onClick={() => startEdit(loc)}>
                                                    <IconEdit />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW: UPDATE FORM */}
                {activeView === 'update' && (
                    <div className="view-form">
                        <h2>📝 Update Status</h2>
                        <form onSubmit={handleUpdateStatus} className="card-form">
                            <div className="form-group">
                                <label>Select Locality</label>
                                <select
                                    value={selectedLocalityId}
                                    onChange={e => setSelectedLocalityId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Locality --</option>
                                    {localities.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.locality_name} (Current: {loc.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>New Status</label>
                                <select
                                    value={statusInput}
                                    onChange={e => setStatusInput(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary">Update Status</button>
                        </form>
                    </div>
                )}

                {/* VIEW: EDIT FORM */}
                {activeView === 'edit' && (
                    <div className="view-form">
                        <h2>✏️ Edit Details</h2>
                        <p className="hint">Select a locality from the Dashboard to populate this form, or select below.</p>

                        <form onSubmit={handleEditSave} className="card-form">
                            <div className="form-group">
                                <label>Select Record to Edit</label>
                                <select
                                    value={editForm.id}
                                    onChange={(e) => {
                                        const loc = localities.find(l => l.id.toString() === e.target.value);
                                        if (loc) startEdit(loc);
                                    }}
                                >
                                    <option value="">-- Select Locality --</option>
                                    {localities.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.locality_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Locality Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    rows="3"
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary">Save Changes</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}