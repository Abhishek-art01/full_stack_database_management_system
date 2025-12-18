import { useState, useEffect } from 'react';
import './LocalityChecker.css';

// Icons (Same as before)
const IconCheck = () => <span>✅</span>;
const IconAlert = () => <span>⚠️</span>;
const IconSearch = () => <span>🔍</span>;

export default function LocalityManager() {
    const [activeTab, setActiveTab] = useState('view'); // 'view', 'set', 'edit'

    // Global Data
    const [masterLocalities, setMasterLocalities] = useState([]); // Dropdown data
    const [globalPending, setGlobalPending] = useState(0);

    // Tab 1: View All States
    const [tableData, setTableData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewSearch, setViewSearch] = useState('');

    // Tab 2: Set Locality States
    const [pendingItem, setPendingItem] = useState(null);
    const [selectedLocality, setSelectedLocality] = useState('');
    const [previewData, setPreviewData] = useState({ zone: '', km: '' });

    // Tab 3: Edit States
    const [editSearch, setEditSearch] = useState('');
    const [editItem, setEditItem] = useState(null);

    // --- Initial Loads ---
    useEffect(() => {
        fetchMasterDropdown();
        fetchTableData(1);
    }, []);

    const fetchMasterDropdown = async () => {
        const res = await fetch('http://127.0.0.1:8000/api/dropdown-localities/'); // Create this URL
        const data = await res.json();
        setMasterLocalities(data);
    };

    const fetchTableData = async (pageNo = 1) => {
        const res = await fetch(`http://127.0.0.1:8000/api/localities/?page=${pageNo}&search=${viewSearch}`);
        const data = await res.json();
        setTableData(data.results);
        setTotalPages(data.pagination.total_pages);
        setGlobalPending(data.global_pending);
        setPage(pageNo);
    };

    const fetchNextPending = async () => {
        const res = await fetch('http://127.0.0.1:8000/api/next-pending/'); // Create this URL
        const data = await res.json();
        if (data.found) {
            setPendingItem(data.data);
            setSelectedLocality('');
            setPreviewData({ zone: '', km: '' });
        } else {
            setPendingItem(null);
        }
    };

    // --- Logic Handlers ---

    // When dropdown changes in Tab 2 or Tab 3
    const handleLocalitySelect = (locId) => {
        setSelectedLocality(locId);

        // Find the full details of the selected locality from our master list
        const loc = masterLocalities.find(l => l.id == locId);

        if (loc) {
            setPreviewData({
                zone: loc.billing_zone,
                // Now we simply read the value we got from the backend!
                km: loc.billing_km
            });
        } else {
            setPreviewData({ zone: '', km: '' });
        }
    };

    const handleSavePending = async () => {
        if (!pendingItem || !selectedLocality) {
            alert("Please select a locality first!");
            return;
        }

        try {
            console.log("Saving...", { address_id: pendingItem.id, locality_id: selectedLocality });

            const res = await fetch('http://127.0.0.1:8000/api/save-mapping/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address_id: pendingItem.id,
                    locality_id: selectedLocality
                })
            });

            const data = await res.json();

            // CHECK IF SAVE WORKED
            if (data.success) {
                console.log("Save Success!");
                // Only move to next if save was successful
                fetchNextPending();
                fetchTableData(page);
            } else {
                console.error("Save Failed:", data.error);
                alert("Error saving: " + data.error);
            }
        } catch (err) {
            console.error("Network Error:", err);
            alert("Network Error: " + err.message);
        }
    };

    return (
        <div className="lm-container">
            {/* Header & Pending Counter */}
            <header className="lm-header">
                <h1>🏙️ Locality Manager</h1>
                <div className="metric-card">
                    <IconAlert />
                    <div>
                        <span className="metric-label">Pending Addresses</span>
                        <div className="metric-value">{globalPending}</div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="action-bar">
                <button className={`btn-action ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
                    View All
                </button>
                <button className={`btn-action ${activeTab === 'set' ? 'active' : ''}`} onClick={() => { setActiveTab('set'); fetchNextPending(); }}>
                    Set Locality (Auto)
                </button>
                <button className={`btn-action ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
                    Edit Existing
                </button>
            </div>

            {/* --- TAB 1: VIEW ALL --- */}
            {activeTab === 'view' && (
                <div className="view-dashboard">
                    <div className="table-controls">
                        <input
                            placeholder="Filter Address..."
                            value={viewSearch}
                            onChange={(e) => setViewSearch(e.target.value)}
                        />
                        <button onClick={() => fetchTableData(1)}><IconSearch /></button>
                    </div>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Address</th>
                                <th>Locality</th>
                                <th>Zone</th>
                                <th>KM</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map(row => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.address}</td>
                                    <td>{row.locality || '-'}</td>
                                    <td>{row.billing_zone || '-'}</td>
                                    <td>{row.billing_km || '-'}</td>
                                    <td>
                                        <span className={`status-badge status-${row.status.toLowerCase()}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Add Pagination Buttons Here */}
                </div>
            )}

            {/* --- TAB 2: SET LOCALITY (AUTO) --- */}
            {activeTab === 'set' && (
                <div className="view-form">
                    {pendingItem ? (
                        <>
                            <h2>⚡ Rapid Fire Assignment</h2>
                            <div className="pending-card">
                                <label>Address To Assign:</label>
                                <div className="highlight-box">{pendingItem.address}</div>
                            </div>

                            <div className="form-group">
                                <label>Search & Select Locality</label>
                                <select
                                    value={selectedLocality}
                                    onChange={(e) => handleLocalitySelect(e.target.value)}
                                >
                                    <option value="">-- Select --</option>
                                    {masterLocalities.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.locality_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="info-row">
                                <div>Zone: <strong>{previewData.zone || 'N/A'}</strong></div>
                                <div>KM: <strong>{previewData.km || 'N/A'}</strong></div>
                            </div>

                            <button className="btn-primary" onClick={handleSavePending}>
                                Save & Fetch Next ➡
                            </button>
                        </>
                    ) : (
                        <div className="success-state">
                            <IconCheck />
                            <h3>All Caught Up!</h3>
                            <p>No pending addresses found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB 3: EDIT EXISTING --- */}
            {activeTab === 'edit' && (
                <div className="view-form">
                    <h2>✏️ Search & Edit</h2>
                    {/* Add Search Bar logic similar to Tab 1 but allowing editing of the dropdown */}
                    <p>Search for an address to unlock editing mode...</p>
                </div>
            )}
        </div>
    );
}