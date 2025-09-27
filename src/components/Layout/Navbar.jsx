import { useState } from "react";
import { Link, useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PrivateRoute from "../PrivateRoute";
import "./Navbar.css";

// Pages
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ProfilePage from "../../pages/ProfilePage";
import LeaderboardPage from "../../pages/LeaderboardPage";
import AdminPage from "../../pages/AdminPage";
import HistoryPage from "../../pages/HistoryPage";
import HallOfFamePage from "../../pages/HallOfFamePage";
import HackNightPage from "../../pages/HackNightPage";
import SeasonPage from "../../pages/SeasonPage";

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
                                <Link to="/leaderboard" className="sidebar-link">
                                    <span className="sidebar-icon">🏆</span>
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/history" className="sidebar-link">
                                    <span className="sidebar-icon">📊</span>
                                    Log
                                </Link>
                            </li>
                            <li>
                                <Link to="/hall-of-fame" className="sidebar-link">
                                    <span className="sidebar-icon">⭐</span>
                                    Hall of Fame
                                </Link>
                            </li>
                            <li>
                                <Link to="/hacknight" className="sidebar-link">
                                    <span className="sidebar-icon">🌙</span>
                                    HackNight
                                </Link>
                            </li>
                            <li>
                                <Link to="/season" className="sidebar-link">
                                    <span className="sidebar-icon">📅</span>
                                    Season
                                </Link>
                            </li>
                            {user?.roles?.includes("sysadmin") && (
                                <li>
                                    <Link to="/admin" className="sidebar-link admin-link">
                                        <span className="sidebar-icon">⚙️</span>
                                        Admin
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link to="/profile" className="sidebar-link">
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

            {/* Content wrapper with sidebar push effect */}
            <div className={`content-wrapper ${isSidebarOpen ? "sidebar-open" : ""}`}>
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<LoginPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/leaderboard"
                            element={
                                <PrivateRoute>
                                    <LeaderboardPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <PrivateRoute>
                                    <HistoryPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/hall-of-fame"
                            element={
                                <PrivateRoute>
                                    <HallOfFamePage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/hacknight"
                            element={
                                <PrivateRoute>
                                    <HackNightPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/season"
                            element={
                                <PrivateRoute>
                                    <SeasonPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <PrivateRoute requireAdmin={true}>
                                    <AdminPage />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </div>
            </div>
        </>
    );
};

export default Navbar;