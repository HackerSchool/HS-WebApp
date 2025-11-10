import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMembers } from '../../../services/memberService';
import { getProjects } from '../../../services/projectService';
import {
    getTasks,
    getProjectTeamTasks,
    createTask,
    createTeamTask,
    updateTask,
    deleteTask,
    deleteTeamTask,
} from '../../../services/taskService';
import {
    getParticipations,
    getMemberParticipations,
} from '../../../services/projectParticipationService';
import Modal from '../../Modal/Modal';
import Pagination from '../../Pagination/Pagination';
import './PointsHistory.css';

const INDIVIDUAL_OPTION = '__individual__';

const PointsHistory = () => {
    const [pointsHistory, setPointsHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [visibleMembers, setVisibleMembers] = useState([]);
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
        teamPoints: '',
        teamType: 'pcc',
        date: new Date().toISOString().split('T')[0],
        selectedTeam: INDIVIDUAL_OPTION,
    });
    const [assignees, setAssignees] = useState([]);
    const memberParticipationCache = useRef({});

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

            const teamTaskCollections = await Promise.all(
                projectsData.map(async (project) => {
                    try {
                        const teamTasks = await getProjectTeamTasks(project.slug);
                        return teamTasks.map((task) => ({
                            id: task.id,
                            description: task.description,
                            points: task.points,
                            point_type: task.point_type?.toUpperCase() || 'PCC',
                            finished_at: task.finished_at,
                            username: task.contributors && task.contributors.length
                                ? task.contributors.join(', ')
                                : 'Team effort',
                            contributors: task.contributors || [],
                            project_name: project.name,
                            project_slug: project.slug,
                            isTeamTask: true,
                        }));
                    } catch (error) {
                        console.error(`Error fetching team tasks for project ${project.slug}:`, error);
                        return [];
                    }
                })
            );

            const teamTasks = teamTaskCollections.flat();
            const memberTasks = tasksData.map((task) => ({
                ...task,
                point_type: task.point_type?.toUpperCase() || 'PCC',
                isTeamTask: false,
            }));

            const combinedHistory = [...memberTasks, ...teamTasks].sort((a, b) => {
                if (!a.finished_at && !b.finished_at) return 0;
                if (!a.finished_at) return 1;
                if (!b.finished_at) return -1;
                return b.finished_at.localeCompare(a.finished_at);
            });

            setPointsHistory(combinedHistory);
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

    const buildAssigneeList = useCallback(
        (memberList, { selectedByDefault, defaultPoints, defaultType }) =>
            memberList.map((member) => ({
                username: member.username,
                name: member.name || member.username,
                selected: !!selectedByDefault,
                points: defaultPoints ?? '',
                type: defaultType ?? 'pcc',
            })),
        []
    );

    const updateAssigneesForTeam = useCallback(
        async (teamValue, basePoints, baseType) => {
            if (teamValue === INDIVIDUAL_OPTION) {
                setVisibleMembers(users);
                setAssignees(
                    buildAssigneeList(users, {
                        selectedByDefault: false,
                        defaultPoints: basePoints,
                        defaultType: baseType,
                    })
                );
                return;
            }

            if (!teamValue) {
                setVisibleMembers([]);
                setAssignees([]);
                return;
            }

            const selectedProject = projects.find((p) => p.name === teamValue);
            if (!selectedProject) {
                setVisibleMembers([]);
                setAssignees([]);
                return;
            }

            try {
                const participations = await getParticipations(selectedProject.slug);
                const participantUsernames = participations.map((p) => p.username);
                const memberList = users.filter((user) => participantUsernames.includes(user.username));

                setVisibleMembers(memberList);
                setAssignees(
                    buildAssigneeList(memberList, {
                        selectedByDefault: true,
                        defaultPoints: basePoints,
                        defaultType: baseType,
                    })
                );
            } catch (error) {
                console.error('Error fetching team members:', error);
                setVisibleMembers([]);
                setAssignees([]);
            }
        },
        [buildAssigneeList, projects, users]
    );

    useEffect(() => {
        if (!isModalOpen) return;
        updateAssigneesForTeam(formData.selectedTeam, formData.teamPoints, formData.teamType);
    }, [formData.selectedTeam, formData.teamPoints, formData.teamType, isModalOpen, updateAssigneesForTeam]);

    const handleCreateNew = async () => {
        setFormData({
            description: '',
            teamPoints: '',
            teamType: 'pcc',
            date: new Date().toISOString().split('T')[0],
            selectedTeam: INDIVIDUAL_OPTION,
        });
        await updateAssigneesForTeam(INDIVIDUAL_OPTION, '', 'pcc');
        setIsCreating(true);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleEditEntry = (entry) => {
        if (entry.isTeamTask) {
            setMessage('Editing team tasks is not supported. Please delete and recreate the entry if changes are needed.');
            return;
        }

        setFormData({
            description: entry.description || '',
            teamPoints: entry.points?.toString() || '',
            teamType: entry.point_type?.toLowerCase() || 'pcc',
            date: entry.finished_at ? new Date(entry.finished_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            selectedTeam: entry.project_name || INDIVIDUAL_OPTION,
        });
        setVisibleMembers(
            entry.username
                ? [{ username: entry.username, name: entry.username }]
                : []
        );
        setAssignees([
            {
                username: entry.username,
                name: entry.username,
                selected: true,
                points: entry.points?.toString() || '',
                type: entry.point_type?.toLowerCase() || 'pcc',
            },
        ]);
        setSelectedEntry(entry);
        setIsCreating(false);
        setIsModalOpen(true);
        setMessage('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'teamPoints') {
            const previousValue = formData.teamPoints;
            setFormData((prev) => ({
                ...prev,
                teamPoints: value,
            }));
            setAssignees((current) =>
                current.map((assignee) => {
                    if (!assignee.selected) return assignee;
                    if (assignee.points === '' || assignee.points === previousValue) {
                        return { ...assignee, points: value };
                    }
                    return assignee;
                })
            );
            return;
        }

        if (name === 'teamType') {
            const previousType = formData.teamType;
            setFormData((prev) => ({
                ...prev,
                teamType: value,
            }));
            setAssignees((current) =>
                current.map((assignee) => {
                    if (!assignee.selected) return assignee;
                    if (!assignee.type || assignee.type === previousType) {
                        return { ...assignee, type: value };
                    }
                    return assignee;
                })
            );
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'selectedTeam') {
            updateAssigneesForTeam(value, formData.teamPoints, formData.teamType);
        }
    };

    const handleAssigneeToggle = (username) => {
        setAssignees((current) =>
            current.map((assignee) => {
                if (assignee.username !== username) {
                    return assignee;
                }

                const shouldSelect = !assignee.selected;
                if (!shouldSelect) {
                    return { ...assignee, selected: false };
                }

                const nextPoints =
                    assignee.points === undefined || assignee.points === ''
                        ? formData.teamPoints || assignee.points || ''
                        : assignee.points;

                const nextType = assignee.type || formData.teamType || 'pcc';

                return {
                    ...assignee,
                    selected: true,
                    points: nextPoints,
                    type: nextType,
                };
            })
        );
    };

    const handleAssigneeFieldChange = (username, field, value) => {
        setAssignees((current) =>
            current.map((assignee) =>
                assignee.username === username
                    ? { ...assignee, [field]: value }
                    : assignee
            )
        );
    };

    const resolveProjectSlugForAssignee = useCallback(
        async (assignee, fallbackSlug) => {
            if (fallbackSlug) {
                return fallbackSlug;
            }

            if (memberParticipationCache.current[assignee.username]) {
                return memberParticipationCache.current[assignee.username];
            }

            try {
                const participations = await getMemberParticipations(assignee.username);
                if (!participations || participations.length === 0) {
                    return null;
                }

                const participation = participations[0];
                const projectName =
                    participation.project_name ||
                    participation.project?.name ||
                    participation.project_title ||
                    participation.project;

                const slug =
                    participation.project_slug ||
                    participation.project?.slug ||
                    (projectName
                        ? projects.find((project) => project.name === projectName)?.slug
                        : undefined);

                if (slug) {
                    memberParticipationCache.current[assignee.username] = slug;
                    return slug;
                }

                return null;
            } catch (error) {
                console.error(`Error fetching participations for ${assignee.username}:`, error);
                return null;
            }
        },
        [projects]
    );

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const description = formData.description.trim();
            if (!description) {
                setMessage('Description is required.');
                setSaving(false);
                return;
            }

            const selectedProject =
                formData.selectedTeam !== INDIVIDUAL_OPTION
                    ? projects.find((p) => p.name === formData.selectedTeam)
                    : null;

            if (!selectedProject && formData.selectedTeam !== INDIVIDUAL_OPTION) {
                setMessage('Selected team not found.');
                setSaving(false);
                return;
            }

            const selectedAssignees = assignees.filter((assignee) => assignee.selected);
            if (formData.selectedTeam === INDIVIDUAL_OPTION && selectedAssignees.length === 0) {
                setMessage('Please select at least one member.');
                setSaving(false);
                return;
            }

            const basePointType = (formData.teamType || 'pcc').toLowerCase();
            const normalizeType = (value) => (value || basePointType).toLowerCase();
            const normalizePoints = (value) => {
                const target = value !== '' ? value : formData.teamPoints;
                return parseInt(target, 10);
            };

            const basePoints = parseInt(formData.teamPoints, 10);
            const shouldCreateTeamTask =
                formData.selectedTeam !== INDIVIDUAL_OPTION &&
                !Number.isNaN(basePoints) &&
                basePoints !== 0 &&
                selectedProject;

            if (
                formData.selectedTeam !== INDIVIDUAL_OPTION &&
                (Number.isNaN(basePoints) || basePoints === 0)
            ) {
                setMessage('Please provide a non-zero point value for the team.');
                setSaving(false);
                return;
            }

            if (shouldCreateTeamTask) {
                await createTeamTask(selectedProject.slug, {
                    description,
                    points: basePoints,
                    point_type: basePointType,
                    finished_at: formData.date,
                    contributors: selectedAssignees.map((assignee) => assignee.username),
                });
            }

            let successCount = 0;
            let failCount = 0;

            for (const assignee of selectedAssignees) {
                const resolvedPoints = normalizePoints(assignee.points);
                if (Number.isNaN(resolvedPoints) || resolvedPoints === 0) {
                    console.warn(`Ignoring ${assignee.username} due to invalid points.`);
                    failCount++;
                    continue;
                }

                const slug = await resolveProjectSlugForAssignee(
                    assignee,
                    selectedProject?.slug
                );

                if (!slug) {
                    console.warn(`User ${assignee.username} has no associated project.`);
                    failCount++;
                    continue;
                }

                try {
                    await createTask(slug, {
                        description,
                        points: resolvedPoints,
                        point_type: normalizeType(assignee.type),
                        finished_at: formData.date,
                        username: assignee.username,
                    });
                    successCount++;
                } catch (taskError) {
                    console.error(`Failed to create task for ${assignee.username}:`, taskError);
                    failCount++;
                }
            }

            let feedback = '';
            if (shouldCreateTeamTask) {
                feedback += 'Team points recorded successfully. ';
            }
            if (successCount > 0) {
                feedback += `Points awarded to ${successCount} member(s).`;
                if (failCount > 0) {
                    feedback += ` (${failCount} member(s) skipped.)`;
                }
            } else if (!shouldCreateTeamTask) {
                feedback = 'No points were awarded. Please review your selections.';
            }

            setMessage(feedback.trim());
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving points entry:', error);
            setMessage(`Error saving points entry: ${error.response?.data?.description || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEntry) return;

        setSaving(true);
        setMessage('');

        try {
            const targetAssignee = assignees.find((assignee) => assignee.selected);
            if (!targetAssignee) {
                setMessage('Please select a user.');
                setSaving(false);
                return;
            }

            const resolvedPoints = targetAssignee.points || formData.teamPoints;
            const parsedPoints = parseInt(resolvedPoints, 10);

            if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
                setMessage('Please provide a valid points value.');
                setSaving(false);
                return;
            }

            await updateTask(selectedEntry.id, {
                description: formData.description.trim(),
                points: parsedPoints,
                point_type: (targetAssignee.type || formData.teamType || 'pcc').toLowerCase(),
                finished_at: formData.date,
                username: targetAssignee.username,
            });

            setMessage('Task updated successfully!');
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error updating points entry:', error);
            setMessage(`Error updating points entry: ${error.response?.data?.description || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entry) => {
        if (!window.confirm(`Are you sure you want to delete this points entry?`)) {
            return;
        }

        try {
            if (entry.isTeamTask) {
                await deleteTeamTask(entry.id);
                setMessage('Team task deleted successfully!');
            } else {
                await deleteTask(entry.id);
                setMessage('Task deleted successfully!');
            }
            await fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
            setMessage('Error deleting task');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
        setVisibleMembers([]);
        setAssignees([]);
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
        const normalized = (type || '').toUpperCase();
        if (normalized === 'PJ') return 'points-pj';
        if (normalized === 'PS') return 'points-ps';
        return 'points-pcc';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString('pt-PT');
        } catch (error) {
            return 'Invalid date';
        }
    };

    const selectedAssigneeCount = useMemo(
        () => assignees.filter((assignee) => assignee.selected).length,
        [assignees]
    );

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
                <div className={`alert ${message.toLowerCase().includes('error') ? 'alert-error' : 'alert-success'}`}>
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
                                    <th>Member(s)</th>
                                    <th>Team</th>
                                    <th>Description</th>
                                    <th>Points</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEntries.map((entry) => (
                                    <tr key={`${entry.isTeamTask ? 'team' : 'member'}-${entry.id}`}>
                                        <td>
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    {(entry.username || 'T').charAt(0).toUpperCase()}
                                                </div>
                                                <span>
                                                    {entry.isTeamTask
                                                        ? entry.username || 'Team task'
                                                        : entry.username || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{entry.project_name || 'No project'}</td>
                                        <td className="description-cell">{entry.description || 'No description'}</td>
                                        <td className="points-column">
                                            <span className={`points-badge ${getPointsTypeClass(entry.point_type)}`}>
                                                {entry.points || 0} {(entry.point_type || 'PCC').toUpperCase()}
                                            </span>
                                            {entry.isTeamTask && (
                                                <span className="team-task-tag">Team</span>
                                            )}
                                        </td>
                                        <td>{formatDate(entry.finished_at)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEditEntry(entry)}
                                                    disabled={entry.isTeamTask}
                                                    title={entry.isTeamTask ? 'Team tasks cannot be edited' : 'Edit entry'}
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
                size="large"
            >
                <form
                    onSubmit={isCreating ? handleCreateSubmit : handleUpdateSubmit}
                    className="points-form"
                >
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

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="teamPoints">
                                {formData.selectedTeam === INDIVIDUAL_OPTION ? 'Base Points' : 'Team Points'} *
                            </label>
                            <input
                                type="number"
                                id="teamPoints"
                                name="teamPoints"
                                value={formData.teamPoints}
                                onChange={handleChange}
                                onWheel={(e) => e.target.blur()}
                                step="1"
                                placeholder="25"
                                disabled={saving && !isCreating}
                            />
                            {formData.selectedTeam !== INDIVIDUAL_OPTION && (
                                <small className="form-help">
                                    These points will be attributed to the team. Members inherit this value by default.
                                </small>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="teamType">
                                {formData.selectedTeam === INDIVIDUAL_OPTION ? 'Base Point Type' : 'Team Point Type'} *
                            </label>
                            <select
                                id="teamType"
                                name="teamType"
                                value={formData.teamType}
                                onChange={handleChange}
                                disabled={saving && !isCreating}
                            >
                                <option value="pcc">PCC (Community Contribution)</option>
                                <option value="pj">PJ (Project Points)</option>
                                <option value="ps">PS (Special Points)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="selectedTeam">Team</label>
                        <select
                            id="selectedTeam"
                            name="selectedTeam"
                            value={formData.selectedTeam}
                            onChange={handleChange}
                            disabled={saving}
                        >
                            <option value={INDIVIDUAL_OPTION}>Individual Contribution</option>
                            {projects.map((project) => (
                                <option key={project.slug} value={project.name}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        {formData.selectedTeam === INDIVIDUAL_OPTION ? (
                            <small className="form-help">
                                Select any member(s) below. No team task will be created.
                            </small>
                        ) : (
                            <small className="form-help">
                                Optionally award both team points and individual points to team members.
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            {formData.selectedTeam === INDIVIDUAL_OPTION
                                ? 'Select Members to Receive Points'
                                : 'Select Team Members (optional)'}
                        </label>
                        {visibleMembers.length === 0 && assignees.length === 0 ? (
                            <p className="form-info">
                                {formData.selectedTeam === INDIVIDUAL_OPTION
                                    ? 'No members available.'
                                    : 'Please select a team to load its members.'}
                            </p>
                        ) : (
                            <div className="assignees-list">
                                {assignees.map((assignee) => (
                                    <div key={assignee.username} className={`assignee-row ${assignee.selected ? 'selected' : ''}`}>
                                        <label className="assignee-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={assignee.selected}
                                                onChange={() => handleAssigneeToggle(assignee.username)}
                                                disabled={saving}
                                            />
                                            <div className="assignee-info">
                                                <span className="assignee-name">{assignee.name}</span>
                                                <span className="assignee-username">@{assignee.username}</span>
                                            </div>
                                        </label>
                                        {assignee.selected && (
                                            <div className="assignee-inputs">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    placeholder={formData.teamPoints || '0'}
                                                    value={assignee.points}
                                                    onChange={(e) =>
                                                        handleAssigneeFieldChange(
                                                            assignee.username,
                                                            'points',
                                                            e.target.value
                                                        )
                                                    }
                                                    onWheel={(e) => e.target.blur()}
                                                    disabled={saving}
                                                />
                                                <select
                                                    value={assignee.type || formData.teamType}
                                                    onChange={(e) =>
                                                        handleAssigneeFieldChange(
                                                            assignee.username,
                                                            'type',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                >
                                                    <option value="pcc">PCC</option>
                                                    <option value="pj">PJ</option>
                                                    <option value="ps">PS</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isCreating && formData.selectedTeam === INDIVIDUAL_OPTION && selectedAssigneeCount === 0 && (
                            <small className="form-error">Please select at least one member.</small>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                saving ||
                                (isCreating && formData.selectedTeam === INDIVIDUAL_OPTION && selectedAssigneeCount === 0)
                            }
                        >
                            {saving
                                ? 'Saving...'
                                : isCreating
                                    ? `Award Points${selectedAssigneeCount > 1 ? ` to ${selectedAssigneeCount} Members` : ''}`
                                    : 'Update Entry'}
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
