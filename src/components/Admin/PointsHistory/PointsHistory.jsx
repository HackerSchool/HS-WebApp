import { useState, useEffect } from 'react';
import { getMembers } from '../../../services/memberService';
import { getProjects } from '../../../services/projectService';
import { getTasks, createTask, updateTask, deleteTask } from '../../../services/taskService';
import { getParticipations } from '../../../services/projectParticipationService';
import Modal from '../../Modal/Modal';
import Pagination from '../../Pagination/Pagination';
import './PointsHistory.css';

const PointsHistory = () => {
    const [pointsHistory, setPointsHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);

    const [formData, setFormData] = useState({
        description: '',
        points: '',
        type: 'pcc', // lowercase to match API enum
        date: new Date().toISOString().split('T')[0],
        selectedUsers: [],
        selectedTeam: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, usersData, projectsData] = await Promise.all([
                getTasks(),
                getMembers(),
                getProjects()
            ]);
            
            // Sort tasks by date (most recent first) - using string comparison for YYYY-MM-DD format
            const sortedTasks = [...tasksData].sort((a, b) => {
                // Handle missing dates - put them at the end
                if (!a.finished_at && !b.finished_at) return 0;
                if (!a.finished_at) return 1; // a goes to end
                if (!b.finished_at) return -1; // b goes to end
                
                // Since dates are in YYYY-MM-DD format, we can compare them as strings
                // For descending order (newest first)
                return b.finished_at.localeCompare(a.finished_at);
            });
            
            setPointsHistory(sortedTasks);
            setUsers(usersData);
            setProjects(projectsData);
            // Reset to first page when data changes
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            description: '',
            points: '',
            type: 'pcc', // lowercase to match API enum
            date: new Date().toISOString().split('T')[0],
            selectedUsers: [],
            selectedTeam: ''
        });
        setTeamMembers([]);
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditEntry = (entry) => {
        setFormData({
            description: entry.description || '',
            points: entry.points?.toString() || '',
            type: entry.point_type || 'pcc', // lowercase to match API enum
            date: entry.finished_at ? new Date(entry.finished_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            selectedUsers: [{ username: entry.username, name: entry.username }],
            selectedTeam: entry.project_name || ''
        });
        setSelectedEntry(entry);
        setIsCreating(false);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // When team changes, fetch team members and reset selected users
        if (name === 'selectedTeam') {
            setFormData(prev => ({
                ...prev,
                selectedUsers: [] // Reset selected users when team changes
            }));
            
            if (value) {
                const selectedProject = projects.find(p => p.name === value);
                if (selectedProject) {
                    try {
                        const participations = await getParticipations(selectedProject.slug);
                        // Get usernames from participations and map to full user objects
                        const memberUsernames = participations.map(p => p.username);
                        const filteredMembers = users.filter(u => memberUsernames.includes(u.username));
                        setTeamMembers(filteredMembers);
                    } catch (error) {
                        console.error('Error fetching team members:', error);
                        setTeamMembers([]);
                    }
                }
            } else {
                setTeamMembers([]);
            }
        }
    };

    const handleUserSelection = (user) => {
        setFormData(prev => {
            const isSelected = prev.selectedUsers.some(u => u.username === user.username);
            if (isSelected) {
                return {
                    ...prev,
                    selectedUsers: prev.selectedUsers.filter(u => u.username !== user.username)
                };
            } else {
                return {
                    ...prev,
                    selectedUsers: [...prev.selectedUsers, { username: user.username, name: user.name }]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const pointsData = {
                description: formData.description,
                points: parseInt(formData.points),
                point_type: formData.type.toLowerCase(), // API expects lowercase: pj, pcc, ps
                finished_at: formData.date,
                username: formData.selectedUsers[0]?.username
            };

            if (isCreating) {
                // Create task for selected team
                if (!formData.selectedTeam) {
                    setMessage('Please select a team for the task.');
                    return;
                }
                
                if (formData.selectedUsers.length === 0) {
                    setMessage('Please select at least one user.');
                    return;
                }
                
                const selectedProject = projects.find(p => p.name === formData.selectedTeam);
                if (!selectedProject) {
                    setMessage('Selected team not found.');
                    return;
                }
                
                const pointsValue = parseInt(formData.points, 10);
                
                console.log('🔢 Points input value:', formData.points);
                console.log('🔢 Parsed points value:', pointsValue);
                console.log('👥 Creating tasks for', formData.selectedUsers.length, 'user(s)');
                
                // Create a task for each selected user
                let successCount = 0;
                let failCount = 0;
                
                for (const user of formData.selectedUsers) {
                    const taskData = {
                        description: formData.description,
                        points: pointsValue,
                        point_type: formData.type.toLowerCase(), // API expects lowercase: pj, pcc, ps
                        username: user.username,
                        finished_at: formData.date
                    };
                    
                    try {
                        console.log('📤 Creating task for user:', user.username, taskData);
                        await createTask(selectedProject.slug, taskData);
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to create task for ${user.username}:`, error);
                        failCount++;
                    }
                }
                
                if (successCount > 0) {
                    setMessage(`Points awarded successfully to ${successCount} user(s)!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
                    await fetchData();
                    setIsModalOpen(false);
                } else {
                    setMessage('Failed to award points to any user.');
                    setSaving(false);
                    return; // Keep modal open on complete failure
                }
            } else {
                await updateTask(selectedEntry.id, pointsData);
                setMessage('Task updated successfully!');
                await fetchData();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error saving points entry:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setMessage(`Error saving points entry: ${error.response?.data?.description || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entry) => {
        if (!window.confirm(`Are you sure you want to delete this points entry?`)) {
            return;
        }

        try {
            await deleteTask(entry.id);
            setMessage('Task deleted successfully!');
            await fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
            setMessage('Error deleting task');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
        setTeamMembers([]);
        setMessage('');
    };

    // Pagination logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = pointsHistory.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(pointsHistory.length / entriesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getPointsTypeClass = (type) => {
        return type === 'PJ' ? 'points-pj' : 'points-pcc';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString('pt-PT');
        } catch (error) {
            return 'Invalid date';
        }
    };

    if (loading) {
        return <div className="loading">Loading points history...</div>;
    }

    return (
        <div className="points-history">
            <div className="section-header">
                <h2>Points History</h2>
                <button 
                    className="btn btn-primary"
                    onClick={handleCreateNew}
                >
                    Award Points
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="points-table-container">
                {pointsHistory.length === 0 ? (
                    <div className="empty-state">
                        <p>No points history found. Click "Award Points" to create the first entry.</p>
                    </div>
                ) : (
                    <>
                        <table className="points-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Team</th>
                                    <th>Description</th>
                                    <th>Points</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    {entry.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span>{entry.username || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td>{entry.project_name || 'No project'}</td>
                                        <td className="description-cell">{entry.description || 'No description'}</td>
                                        <td className="points-column">
                                            <span className={`points-badge ${getPointsTypeClass(entry.point_type)}`}>
                                                {entry.points || 0} {(entry.point_type || 'PCC').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{formatDate(entry.finished_at)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEditEntry(entry)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(entry)}
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
                            totalItems={pointsHistory.length}
                            itemsPerPage={entriesPerPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={isCreating ? 'Award Points' : 'Edit Points Entry'}
                size="medium"
            >
                <form onSubmit={handleSubmit} className="points-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                disabled={saving}
                                placeholder="HackerPitch - AI Integration"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="points">Points *</label>
                            <input
                                type="number"
                                id="points"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                onWheel={(e) => e.target.blur()} // Disable scroll to change value
                                required
                                disabled={saving}
                                min="0"
                                step="1"
                                placeholder="25"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="type">Points Type *</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="pcc">PCC (Community Contribution)</option>
                                    <option value="pj">PJ (Project Points)</option>
                                    <option value="ps">PS (Special Points)</option>
                                </select>
                            </div>
                        <div className="form-group">
                            <label htmlFor="date">Date *</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {isCreating && (
                        <>
                            <div className="form-group">
                                <label htmlFor="selectedTeam">Team *</label>
                                <select
                                    id="selectedTeam"
                                    name="selectedTeam"
                                    value={formData.selectedTeam}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Select a team</option>
                                    {projects.map((project) => (
                                        <option key={project.slug} value={project.name}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Select Users to Receive Points * (can select multiple)</label>
                                {!formData.selectedTeam ? (
                                    <p className="form-info">Please select a team first to see available members</p>
                                ) : teamMembers.length === 0 ? (
                                    <p className="form-info">No members found in this team</p>
                                ) : (
                                    <div className="users-selection">
                                        {teamMembers.map((user) => (
                                            <label key={user.username} className="user-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    name="selectedUser"
                                                    checked={formData.selectedUsers.some(u => u.username === user.username)}
                                                    onChange={() => handleUserSelection(user)}
                                                    disabled={saving}
                                                />
                                                <div className="user-info-select">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-username">@{user.username}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {formData.selectedTeam && formData.selectedUsers.length === 0 && teamMembers.length > 0 && (
                                    <small className="form-error">Please select at least one user</small>
                                )}
                                {formData.selectedUsers.length > 0 && (
                                    <small className="form-help-success">
                                        {formData.selectedUsers.length} user{formData.selectedUsers.length > 1 ? 's' : ''} selected
                                    </small>
                                )}
                            </div>
                        </>
                    )}

                    {!isCreating && (
                        <div className="form-group">
                            <label>User</label>
                            <div className="selected-user">
                                {formData.selectedUsers[0]?.name || 'Unknown User'}
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={saving || (isCreating && formData.selectedUsers.length === 0)}
                        >
                            {saving ? 'Saving...' : (isCreating ? `Award Points${formData.selectedUsers.length > 1 ? ` to ${formData.selectedUsers.length} Users` : ''}` : 'Update Entry')}
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

export default PointsHistory;
