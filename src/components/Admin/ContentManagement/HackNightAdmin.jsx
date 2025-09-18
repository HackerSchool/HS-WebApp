import { useState, useEffect } from 'react';
import adminAPIService from '../../../services/adminAPIService';
import './ContentManagement.css';

const HackNightAdmin = () => {
    const [hacknightData, setHacknightData] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        
        // Listen for real-time updates
        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'hacknight') {
                setHacknightData(prev => ({
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
            const data = await adminAPIService.getHackNightData();
            setHacknightData(data);
        } catch (error) {
            setMessage('Error loading data. Please try again.');
            console.error('Error loading HackNight data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setHacknightData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            // Save all sections
            const sections = ['nextEvent', 'hackerChallenge', 'lastWinner', 'finalCall'];
            for (const section of sections) {
                await adminAPIService.updateHackNightData(section, hacknightData[section]);
            }
            
            setMessage('HackNight data saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving data. Please try again.');
            console.error('Error saving HackNight data:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading HackNight data...</div>;
    }

    return (
        <div className="content-management">
            <div className="content-header">
                <h2>🌙 HackNight Management</h2>
                <p>Manage the next HackNight event and related content</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="sections-grid">
                {/* Next Event Section */}
                <div className="section-card full-width">
                    <div className="section-header">
                        <span className="section-icon">📅</span>
                        <h3>Next HackNight Event</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.nextEvent.isActive}
                                onChange={(e) => handleInputChange('nextEvent', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Event Name</label>
                            <input
                                type="text"
                                value={hacknightData.nextEvent.name}
                                onChange={(e) => handleInputChange('nextEvent', 'name', e.target.value)}
                                placeholder="e.g., HackNight Setembro"
                            />
                        </div>

                        <div className="form-group">
                            <label>Event Date & Time</label>
                            <input
                                type="datetime-local"
                                value={hacknightData.nextEvent.date}
                                onChange={(e) => handleInputChange('nextEvent', 'date', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmed Hackers</label>
                            <input
                                type="number"
                                value={hacknightData.nextEvent.confirmedHackers}
                                onChange={(e) => handleInputChange('nextEvent', 'confirmedHackers', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* HackerChallenge Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <h3>HackerChallenge</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.hackerChallenge.isActive}
                                onChange={(e) => handleInputChange('hackerChallenge', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={hacknightData.hackerChallenge.title}
                            onChange={(e) => handleInputChange('hackerChallenge', 'title', e.target.value)}
                            placeholder="HackerChallenge"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={hacknightData.hackerChallenge.description}
                            onChange={(e) => handleInputChange('hackerChallenge', 'description', e.target.value)}
                            placeholder="Challenge description..."
                            rows="4"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={hacknightData.hackerChallenge.status}
                            onChange={(e) => handleInputChange('hackerChallenge', 'status', e.target.value)}
                        >
                            <option value="Coming Soon">Coming Soon</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Last Winner Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">🏆</span>
                        <h3>Last Winner</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.lastWinner.isActive}
                                onChange={(e) => handleInputChange('lastWinner', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Winner Name</label>
                        <input
                            type="text"
                            value={hacknightData.lastWinner.name}
                            onChange={(e) => handleInputChange('lastWinner', 'name', e.target.value)}
                            placeholder="Winner name or leave empty for 'No winners yet'"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={hacknightData.lastWinner.description}
                            onChange={(e) => handleInputChange('lastWinner', 'description', e.target.value)}
                            placeholder="Winner description or default message"
                            rows="3"
                        />
                    </div>
                </div>

                {/* Final Call Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">⚡</span>
                        <h3>Final Call to Action</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.finalCall.isActive}
                                onChange={(e) => handleInputChange('finalCall', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={hacknightData.finalCall.title}
                            onChange={(e) => handleInputChange('finalCall', 'title', e.target.value)}
                            placeholder="e.g., X-Biters are still on the loose!"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={hacknightData.finalCall.description}
                            onChange={(e) => handleInputChange('finalCall', 'description', e.target.value)}
                            placeholder="Call to action description..."
                            rows="4"
                        />
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

export default HackNightAdmin;
