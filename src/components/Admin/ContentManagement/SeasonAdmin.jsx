import { useState, useEffect } from 'react';
import adminAPIService from '../../../services/adminAPIService';
import './ContentManagement.css';

const SeasonAdmin = () => {
    const [seasonData, setSeasonData] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        
        // Listen for real-time updates
        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'season') {
                setSeasonData(prev => ({
                    ...prev,
                    [updateData.key]: updateData.data
                }));
            }
        });

        return unsubscribe;
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await adminAPIService.getSeasonData();
            setSeasonData(data);
        } catch (error) {
            setMessage('Error loading data. Please try again.');
            console.error('Error loading Season data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setSeasonData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleStatsChange = (field, value) => {
        setSeasonData(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            // Save all sections
            const sections = ['communityGoal', 'stats'];
            for (const section of sections) {
                await adminAPIService.updateSeasonData(section, seasonData[section]);
            }
            
            setMessage('Season data saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving data. Please try again.');
            console.error('Error saving Season data:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading Season data...</div>;
    }


    return (
        <div className="content-management">
            <div className="content-header">
                <h2>🏆 Season Management</h2>
                <p>Manage the current season information and community goals</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="sections-grid">
                {/* Community Goal Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <h3>Community Goal</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={seasonData.communityGoal.isActive}
                                onChange={(e) => handleInputChange('communityGoal', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <input
                            type="text"
                            value={seasonData.communityGoal.title}
                            onChange={(e) => handleInputChange('communityGoal', 'title', e.target.value)}
                            placeholder="e.g., Community Goal"
                        />
                    </div>

                    <div className="form-group">
                        <label>Goal Description</label>
                        <input
                            type="text"
                            value={seasonData.communityGoal.goal}
                            onChange={(e) => handleInputChange('communityGoal', 'goal', e.target.value)}
                            placeholder="e.g., 30 Hackers @ HackNight"
                        />
                    </div>

                    <div className="form-group">
                        <label>Progress Percentage (%)</label>
                        <input
                            type="number"
                            value={seasonData.communityGoal.progressPercentage}
                            onChange={(e) => handleInputChange('communityGoal', 'progressPercentage', parseInt(e.target.value) || 0)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Final Prize</label>
                        <input
                            type="text"
                            value={seasonData.communityGoal.finalPrize}
                            onChange={(e) => handleInputChange('communityGoal', 'finalPrize', e.target.value)}
                            placeholder="e.g., Legendary Surprise Final Prize"
                        />
                    </div>

                    <div className="progress-preview">
                        <div className="progress-label">
                            Progress: {seasonData.communityGoal.progressPercentage}%
                        </div>
                        <div className="progress-bar-preview">
                            <div 
                                className="progress-fill-preview"
                                style={{ width: `${seasonData.communityGoal.progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">📊</span>
                        <h3>Season Statistics</h3>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                        <label>Active Participants</label>
                            <input
                                type="number"
                                value={seasonData.stats.activeParticipants}
                                onChange={(e) => handleStatsChange('activeParticipants', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Days Remaining</label>
                            <input
                                type="number"
                                value={seasonData.stats.daysRemaining}
                                onChange={(e) => handleStatsChange('daysRemaining', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                        <label>Tasks Solved</label>
                            <input
                                type="number"
                                value={seasonData.stats.tasksSolved}
                                onChange={(e) => handleStatsChange('tasksSolved', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Community Engagement (%)</label>
                            <input
                                type="number"
                                value={seasonData.stats.communityEngagement}
                                onChange={(e) => handleStatsChange('communityEngagement', parseInt(e.target.value) || 0)}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
};

export default SeasonAdmin;
