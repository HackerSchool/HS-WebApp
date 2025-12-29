import { useState, useEffect } from 'react';
import adminAPIService from '../../../services/adminAPIService';
import './ContentManagement.css';

const HallOfFameAdmin = () => {
    const [hallOfFameData, setHallOfFameData] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        
        // Connect WebSocket for real-time updates (admin needs this)
        adminAPIService.connectWebSocket();
        
        // Listen for real-time updates
        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'hallOfFame') {
                setHallOfFameData(prev => ({
                    ...prev,
                    [updateData.key]: updateData.data
                }));
            }
        });

        return () => {
            unsubscribe();
            // Don't disconnect WebSocket here - other admin components might need it
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await adminAPIService.getHallOfFameData();
            setHallOfFameData(data);
        } catch (error) {
            setMessage('Error loading data. Please try again.');
            console.error('Error loading Hall of Fame data:', error);
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { key: 'pitchDoMes', label: 'Pitch do Mês', icon: '🎯' },
        { key: 'estrelaEmAscensao', label: 'Estrela em Ascensão', icon: '⭐' },
        { key: 'hackerDoMes', label: 'Hacker do Mês', icon: '👨‍💻' },
        { key: 'equipaDoMes', label: 'Equipa do Mês', icon: '👥' }
    ];

    const handleInputChange = (section, field, value) => {
        setHallOfFameData(prev => ({
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
            for (const section of sections) {
                if (hallOfFameData[section.key]) {
                    await adminAPIService.updateHallOfFameData(section.key, hallOfFameData[section.key]);
                }
            }
            
            setMessage('Hall of Fame data saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving data. Please try again.');
            console.error('Error saving Hall of Fame data:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading Hall of Fame data...</div>;
    }

    return (
        <div className="content-management">
            <div className="content-header">
                <h2>🏆 Hall of Fame Management</h2>
                <p>Manage the featured users and teams in the Hall of Fame</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}

            <div className="sections-grid">
                {sections.map(section => (
                    <div key={section.key} className="section-card">
                        <div className="section-header">
                            <span className="section-icon">{section.icon}</span>
                            <h3>{section.label}</h3>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={hallOfFameData[section.key]?.isActive || false}
                                    onChange={(e) => handleInputChange(section.key, 'isActive', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Name/Title</label>
                            <input
                                type="text"
                                value={hallOfFameData[section.key]?.name || ''}
                                onChange={(e) => handleInputChange(section.key, 'name', e.target.value)}
                                placeholder={`Enter ${section.label} name`}
                            />
                        </div>

                        <div className="form-group">
                            <label>Points</label>
                            <input
                                type="number"
                                value={hallOfFameData[section.key]?.points || 0}
                                onChange={(e) => handleInputChange(section.key, 'points', parseInt(e.target.value) || 0)}
                                placeholder="Enter points"
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={hallOfFameData[section.key]?.description || ''}
                                onChange={(e) => handleInputChange(section.key, 'description', e.target.value)}
                                placeholder={`Enter description for ${section.label}`}
                                rows="3"
                            />
                        </div>
                    </div>
                ))}
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

export default HallOfFameAdmin;
