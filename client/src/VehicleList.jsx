import React, { useState } from 'react';
import './VehicleList.css';

// Sample Data (Replace this with an API call later)
const initialVehicles = [
    { id: 1, number: 'DL-01-AB-1234', type: 'Sedan', driver: 'Raju Singh', status: 'Active', fuel: 'Petrol' },
    { id: 2, number: 'UP-16-CD-5678', type: 'SUV', driver: 'Amit Kumar', status: 'Maintenance', fuel: 'Diesel' },
    { id: 3, number: 'HR-26-EF-9012', type: 'Mini Van', driver: 'Sunil Verma', status: 'Inactive', fuel: 'CNG' },
    { id: 4, number: 'DL-04-GH-3456', type: 'Sedan', driver: 'Vikram Das', status: 'Active', fuel: 'Petrol' },
    { id: 5, number: 'UP-14-IJ-7890', type: 'Luxury', driver: 'Sandeep Roy', status: 'Trip', fuel: 'Diesel' },
];

export default function VehicleList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [vehicles, setVehicles] = useState(initialVehicles);

    // Filter Logic
    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            setVehicles(vehicles.filter(v => v.id !== id));
        }
    };

    return (
        <div className="vl-container">
            {/* Header */}
            <header className="vl-header">
                <div className="title-group">
                    <h1>🚚 Vehicle List</h1>
                    <span className="badge-count">{filteredVehicles.length} Total</span>
                </div>
                <button className="btn-add">➕ Add New Vehicle</button>
            </header>

            {/* Controls */}
            <div className="vl-controls">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by Vehicle No. or Driver..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="filter-select">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="vl-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Vehicle Number</th>
                            <th>Type</th>
                            <th>Fuel</th>
                            <th>Driver Name</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map((row) => (
                                <tr key={row.id}>
                                    <td>#{row.id}</td>
                                    <td className="vehicle-no">{row.number}</td>
                                    <td>{row.type}</td>
                                    <td>{row.fuel}</td>
                                    <td>{row.driver}</td>
                                    <td>
                                        <span className={`status-pill ${row.status.toLowerCase()}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button className="btn-icon edit" title="Edit">✏️</button>
                                        <button className="btn-icon delete" title="Delete" onClick={() => handleDelete(row.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-row">
                                    No vehicles found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}