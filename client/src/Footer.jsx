import './Layout.css';

export default function Footer() {
    return (
        <footer className="app-footer">
            <p>© {new Date().getFullYear()} AIBT MIS Tracker System. All rights reserved.</p>
            <div className="footer-links">
                <span>Version 1.0.2</span>
                <span> • </span>
                <span>Support</span>
            </div>
        </footer>
    );
}