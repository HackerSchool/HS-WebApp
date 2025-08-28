import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockUserAPI } from '../../services/mockDataService';
import './Admin.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchUsername, setSearchUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            // Mock data for admin panel
            const mockMembers = [
                {
                    ist_id: 'ist123456',
                    name: 'Admin User',
                    username: 'admin',
                    email: 'admin@hackerschool.pt',
                    course: 'LEIC',
                    description: 'System administrator',
                    roles: ['admin', 'member']
                },
                {
                    ist_id: 'ist789012',
                    name: 'Alex Chen',
                    username: 'alexchen',
                    email: 'alex.chen@tecnico.ulisboa.pt',
                    course: 'LEIC',
                    description: 'Cybersecurity enthusiast',
                    roles: ['member', 'team_leader']
                },
                {
                    ist_id: 'ist345678',
                    name: 'Maria Santos',
                    username: 'mariasantos',
                    email: 'maria.santos@tecnico.ulisboa.pt',
                    course: 'LEIC',
                    description: 'Blockchain developer',
                    roles: ['member']
                },
                {
                    ist_id: 'ist901234',
                    name: 'David Kim',
                    username: 'davidkim',
                    email: 'david.kim@tecnico.ulisboa.pt',
                    course: 'MEIC',
                    description: 'Machine learning specialist',
                    roles: ['member', 'team_leader']
                }
            ];
            setMembers(mockMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
            setMessage('Error loading members');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchUsername.trim()) return;

        try {
            setLoading(true);
            const memberData = await mockUserAPI.getUser(searchUsername);
            setSelectedMember({
                ist_id: memberData.istId || '',
                name: memberData.name || '',
                username: searchUsername,
                email: memberData.email || '',
                course: memberData.course || '',
                description: memberData.description || '',
                roles: memberData.roles || []
            });
            setIsCreating(false);
        } catch (error) {
            console.error('Error searching member:', error);
            setMessage('User not found');
            setSelectedMember(null);
            setIsCreating(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (isCreating) {
                setMessage('User created successfully!');
            } else {
                setMessage('User updated successfully!');
            }
            
            await fetchMembers(); // Refresh the list
        } catch (error) {
            console.error('Error saving user:', error);
            setMessage('Error saving user');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSelectedMember(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateNew = () => {
        setSelectedMember({
            ist_id: '',
            name: '',
            username: '',
            email: '',
            course: '',
            description: '',
            roles: []
        });
        setIsCreating(true);
        setSearchUsername('');
    };

    const handleDelete = async (istId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setMessage('User deleted successfully!');
            await fetchMembers();
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage('Error deleting user');
        }
    };

    if (loading && !selectedMember) {
        return <div className="loading">Loading admin panel...</div>;
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <p>Welcome, {user?.username}</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="admin-content">
                <div className="admin-sidebar">
                    <div className="search-section">
                        <h3>Search User</h3>
                        <div className="search-form">
                            <input
                                type="text"
                                placeholder="Enter username"
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                className="search-input"
                            />
                            <button 
                                onClick={handleSearch}
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        <button 
                            onClick={handleCreateNew}
                            className="btn btn-secondary"
                        >
                            Create New User
                        </button>
                    </div>

                    <div className="members-list">
                        <h3>All Members</h3>
                        <div className="members-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.ist_id}>
                                            <td>{member.name}</td>
                                            <td>{member.username}</td>
                                            <td>
                                                <button 
                                                    onClick={() => setSelectedMember(member)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(member.ist_id)}
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="admin-main">
                    {selectedMember && (
                        <div className="user-form-card">
                            <h3>{isCreating ? 'Create New User' : 'Edit User'}</h3>
                            
                            <form onSubmit={handleSubmit} className="user-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="ist_id">IST ID</label>
                                        <input
                                            type="text"
                                            id="ist_id"
                                            name="ist_id"
                                            value={selectedMember.ist_id || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={selectedMember.name || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={selectedMember.username || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={selectedMember.email || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="course">Course</label>
                                        <select
                                            id="course"
                                            name="course"
                                            value={selectedMember.course || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        >
                                            <option value="">Select course</option>
                                            <option value="LEIC">LEIC</option>
                                            <option value="LEIC-A">LEIC-A</option>
                                            <option value="MEIC">MEIC</option>
                                            <option value="MEIC-A">MEIC-A</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="roles">Roles</label>
                                        <input
                                            type="text"
                                            id="roles"
                                            name="roles"
                                            value={Array.isArray(selectedMember.roles) ? selectedMember.roles.join(', ') : selectedMember.roles || ''}
                                            onChange={handleChange}
                                            placeholder="admin, user"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={selectedMember.description || ''}
                                        onChange={handleChange}
                                        rows="4"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : (isCreating ? 'Create User' : 'Update User')}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedMember(null)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel; 