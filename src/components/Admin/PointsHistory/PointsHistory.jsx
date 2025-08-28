import { useState, useEffect } from 'react';
import { mockUserAPI } from '../../../services/mockDataService';
import Modal from '../../Modal/Modal';
import Pagination from '../../Pagination/Pagination';
import './PointsHistory.css';

const PointsHistory = () => {
    const [pointsHistory, setPointsHistory] = useState([]);
    const [users, setUsers] = useState([]);
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
        type: 'PCC',
        date: new Date().toISOString().split('T')[0],
        selectedUsers: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [historyData, usersData] = await Promise.all([
                mockUserAPI.getAllPointsHistory(),
                mockUserAPI.getAllUsers()
            ]);
            setPointsHistory(historyData);
            setUsers(usersData);
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
            type: 'PCC',
            date: new Date().toISOString().split('T')[0],
            selectedUsers: []
        });
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditEntry = (entry) => {
        setFormData({
            description: entry.descrição || '',
            points: entry.pontos?.toString() || '',
            type: entry.tipo || 'PCC',
            date: entry.data || new Date().toISOString().split('T')[0],
            selectedUsers: [{ username: entry.membro?.toLowerCase().replace(' ', ''), name: entry.membro }]
        });
        setSelectedEntry(entry);
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
                type: formData.type,
                date: formData.date,
                members: formData.selectedUsers
            };

            if (isCreating) {
                await mockUserAPI.createPointsEntry(pointsData);
                setMessage('Points awarded successfully!');
            } else {
                await mockUserAPI.updatePointsEntry(selectedEntry.id, pointsData);
                setMessage('Points entry updated successfully!');
            }
            
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving points entry:', error);
            setMessage('Error saving points entry');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entry) => {
        if (!window.confirm(`Are you sure you want to delete this points entry?`)) {
            return;
        }

        try {
            await mockUserAPI.deletePointsEntry(entry.id);
            setMessage('Points entry deleted successfully!');
            await fetchData();
        } catch (error) {
            console.error('Error deleting points entry:', error);
            setMessage('Error deleting points entry');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
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
        return new Date(dateString).toLocaleDateString('pt-PT');
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
                                    <th>Type</th>
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
                                                    {entry.membro?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span>{entry.membro}</span>
                                            </div>
                                        </td>
                                        <td>{entry.equipa}</td>
                                        <td className="description-cell">{entry.descrição}</td>
                                        <td>
                                            <span className={`points-badge ${getPointsTypeClass(entry.tipo)}`}>
                                                {entry.pontos} pts
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`type-badge type-${entry.tipo?.toLowerCase()}`}>
                                                {entry.tipo}
                                            </span>
                                        </td>
                                        <td>{formatDate(entry.data)}</td>
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
                                required
                                disabled={saving}
                                min="0"
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
                                <option value="PCC">PCC (Community Contribution)</option>
                                <option value="PJ">PJ (Project Points)</option>
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
                        <div className="form-group">
                            <label>Select Users to Receive Points *</label>
                            <div className="users-selection">
                                {users.map((user) => (
                                    <div key={user.username} className="user-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedUsers.some(u => u.username === user.username)}
                                                onChange={() => handleUserSelection(user)}
                                                disabled={saving}
                                            />
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-username">({user.username})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {formData.selectedUsers.length === 0 && (
                                <small className="form-error">Please select at least one user</small>
                            )}
                        </div>
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
                            {saving ? 'Saving...' : (isCreating ? 'Award Points' : 'Update Entry')}
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
