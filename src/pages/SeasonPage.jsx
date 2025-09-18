import { useState, useEffect } from 'react';
import adminAPIService from '../services/adminAPIService';
import './SeasonPage.css';

const SeasonPage = () => {
    const [seasonData, setSeasonData] = useState({});
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
            console.error('Error loading Season data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading Season data...</div>;
    }

    return (
        <div className="season-container">
            <div className="season-header">
                <h1 className="season-title">{seasonData.currentSeason.title}</h1>
                <div className="season-intro">
                    <p className="intro-text">
                        {seasonData.currentSeason.description}
                    </p>
                </div>
            </div>

            {seasonData.communityGoal.isActive && (
                <div className="community-goal-section">
                    <h2 className="goal-title">{seasonData.communityGoal.title}</h2>
                    <div className="goal-card">
                        <div className="goal-description">
                            <span className="goal-text">{seasonData.communityGoal.goal}</span>
                        </div>
                        
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${seasonData.communityGoal.progressPercentage}%` }}
                                ></div>
                                <div className="progress-label">
                                    <span className="current-count">{seasonData.communityGoal.progressPercentage}%</span>
                                </div>
                            </div>
                            
                            <div className="progress-percentage">
                                <span className="percentage">{seasonData.communityGoal.progressPercentage}%</span>
                            </div>
                        </div>

                        <div className="final-prize-section">
                            <div className="prize-label">Final Prize</div>
                            <div className="prize-content">
                                <span className="prize-icon">🏆</span>
                                <span className="prize-text">{seasonData.communityGoal.finalPrize}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="season-stats">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-number">{seasonData.stats.activeHackers}</div>
                            <div className="stat-label">Active Hackers</div>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-content">
                            <div className="stat-number">{seasonData.stats.daysRemaining}</div>
                            <div className="stat-label">Days Remaining</div>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">⚡</div>
                        <div className="stat-content">
                            <div className="stat-number">{seasonData.stats.challengesSolved}</div>
                            <div className="stat-label">Challenges Solved</div>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-content">
                            <div className="stat-number">{seasonData.stats.communityEngagement}%</div>
                            <div className="stat-label">Community Engagement</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonPage;
