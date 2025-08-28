import { useState, useEffect } from 'react';
import { mockUserAPI } from '../../../services/mockDataService';
import Modal from '../../Modal/Modal';
import Pagination from '../../Pagination/Pagination';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        course: '',
        description: '',
        istId: '',
        roles: [],
        extra: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const userList = await mockUserAPI.getAllUsers();
            setUsers(userList);
            // Reset to first page when data changes
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage('Error loading users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            username: '',
            name: '',
            email: '',
            course: '',
            description: '',
            istId: '',
            roles: ['member'],
            extra: ''
        });
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditUser = (user) => {
        setFormData({
            username: user.username,
            name: user.name || '',
            email: user.email || '',
            course: user.course || '',
            description: user.description || '',
            istId: user.istId || '',
            roles: user.roles || ['member'],
            extra: user.extra || ''
        });
        setSelectedUser(user);
        setIsCreating(false);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRolesChange = (e) => {
        const { value } = e.target;
        const rolesArray = value.split(',').map(role => role.trim()).filter(Boolean);
        setFormData(prev => ({
            ...prev,
            roles: rolesArray
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            if (isCreating) {
                await mockUserAPI.createUser(formData);
                setMessage('User created successfully!');
            } else {
                await mockUserAPI.updateUser(selectedUser.username, formData);
                setMessage('User updated successfully!');
            }
            
            await fetchUsers();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving user:', error);
            setMessage('Error saving user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
            return;
        }

        try {
            await mockUserAPI.deleteUser(user.username);
            setMessage('User deleted successfully!');
            await fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage('Error deleting user');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setMessage('');
    };

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / usersPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="user-management">
            <div className="section-header">
                <h2>User Management</h2>
                <button 
                    className="btn btn-primary"
                    onClick={handleCreateNew}
                >
                    Add New User
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="users-table-container">
                {users.length === 0 ? (
                    <div className="empty-state">
                        <p>No users found. Click "Add New User" to create the first user.</p>
                    </div>
                ) : (
                    <>
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Course</th>
                                    <th>Roles</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user) => (
                                    <tr key={user.username}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span>{user.name}</span>
                                            </div>
                                        </td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.course}</td>
                                        <td>
                                            <div className="roles">
                                                {user.roles?.map((role, index) => (
                                                    <span key={index} className={`role-badge role-${role}`}>
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={users.length}
                            itemsPerPage={usersPerPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={isCreating ? 'Add New User' : 'Edit User'}
                size="medium"
            >
                <form onSubmit={handleSubmit} className="user-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Username *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                disabled={saving || !isCreating}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="istId">IST ID *</label>
                            <input
                                type="text"
                                id="istId"
                                name="istId"
                                value={formData.istId}
                                onChange={handleChange}
                                required
                                disabled={saving}
                                placeholder="ist123456"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={saving}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
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
                                value={formData.course}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="">Select course</option>
                                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                <option value="Information Systems and Computer Engineering">Information Systems and Computer Engineering</option>
                                <option value="Electrical and Computer Engineering">Electrical and Computer Engineering</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="roles">Roles</label>
                            <input
                                type="text"
                                id="roles"
                                name="roles"
                                value={formData.roles.join(', ')}
                                onChange={handleRolesChange}
                                disabled={saving}
                                placeholder="member, admin, team_leader"
                            />
                            <small className="form-help">Separate multiple roles with commas</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="extra">Extra Info</label>
                        <input
                            type="text"
                            id="extra"
                            name="extra"
                            value={formData.extra}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="CTF champion, Web3 expert, etc."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            disabled={saving}
                            placeholder="Tell us about this user..."
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
                            onClick={closeModal}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
