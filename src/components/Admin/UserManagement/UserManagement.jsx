import { useState, useEffect } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '../../../services/memberService';
import { getProjects, createProject } from '../../../services/projectService';
import { getMemberParticipations, createParticipation, updateParticipation, deleteParticipation } from '../../../services/projectParticipationService';
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
    
    // New team creation state
    const [showNewTeamForm, setShowNewTeamForm] = useState(false);
    const [newTeamData, setNewTeamData] = useState({
        name: '',
        description: '',
        state: 'active'
    });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        ist_id: '',
        roles: [],
        rolesString: '', // Raw string for text input
        teams: [],
        coordinatorTeams: [] // Teams where user is coordinator
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
            
            // Add teams data and coordinator status to each user
            const usersWithTeams = await Promise.all(
                userList.map(async (user) => {
                    try {
                        const participations = await getMemberParticipations(user.username);
                        const userTeams = participations.map(p => p.project_name).filter(Boolean);
                        
                        // Check which teams the user is coordinator of
                        const coordinatorTeams = participations
                            .filter(p => p.roles && p.roles.includes('coordinator'))
                            .map(p => p.project_name)
                            .filter(Boolean);
                        
                        return { 
                            ...user, 
                            teams: userTeams,
                            coordinatorTeams: coordinatorTeams
                        };
                    } catch (error) {
                        console.warn(`Could not fetch teams for user ${user.username}:`, error);
                        return { ...user, teams: [], coordinatorTeams: [] };
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
            rolesString: 'member',
            teams: [],
            coordinatorTeams: []
        });
        setShowNewTeamForm(false);
        setNewTeamData({
            name: '',
            description: '',
            state: 'active'
        });
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditUser = async (user) => {
        // Get user's teams and coordinator status from participations
        let userTeams = [];
        let coordinatorTeams = [];
        try {
            const participations = await getMemberParticipations(user.username);
            if (participations && participations.length > 0) {
                userTeams = participations.map(p => p.project_name).filter(Boolean);
                // Check which teams the user is coordinator of
                coordinatorTeams = participations
                    .filter(p => p.roles && p.roles.includes('coordinator'))
                    .map(p => p.project_name)
                    .filter(Boolean);
            }
        } catch (error) {
            console.warn('Could not fetch user participations:', error);
        }

        const rolesArray = user.roles || ['member'];
        
        console.log('🔍 Loading user for editing:', user.username);
        console.log('Teams found:', userTeams);
        console.log('Coordinator in teams:', coordinatorTeams);
        
        setFormData({
            username: user.username,
            name: user.name || '',
            email: user.email || '',
            ist_id: user.ist_id || '',
            roles: rolesArray,
            rolesString: rolesArray.join(', '),
            teams: userTeams,
            coordinatorTeams: coordinatorTeams
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
        // Store the raw string value, don't process it yet
        // We'll convert it to array on submit
        setFormData(prev => ({
            ...prev,
            rolesString: value
        }));
    };

    const handleTeamsChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedTeams = selectedOptions.map(option => option.value);
        
        // Remove coordinator status from teams that are no longer selected
        const newCoordinatorTeams = formData.coordinatorTeams.filter(
            team => selectedTeams.includes(team)
        );
        
        setFormData(prev => ({
            ...prev,
            teams: selectedTeams,
            coordinatorTeams: newCoordinatorTeams
        }));
    };

    const handleCoordinatorTeamsChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedCoordinatorTeams = selectedOptions.map(option => option.value);
        setFormData(prev => ({
            ...prev,
            coordinatorTeams: selectedCoordinatorTeams
        }));
    };

    const handleNewTeamChange = (e) => {
        const { name, value } = e.target;
        setNewTeamData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateNewTeam = async () => {
        if (!newTeamData.name.trim()) {
            setMessage('Team name is required');
            return null;
        }

        try {
            const teamToCreate = {
                name: newTeamData.name.trim(),
                description: newTeamData.description.trim() || '',
                state: newTeamData.state || 'active',
                start_date: new Date().toISOString().split('T')[0] // Add required start_date in YYYY-MM-DD format
            };
            
            const createdTeam = await createProject(teamToCreate);
            
            // Refresh projects list
            const updatedProjects = await getProjects();
            setProjects(updatedProjects);
            
            // Add the new team to the user's teams
            setFormData(prev => ({
                ...prev,
                teams: [...prev.teams, createdTeam.name]
            }));
            
            // Reset new team form
            setNewTeamData({
                name: '',
                description: '',
                state: 'active'
            });
            setShowNewTeamForm(false);
            
            setMessage(`Team "${createdTeam.name}" created successfully!`);
            return createdTeam;
        } catch (error) {
            console.error('Error creating team:', error);
            setMessage(`Error creating team: ${error.response?.data?.description || error.message}`);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            // Convert rolesString to roles array
            const rolesArray = formData.rolesString
                .split(',')
                .map(role => role.trim())
                .filter(role => role.length > 0);
            
            // Prepare user data without teams, coordinatorTeams, rolesString, and username (teams are managed separately, username cannot be changed)
            const { teams, coordinatorTeams, rolesString, username, ...userDataWithoutTeamsAndUsername } = formData;
            
            // Add the processed roles array
            userDataWithoutTeamsAndUsername.roles = rolesArray;
            
            if (isCreating) {
                // For creating, we need the username
                const newUserData = { username, ...userDataWithoutTeamsAndUsername };
                await createMember(newUserData);
                setMessage('User created successfully!');
                
                // Add user to teams if specified
                if (teams && teams.length > 0) {
                    for (const teamName of teams) {
                        const project = projects.find(p => p.name === teamName);
                        if (project) {
                            try {
                                // Check if user should be coordinator of this team
                                const isCoordinator = coordinatorTeams && coordinatorTeams.includes(teamName);
                                const participationRoles = isCoordinator ? ['coordinator'] : ['participant'];
                                
                                await createParticipation(project.slug, {
                                    username: username,
                                    join_date: new Date().toISOString().split('T')[0],
                                    roles: participationRoles
                                });
                            } catch (error) {
                                console.warn(`Failed to add user to team ${teamName}:`, error);
                            }
                        }
                    }
                }
            } else {
                // Update user data (without username since it can't be changed)
                // Don't send roles at all - they should be managed through a separate, more secure interface
                // This avoids permission issues with protected roles like sysadmin, rh, etc.
                const { roles, ...userDataWithoutRoles } = userDataWithoutTeamsAndUsername;
                
                console.log('Updating user:', selectedUser.username);
                console.log('Data being sent (without roles):', userDataWithoutRoles);
                console.log('Original formData:', formData);
                console.log('Note: Roles are not being updated to avoid permission issues');
                await updateMember(selectedUser.username, userDataWithoutRoles);
                
                // Handle team participations
                const currentTeams = selectedUser.teams || [];
                const newTeams = teams || [];
                const newCoordinatorTeams = coordinatorTeams || [];
                
                // Get current coordinator teams from the user's original data
                let currentCoordinatorTeams = [];
                try {
                    const participations = await getMemberParticipations(selectedUser.username);
                    if (participations && participations.length > 0) {
                        currentCoordinatorTeams = participations
                            .filter(p => p.roles && p.roles.includes('coordinator'))
                            .map(p => p.project_name)
                            .filter(Boolean);
                    }
                } catch (error) {
                    console.warn('Could not fetch current coordinator status:', error);
                }
                
                // Find teams to add and remove
                const teamsToAdd = newTeams.filter(team => !currentTeams.includes(team));
                const teamsToRemove = currentTeams.filter(team => !newTeams.includes(team));
                const teamsToUpdate = newTeams.filter(team => currentTeams.includes(team));
                
                // Add new participations
                for (const teamName of teamsToAdd) {
                    const project = projects.find(p => p.name === teamName);
                    if (project) {
                        try {
                            const isCoordinator = newCoordinatorTeams.includes(teamName);
                            const participationRoles = isCoordinator ? ['coordinator'] : ['participant'];
                            
                            await createParticipation(project.slug, {
                                username: selectedUser.username,
                                join_date: new Date().toISOString().split('T')[0],
                                roles: participationRoles
                            });
                        } catch (error) {
                            console.warn(`Failed to add user to team ${teamName}:`, error);
                        }
                    }
                }
                
                // Update existing participations if coordinator status changed
                for (const teamName of teamsToUpdate) {
                    const project = projects.find(p => p.name === teamName);
                    if (project) {
                        const isNowCoordinator = newCoordinatorTeams.includes(teamName);
                        const wasCoordinator = currentCoordinatorTeams.includes(teamName);
                        
                        // Only update if coordinator status changed
                        if (isNowCoordinator !== wasCoordinator) {
                            try {
                                const participationRoles = isNowCoordinator ? ['coordinator'] : ['participant'];
                                await updateParticipation(project.slug, selectedUser.username, {
                                    roles: participationRoles
                                });
                            } catch (error) {
                                console.warn(`Failed to update participation for team ${teamName}:`, error);
                            }
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
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setMessage(`Error saving user: ${error.response?.data?.message || error.message}`);
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
                                                {(() => {
                                                    const hasTeams = user.teams && user.teams.length > 0;
                                                    const isCoordinator = user.coordinatorTeams && user.coordinatorTeams.length > 0;
                                                    const roles = user.roles || [];
                                                    
                                                    // Filter out 'member' role if user is in teams (they'll get 'Participant' or 'Coordinator' badge)
                                                    // Also filter out 'team_leader' since we'll show 'Coordinator' badge from participations
                                                    let rolesToShow = roles;
                                                    if (hasTeams) {
                                                        rolesToShow = roles.filter(role => role !== 'member' && role !== 'team_leader');
                                                    }
                                                    
                                                    return (
                                                        <>
                                                            {rolesToShow.map((role, index) => (
                                                                <span key={index} className={`role-badge role-${role}`}>
                                                                    {role}
                                                                </span>
                                                            ))}
                                                            {/* Show Coordinator badge if user is coordinator of any team (only once) */}
                                                            {isCoordinator && (
                                                                <span className="role-badge role-team_leader">
                                                                    Coordinator
                                                                </span>
                                                            )}
                                                            {/* Show Participant badge if user is in teams but not coordinator of ALL teams */}
                                                            {hasTeams && !isCoordinator && (
                                                                <span className="role-badge role-participant">
                                                                    Participant
                                                                </span>
                                                            )}
                                                            {/* If coordinator of some but not all teams, show both */}
                                                            {hasTeams && isCoordinator && user.teams.length !== user.coordinatorTeams.length && (
                                                                <span className="role-badge role-participant">
                                                                    Participant
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label htmlFor="teams">Teams</label>
                                {isCreating && (
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => setShowNewTeamForm(!showNewTeamForm)}
                                        style={{ 
                                            padding: '0.25rem 0.5rem', 
                                            fontSize: '0.85rem',
                                            background: showNewTeamForm ? 'rgba(231, 76, 60, 0.2)' : 'rgba(109, 186, 118, 0.2)',
                                            color: showNewTeamForm ? '#e74c3c' : '#6dba76',
                                            border: showNewTeamForm ? '1px solid #e74c3c' : '1px solid #6dba76'
                                        }}
                                    >
                                        {showNewTeamForm ? '✕ Cancel' : '+ Create New Team'}
                                    </button>
                                )}
                            </div>
                            
                            {showNewTeamForm && isCreating && (
                                <div style={{ 
                                    background: 'rgba(109, 186, 118, 0.1)', 
                                    border: '1px solid rgba(109, 186, 118, 0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#6dba76' }}>
                                        New Team Details
                                    </h4>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label htmlFor="newTeamName" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                            Team Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="newTeamName"
                                            name="name"
                                            value={newTeamData.name}
                                            onChange={handleNewTeamChange}
                                            placeholder="e.g., Team Alpha"
                                            disabled={saving}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label htmlFor="newTeamDescription" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                            Description
                                        </label>
                                        <textarea
                                            id="newTeamDescription"
                                            name="description"
                                            value={newTeamData.description}
                                            onChange={handleNewTeamChange}
                                            placeholder="Team description (optional)"
                                            disabled={saving}
                                            rows="2"
                                            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label htmlFor="newTeamState" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                            Status
                                        </label>
                                        <select
                                            id="newTeamState"
                                            name="state"
                                            value={newTeamData.state}
                                            onChange={handleNewTeamChange}
                                            disabled={saving}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="undefined">Undefined</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleCreateNewTeam}
                                        disabled={saving || !newTeamData.name.trim()}
                                        style={{ width: '100%', fontSize: '0.9rem' }}
                                    >
                                        {saving ? 'Creating...' : 'Create Team'}
                                    </button>
                                </div>
                            )}
                            
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
                            <label htmlFor="coordinatorTeams">Coordinator</label>
                            <select
                                id="coordinatorTeams"
                                name="coordinatorTeams"
                                value={formData.coordinatorTeams}
                                onChange={handleCoordinatorTeamsChange}
                                disabled={saving || !formData.teams || formData.teams.length === 0}
                                multiple
                                size={4}
                            >
                                {formData.teams && formData.teams.length > 0 ? (
                                    formData.teams.map((teamName) => (
                                        <option key={teamName} value={teamName}>
                                            {teamName}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No teams selected</option>
                                )}
                            </select>
                            <small className="form-help">
                                {formData.teams && formData.teams.length > 0 
                                    ? 'Select teams where this user is coordinator (from selected teams above)'
                                    : 'Select teams first to enable coordinator selection'
                                }
                            </small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="roles">Roles {!isCreating && '(Read-Only)'}</label>
                            <textarea
                                id="roles"
                                name="roles"
                                value={formData.rolesString}
                                onChange={handleRolesChange}
                                disabled={saving || !isCreating}
                                placeholder="member, dev, rh, admin"
                                rows="2"
                                style={{ 
                                    resize: 'vertical', 
                                    fontFamily: 'inherit',
                                    backgroundColor: !isCreating ? 'rgba(255, 255, 255, 0.05)' : undefined,
                                    cursor: !isCreating ? 'not-allowed' : undefined
                                }}
                            />
                            <small className="form-help">
                                {isCreating 
                                    ? 'Separate with commas. Examples: member, dev, rh, team_leader, admin, sysadmin'
                                    : '⚠️ Roles cannot be edited after creation due to security restrictions. Contact a super-admin to change roles.'
                                }
                            </small>
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
