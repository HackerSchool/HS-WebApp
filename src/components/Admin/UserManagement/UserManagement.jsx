import { useState, useEffect } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '../../../services/memberService';
import { getProjects } from '../../../services/projectService';
import { getMemberParticipations, createParticipation, deleteParticipation } from '../../../services/projectParticipationService';
import Modal from '../../Modal/Modal';
import Pagination from '../../Pagination/Pagination';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
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
        ist_id: '',
        roles: [],
        teams: []
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [userList, projectList] = await Promise.all([
                getMembers(),
                getProjects()
            ]);
            
            // Add teams data to each user
            const usersWithTeams = await Promise.all(
                userList.map(async (user) => {
                    try {
                        const participations = await getMemberParticipations(user.username);
                        const userTeams = participations.map(p => p.project_name).filter(Boolean);
                        return { ...user, teams: userTeams };
                    } catch (error) {
                        console.warn(`Could not fetch teams for user ${user.username}:`, error);
                        return { ...user, teams: [] };
                    }
                })
            );
            
            setUsers(usersWithTeams);
            setProjects(projectList);
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
            ist_id: '',
            roles: ['member'],
            teams: []
        });
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditUser = async (user) => {
        // Get user's teams from participations
        let userTeams = [];
        try {
            const participations = await getMemberParticipations(user.username);
            if (participations && participations.length > 0) {
                userTeams = participations.map(p => p.project_name).filter(Boolean);
            }
        } catch (error) {
            console.warn('Could not fetch user participations:', error);
        }

        setFormData({
            username: user.username,
            name: user.name || '',
            email: user.email || '',
            ist_id: user.ist_id || '',
            roles: user.roles || ['member'],
            teams: userTeams
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

    const handleTeamsChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedTeams = selectedOptions.map(option => option.value);
        setFormData(prev => ({
            ...prev,
            teams: selectedTeams
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            if (isCreating) {
                await createMember(formData);
                setMessage('User created successfully!');
            } else {
                // Update user data
                await updateMember(selectedUser.username, formData);
                
                // Handle team participations
                const currentTeams = selectedUser.teams || [];
                const newTeams = formData.teams || [];
                
                // Find teams to add and remove
                const teamsToAdd = newTeams.filter(team => !currentTeams.includes(team));
                const teamsToRemove = currentTeams.filter(team => !newTeams.includes(team));
                
                // Add new participations
                for (const teamName of teamsToAdd) {
                    const project = projects.find(p => p.name === teamName);
                    if (project) {
                        try {
                            await createParticipation(project.slug, {
                                username: selectedUser.username,
                                join_date: new Date().toISOString().split('T')[0],
                                roles: ['participant']
                            });
                        } catch (error) {
                            console.warn(`Failed to add user to team ${teamName}:`, error);
                        }
                    }
                }
                
                // Remove old participations
                for (const teamName of teamsToRemove) {
                    const project = projects.find(p => p.name === teamName);
                    if (project) {
                        try {
                            await deleteParticipation(project.slug, selectedUser.username);
                        } catch (error) {
                            console.warn(`Failed to remove user from team ${teamName}:`, error);
                        }
                    }
                }
                
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
            await deleteMember(user.username);
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
                                    <th>Team</th>
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
                                        <td>{user.teams ? user.teams.join(', ') : 'No teams'}</td>
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
                            <label htmlFor="ist_id">IST ID *</label>
                            <input
                                type="text"
                                id="ist_id"
                                name="ist_id"
                                value={formData.ist_id}
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
                            <label htmlFor="teams">Teams</label>
                            <select
                                id="teams"
                                name="teams"
                                value={formData.teams}
                                onChange={handleTeamsChange}
                                disabled={saving}
                                multiple
                                size="4"
                            >
                                {projects.map((project) => (
                                    <option key={project.slug} value={project.name}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <small className="form-help">Hold Ctrl/Cmd to select multiple teams</small>
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
