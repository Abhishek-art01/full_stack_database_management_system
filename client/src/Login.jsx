import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                navigate('/dashboard');
            } else {
                alert("Error: " + data.message);
                // If error, stop loading so they can try again
                setIsLoading(false);
            }

        } catch (error) {
            console.error("Connection Error:", error);
            alert("Could not connect to the server.");
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* (Keep your shapes here...) */}
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>

            <div className="login-glass">
                <div className="header">
                    <h2>Welcome Back</h2>
                    <p>Enter your credentials to access the portal.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text" required value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading} /* Disable input while loading */
                        />
                        <label>Username</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="password" required value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <label>Password</label>
                    </div>

                    <button type="submit" className="btn-login" disabled={isLoading}>
                        {isLoading ? <span className="loader"></span> : "Sign In"}
                    </button>

                </form>
            </div>
        </div>
    );
}