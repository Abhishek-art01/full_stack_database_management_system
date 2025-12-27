import React, { useState, useEffect } from 'react';
import './VehicleList.css';

export default function VehicleList() {
    // 1. State for Data
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 2. State for Form (Adding New Vehicle)
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_no: '',
        contact_no: '',
        cab_type: '',
        vehicle_ownership: '',
        rc_document: null // This will hold the file object
    });

    // 3. Load Data on Page Load
    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/vehicles/');
            const data = await res.json();
            if (data.results) {
                setVehicles(data.results);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    // 4. Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // We must use FormData because we are sending a File
        const uploadData = new FormData();
        uploadData.append('vehicle_no', formData.vehicle_no);
        uploadData.append('contact_no', formData.contact_no);
        uploadData.append('cab_type', formData.cab_type);
        uploadData.append('vehicle_ownership', formData.vehicle_ownership);
        if (formData.rc_document) {
            uploadData.append('rc_document', formData.rc_document);
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/add-vehicle/', {
                method: 'POST',
                body: uploadData // No headers needed, browser sets multipart/form-data automatically
            });
            const result = await res.json();

            if (result.success) {
                alert("Vehicle Added Successfully! 🎉");
                setShowForm(false); // Hide form
                setFormData({ vehicle_no: '', contact_no: '', cab_type: '', vehicle_ownership: '', rc_document: null }); // Reset inputs
                fetchVehicles(); // Refresh list
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error saving:", error);
        }
    };

    // 5. Filter Logic
    const filteredVehicles = vehicles.filter(v =>
        v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.contact_no && v.contact_no.includes(searchTerm))
    );

    return (
        <div className="vl-container">
            {/* Header */}
            <header className="vl-header">
                <div className="title-group">
                    <h1>🚚 Vehicle List</h1>
                    <span className="badge-count">{filteredVehicles.length} Total</span>
                </div>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '❌ Cancel' : '➕ Add New Vehicle'}
                </button>
            </header>

            {/* ADD VEHICLE FORM (Visible only when showForm is true) */}
            {showForm && (
                <div className="form-panel">
                    <h3>New Vehicle Details</h3>
                    <form onSubmit={handleSubmit} className="vl-form">
                        <div className="form-group">
                            <label>Vehicle Number *</label>
                            <input
                                required
                                placeholder="e.g. DL-01-AB-1234"
                                value={formData.vehicle_no}
                                onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact No</label>
                            <input
                                placeholder="9876543210"
                                value={formData.contact_no}
                                onChange={e => setFormData({ ...formData, contact_no: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cab Type</label>
                            <select value={formData.cab_type} onChange={e => setFormData({ ...formData, cab_type: e.target.value })}>
                                <option value="">Select Type</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="Mini">Mini</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ownership</label>
                            <input
                                placeholder="e.g. Vendor Name"
                                value={formData.vehicle_ownership}
                                onChange={e => setFormData({ ...formData, vehicle_ownership: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Upload RC (PDF/Image)</label>
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={e => setFormData({ ...formData, rc_document: e.target.files[0] })}
                            />
                        </div>
                        <button type="submit" className="btn-save">💾 Save Vehicle</button>
                    </form>
                </div>
            )}

            {/* Controls */}
            <div className="vl-controls">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by Vehicle No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="vl-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Vehicle Number</th>
                            <th>Contact</th>
                            <th>Type</th>
                            <th>Ownership</th>
                            <th>RC Document</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map((row) => (
                                <tr key={row.id}>
                                    <td>#{row.id}</td>
                                    <td className="vehicle-no">{row.vehicle_no}</td>
                                    <td>{row.contact_no || '-'}</td>
                                    <td>{row.cab_type || '-'}</td>
                                    <td>{row.ownership || '-'}</td>
                                    {/* Find this section in your table body */}
                                    <td>
                                        {row.rc_document ? (
                                            <a
                                                /* 🔥 FIX: Prepend the Backend URL to the file path */
                                                href={`http://127.0.0.1:8000${row.rc_document}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-link"
                                            >
                                                📄 View RC
                                            </a>
                                        ) : (
                                            <span className="text-muted">No File</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-row">No vehicles found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}