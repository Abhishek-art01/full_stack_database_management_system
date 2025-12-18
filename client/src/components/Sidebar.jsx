import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation(); // To highlight active link

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Close sidebar when a link is clicked (better UX on mobile)
    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* The "Three Line" Hamburger Button - Always visible in top-left */}
            <button className="hamburger-btn" onClick={toggleSidebar}>
                ☰
            </button>

            {/* Overlay to close menu when clicking outside */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
            ></div>

            {/* The Sidebar Menu */}
            <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Menu</h2>
                    <button className="close-btn" onClick={toggleSidebar}>✖</button>
                </div>

                <nav className="sidebar-nav">
                    <Link
                        to="/locality-manager"
                        className={`nav-item ${location.pathname === '/locality-manager' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        🏙️ Locality Manager
                    </Link>

                    {/* NEW VEHICLE LIST SECTION */}
                    <Link
                        to="/vehicle-list"
                        className={`nav-item ${location.pathname === '/vehicle-list' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        🚚 Vehicle List
                    </Link>

                    <Link
                        to="/dashboard"
                        className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        📊 Dashboard
                    </Link>
                </nav>
            </div>
        </>
    );
}