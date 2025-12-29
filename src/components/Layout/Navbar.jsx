import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Don't show navbar on login page
    if (location.pathname === "/login" || location.pathname === "/") {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? "active" : ""}`}>
                <nav className="sidebar-nav">
                    {isAuthenticated && (
                        <ul className="sidebar-menu">
                            <li>
                                <Link 
                                    to="/leaderboard" 
                                    className={`sidebar-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">🏆</span>
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/history" 
                                    className={`sidebar-link ${location.pathname === '/history' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">📊</span>
                                    Log
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/hall-of-fame" 
                                    className={`sidebar-link ${location.pathname === '/hall-of-fame' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">⭐</span>
                                    Hall of Fame
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/hacknight" 
                                    className={`sidebar-link ${location.pathname === '/hacknight' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">🌙</span>
                                    HackNight
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/season" 
                                    className={`sidebar-link ${location.pathname === '/season' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">📅</span>
                                    Season
                                </Link>
                            </li>
                            {user?.roles?.includes("rh") && (
                                <li>
                                    <Link 
                                        to="/admin" 
                                        className={`sidebar-link admin-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                    >
                                        <span className="sidebar-icon">⚙️</span>
                                        Admin
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link 
                                    to="/profile" 
                                    className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">👤</span>
                                    Profile
                                </Link>
                            </li>
                        </ul>
                    )}
                </nav>
            </aside>

            {/* Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}

            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="navbar-left">
                        <Link to="/" className="navbar-brand">
                            <img
                                src="/images/logo-fullHL.svg"
                                alt="Hacker League"
                                className="navbar-logo"
                            />
                        </Link>
                        
                        <button 
                            className="hamburger-menu"
                            onClick={toggleSidebar}
                            aria-label="Toggle menu"
                        >
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </button>
                    </div>

                    <div className="navbar-right">
                        {isAuthenticated ? (
                            <div className="user-info">
                                <span className="username">{user?.username}</span>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-secondary"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

        </>
    );
};

export default Navbar;