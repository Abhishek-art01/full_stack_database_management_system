import { useState, useEffect } from 'react';
import './LocalityChecker.css';

// --- Icons ---
const IconCheck = () => <span>✅</span>;
const IconAlert = () => <span>⚠️</span>;
const IconSearch = () => <span>🔍</span>;
const IconEdit = () => <span>✏️</span>;
const IconSave = () => <span>💾</span>;
const IconCancel = () => <span>❌</span>;
const IconPlus = () => <span>➕</span>;

export default function LocalityManager() {
    const [activeTab, setActiveTab] = useState('view'); // 'view', 'set', 'add'

    // --- Global Data ---
    const [masterLocalities, setMasterLocalities] = useState([]); // Dropdown data
    const [uniqueZones, setUniqueZones] = useState([]); // List of unique zones for Tab 3
    const [globalPending, setGlobalPending] = useState(0);

    // --- Tab 1: View States ---
    const [tableData, setTableData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewSearch, setViewSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    // --- Tab 2: Set Locality States ---
    const [setMode, setSetMode] = useState('single');
    const [pendingItem, setPendingItem] = useState(null);
    const [selectedLocality, setSelectedLocality] = useState('');
    const [previewData, setPreviewData] = useState({ zone: '', km: '' });

    // Bulk States
    const [bulkSearch, setBulkSearch] = useState('');
    const [bulkResults, setBulkResults] = useState([]);
    const [selectedBulkIds, setSelectedBulkIds] = useState([]);
    const [bulkPage, setBulkPage] = useState(1);
    const [bulkTotalPages, setBulkTotalPages] = useState(1);
    const [bulkTotalRecords, setBulkTotalRecords] = useState(0);

    // --- Tab 3: Add Master States (NEW) ---
    const [newLocalityName, setNewLocalityName] = useState('');
    const [newLocalityZone, setNewLocalityZone] = useState('');

    // --- Initial Loads ---
    useEffect(() => {
        fetchMasterDropdown();
        fetchTableData(1);
    }, []);

    // --- API Calls ---

    const fetchMasterDropdown = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/dropdown-localities/');
            const data = await res.json();
            setMasterLocalities(data);

            // Extract Unique Zones for Tab 3 Dropdown
            const zones = [...new Set(data.map(item => item.billing_zone).filter(z => z))];
            setUniqueZones(zones.sort());

        } catch (error) {
            console.error("Error fetching dropdown:", error);
        }
    };

    const fetchTableData = async (pageNo = 1) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/localities/?page=${pageNo}&search=${viewSearch}`);
            const data = await res.json();

            if (data && data.results) {
                setTableData(data.results);
                setTotalPages(data.pagination ? data.pagination.total_pages : 1);
                setGlobalPending(data.global_pending || 0);
                setPage(pageNo);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("Network Error:", error);
            setTableData([]);
        }
    };

    const fetchNextPending = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/next-pending/');
            const data = await res.json();
            if (data.found) {
                setPendingItem(data.data);
                setSelectedLocality('');
                setPreviewData({ zone: '', km: '' });
            } else {
                setPendingItem(null);
            }
        } catch (error) {
            console.error("Error fetching pending:", error);
        }
    };

    // --- Logic: Inline Editing (View Tab) ---
    const startEditing = (row) => {
        setEditingId(row.id);
        const currentLoc = masterLocalities.find(l => l.locality_name === row.locality);
        setEditValue(row.locality_id || (currentLoc ? currentLoc.id : ''));
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = async (rowId) => {
        if (!editValue) return;
        try {
            const res = await fetch('http://127.0.0.1:8000/api/save-mapping/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address_id: rowId, locality_id: editValue })
            });
            const data = await res.json();
            if (data.success) { fetchTableData(page); cancelEditing(); }
            else { alert("Update failed: " + data.error); }
        } catch (err) { alert("Network error."); }
    };

    // --- Logic: Tab 2 (Set/Bulk) ---
    const handleLocalitySelect = (locId) => {
        setSelectedLocality(locId);
        const loc = masterLocalities.find(l => l.id == locId);
        if (loc) {
            setPreviewData({ zone: loc.billing_zone, km: loc.billing_km });
        } else {
            setPreviewData({ zone: '', km: '' });
        }
    };

    const handleSavePending = async () => {
        if (!pendingItem || !selectedLocality) { alert("Select a locality!"); return; }
        try {
            const res = await fetch('http://127.0.0.1:8000/api/save-mapping/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address_id: pendingItem.id, locality_id: selectedLocality })
            });
            const data = await res.json();
            if (data.success) { fetchNextPending(); fetchTableData(page); }
            else { alert("Error: " + data.error); }
        } catch (err) { console.error(err); }
    };

    // Bulk Logic
    const handleBulkSearch = async (pageNo = 1) => {
        const res = await fetch(`http://127.0.0.1:8000/api/search-pending/?q=${bulkSearch}&page=${pageNo}`);
        const data = await res.json();
        setBulkResults(data.results);
        setBulkPage(data.pagination.current_page);
        setBulkTotalPages(data.pagination.total_pages);
        setBulkTotalRecords(data.pagination.total_records);
    };

    useEffect(() => {
        if (activeTab === 'set' && setMode === 'bulk') { handleBulkSearch(1); }
    }, [activeTab, setMode]);

    const handleBulkSave = async () => {
        if (selectedBulkIds.length === 0 || !selectedLocality) { alert("Select addresses!"); return; }
        const res = await fetch('http://127.0.0.1:8000/api/bulk-save/', {
            method: 'POST',
            body: JSON.stringify({ address_ids: selectedBulkIds, locality_id: selectedLocality })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Updated ${data.count} addresses!`);
            setBulkResults([]); setBulkSearch(''); setSelectedBulkIds([]); fetchTableData(1);
        }
    };

    const toggleBulkSelect = (id) => {
        if (selectedBulkIds.includes(id)) { setSelectedBulkIds(selectedBulkIds.filter(x => x !== id)); }
        else { setSelectedBulkIds([...selectedBulkIds, id]); }
    };

    // --- Logic: Tab 3 (Add New Master) ---
    const handleAddMaster = async () => {
        if (!newLocalityName || !newLocalityZone) {
            alert("Please enter a name and select a zone.");
            return;
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/add-master-locality/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locality_name: newLocalityName,
                    zone_name: newLocalityZone
                })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                setNewLocalityName('');
                setNewLocalityZone('');
                fetchMasterDropdown(); // Refresh the master list so the new locality is available immediately
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Network Error: " + e.message);
        }
    };

    return (
        <div className="lm-container">
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

            <div className="action-bar">
                <button className={`btn-action ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>View All</button>
                <button className={`btn-action ${activeTab === 'set' ? 'active' : ''}`} onClick={() => { setActiveTab('set'); fetchNextPending(); }}>Set Locality (Auto)</button>
                <button className={`btn-action ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add New Locality</button>
            </div>

            {/* --- TAB 1: VIEW ALL --- */}
            {activeTab === 'view' && (
                <div className="view-dashboard">
                    <div className="table-controls">
                        <input placeholder="Filter Address..." value={viewSearch} onChange={(e) => setViewSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchTableData(1)} />
                        <button onClick={() => fetchTableData(1)}><IconSearch /></button>
                    </div>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Address</th><th>Locality</th><th>Zone</th><th>KM</th><th>Status</th><th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map(row => (
                                <tr key={row.id} className={editingId === row.id ? "editing-row" : ""}>
                                    <td>{row.id}</td>
                                    <td><div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '0.85rem' }}>{row.address}</div></td>
                                    <td>
                                        {editingId === row.id ? (
                                            <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="edit-select" autoFocus>
                                                <option value="">-- Select --</option>
                                                {masterLocalities.map(loc => <option key={loc.id} value={loc.id}>{loc.locality_name}</option>)}
                                            </select>
                                        ) : (<strong>{row.locality || '-'}</strong>)}
                                    </td>
                                    <td>{row.billing_zone || '-'}</td>
                                    <td>{row.billing_km || '-'}</td>
                                    <td><span className={`status-badge status-${(row.status || 'pending').toLowerCase()}`}>{row.status}</span></td>
                                    <td style={{ textAlign: 'center', minWidth: '100px' }}>
                                        {editingId === row.id ? (
                                            <div className="btn-group-row">
                                                <button onClick={() => saveEdit(row.id)} className="btn-icon-small btn-save"><IconCheck /></button>
                                                <button onClick={cancelEditing} className="btn-icon-small btn-cancel"><IconCancel /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEditing(row)} className="btn-icon-small"><IconEdit /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-controls">
                        <button disabled={page === 1} onClick={() => fetchTableData(page - 1)} className="btn-action">⬅ Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => fetchTableData(page + 1)} className="btn-action">Next ➡</button>
                    </div>
                </div>
            )}

            {/* --- TAB 2: SET LOCALITY --- */}
            {activeTab === 'set' && (
                <div className="view-form">
                    <div className="sub-tabs">
                        <button className={setMode === 'single' ? 'active' : ''} onClick={() => setSetMode('single')}>⚡ Single</button>
                        <button className={setMode === 'bulk' ? 'active' : ''} onClick={() => setSetMode('bulk')}>📦 Bulk</button>
                    </div>
                    {setMode === 'single' ? (
                        pendingItem ? (
                            <>
                                <div className="pending-card"><label>Address:</label><div className="highlight-box">{pendingItem.address}</div></div>
                                <div className="form-group">
                                    <label>Select Locality</label>
                                    <select value={selectedLocality} onChange={(e) => handleLocalitySelect(e.target.value)}>
                                        <option value="">-- Select --</option>
                                        {masterLocalities.map(loc => <option key={loc.id} value={loc.id}>{loc.locality_name}</option>)}
                                    </select>
                                </div>
                                <div className="info-row"><div>Zone: <strong>{previewData.zone}</strong></div><div>KM: <strong>{previewData.km}</strong></div></div>
                                <button className="btn-primary" onClick={handleSavePending}>Save & Next ➡</button>
                            </>
                        ) : <div className="success-state"><IconCheck /><h3>No pending items!</h3></div>
                    ) : (
                        <div>
                            <div className="table-controls" style={{ gap: '10px' }}>
                                <input placeholder="Search..." value={bulkSearch} onChange={(e) => setBulkSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBulkSearch(1)} style={{ flex: 1 }} />
                                <button onClick={() => handleBulkSearch(1)}><IconSearch /></button>
                            </div>
                            <p className="record-count">Showing {bulkResults.length} records</p>
                            {bulkResults.length > 0 && (
                                <>
                                    <div className="bulk-table-wrapper">
                                        <table className="modern-table small-text">
                                            <thead><tr><th width="50"><input type="checkbox" onChange={(e) => setSelectedBulkIds(e.target.checked ? bulkResults.map(r => r.id) : [])} /></th><th>Address</th></tr></thead>
                                            <tbody>{bulkResults.map(row => (<tr key={row.id}><td><input type="checkbox" checked={selectedBulkIds.includes(row.id)} onChange={() => toggleBulkSelect(row.id)} /></td><td>{row.address}</td></tr>))}</tbody>
                                        </table>
                                    </div>
                                    <div className="bulk-action-area">
                                        <select value={selectedLocality} onChange={(e) => handleLocalitySelect(e.target.value)}>
                                            <option value="">-- Target Locality --</option>
                                            {masterLocalities.map(loc => <option key={loc.id} value={loc.id}>{loc.locality_name}</option>)}
                                        </select>
                                        <button className="btn-primary" onClick={handleBulkSave}>Update Selected</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB 3: ADD NEW MASTER LOCALITY --- */}
            {activeTab === 'add' && (
                <div className="view-form">
                    <h2>➕ Add New Master Locality</h2>
                    <p style={{ marginBottom: '20px', color: '#666' }}>Create a new locality and map it to an existing Zone.</p>

                    <div className="form-group">
                        <label>New Locality Name:</label>
                        <input
                            type="text"
                            placeholder="e.g. New Area Phase 1"
                            value={newLocalityName}
                            onChange={(e) => setNewLocalityName(e.target.value)}
                            style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Assign to Zone:</label>
                        <select
                            value={newLocalityZone}
                            onChange={(e) => setNewLocalityZone(e.target.value)}
                            style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="">-- Select Existing Zone --</option>
                            {uniqueZones.map((zone, index) => (
                                <option key={index} value={zone}>{zone}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleAddMaster}
                        disabled={!newLocalityName || !newLocalityZone}
                        style={{ marginTop: '20px' }}
                    >
                        <IconPlus /> Add to Master Database
                    </button>
                </div>
            )}
        </div>
    );
}