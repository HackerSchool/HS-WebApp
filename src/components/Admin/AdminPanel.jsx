import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement/UserManagement';
import PointsHistory from './PointsHistory/PointsHistory';
import './Admin.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    // Check if user has admin privileges
    useEffect(() => {
        if (user && !user.roles?.includes('admin')) {
            // Redirect non-admin users or show error
            console.warn('Access denied: Admin privileges required');
        }
    }, [user]);

    const tabs = [
        {
            id: 'users',
            label: 'Users',
            icon: '👥',
            component: UserManagement
        },
        {
            id: 'points',
            label: 'Points History',
            icon: '🏆',
            component: PointsHistory
        }
    ];

    const renderActiveComponent = () => {
        const activeTabData = tabs.find(tab => tab.id === activeTab);
        if (activeTabData) {
            const Component = activeTabData.component;
            return <Component />;
        }
        return null;
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    if (!user.roles?.includes('admin')) {
        return (
            <div className="admin-container">
                <div className="access-denied">
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access the admin panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <div className="admin-welcome">
                    <span>Welcome, {user.name || user.username}</span>
                    <div className="user-roles">
                        {user.roles?.map((role, index) => (
                            <span key={index} className={`role-badge role-${role}`}>
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <nav className="sidebar-nav">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                            >
                                <span className="nav-icon">{tab.icon}</span>
                                <span className="nav-label">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="admin-main">
                    {renderActiveComponent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel; 