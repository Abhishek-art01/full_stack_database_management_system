import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <header className="app-header">
            {/* 1. The "3 Lines" (Hamburger) Icon */}
            <div className="menu-toggle">
                ☰
            </div>

            {/* Brand Name */}
            <div className="header-brand" onClick={() => navigate('/dashboard')}>
                📊 MIS Tracker
            </div>

            {/* Navigation Links (Middle) */}
            <nav className="header-nav">
                <button
                    className={location.pathname === '/dashboard' ? 'active' : ''}
                    onClick={() => navigate('/dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={location.pathname === '/locality-checker' ? 'active' : ''}
                    onClick={() => navigate('/locality-checker')}
                >
                    Locality
                </button>
                <button
                    className={location.pathname === '/gps-checker' ? 'active' : ''}
                    onClick={() => navigate('/gps-checker')}
                >
                    GPS
                </button>
                <button
                    className={location.pathname === '/downloads' ? 'active' : ''}
                    onClick={() => navigate('/downloads')}
                >
                    Downloads
                </button>
            </nav>

            {/* 2. Distinct Logout Section (Right) */}
            <div className="logout-section">
                <span className="user-greeting">Hi, Admin</span>
                <button className="logout-btn" onClick={() => navigate('/')}>
                    Logout ⏻
                </button>
            </div>
        </header>
    );
}