import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG } from "../../config/api.config";
import logoFullHL from "../../assets/logo-fullHL-clean.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./Auth.css";

const LoginForm = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [usernameValid, setUsernameValid] = useState(true);
    const [passwordValid, setPasswordValid] = useState(true);
    
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    const { login, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/leaderboard";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        
        // Validate fields
        if (name === "username") {
            setUsernameValid(value !== "");
        }
        if (name === "password") {
            setPasswordValid(value !== "");
        }
    };

    const validateUsernameField = () => {
        setUsernameValid(usernameRef.current?.value !== "");
    };

    const validatePasswordField = () => {
        setPasswordValid(passwordRef.current?.value !== "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(formData.username, formData.password);
            navigate(from, { replace: true });
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFenixOAuth = () => {
        // Redirect to Fenix OAuth with callback URL pointing directly to leaderboard
        const callbackUrl = encodeURIComponent(`${window.location.origin}/leaderboard`);
        const fenixAuthUrl = `${API_CONFIG.FLASK_API_BASE_URL}/fenix-login?next=${callbackUrl}`;
        window.location.href = fenixAuthUrl;
    };

    return (
        <div className="auth-container">
            <div className="logo">
                <img 
                    src={logoFullHL} 
                    alt="Hacker League" 
                    className="logo-img"
                />
            </div>
            <div className="auth-card">
                <h2 className="hs-login-title">Login</h2>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">User</label>
                        <input
                            ref={usernameRef}
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={validateUsernameField}
                            placeholder="Enter your username"
                            autoComplete="username"
                            required
                            disabled={loading}
                        />
                        {!usernameValid && (
                            <p className="help is-danger">Please provide a username.</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-container">
                        <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={validatePasswordField}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="base-button base-button--type-button password-field-type-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            aria-label={showPassword ? "Hide the password" : "Show the password"}
                        >
                            <FontAwesomeIcon 
                                icon={showPassword ? faEyeSlash : faEye} 
                            />
                        </button>
                    </div>
                        {!passwordValid && (
                            <p className="help is-danger">Please provide a password.</p>
                        )}
                    </div>

                    <div className="field">
                        <label className="label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mie-1"
                            />
                            Stay logged in
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn hs-login-button is-fullwidth"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    
                    <div className="mbs-4">
                        <div className="auth-divider">
                            <span>or</span>
                        </div>
                        <button
                            onClick={handleFenixOAuth}
                            className="btn btn-secondary auth-btn is-fullwidth mbs-2"
                            disabled={loading}
                        >
                            Login with Fenix ID
                        </button>
                    </div>
                    
                    <div className="admin-contact-box">
                        <p className="mbs-2 admin-contact-text">
                            Don't have an account yet or forgot your password? <span className="hs-admin-text-white">Contact an Admin</span>
                        </p>
                    </div>
                        </form>
            </div>
        </div>
    );
};

export default LoginForm;
