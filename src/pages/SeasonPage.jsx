import { useState, useEffect } from 'react';
import adminAPIService from '../services/adminAPIService';
import './SeasonPage.css';

const SeasonPage = () => {
    const [seasonData, setSeasonData] = useState({});
    const [hacknightExtras, setHacknightExtras] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'season') {
                setSeasonData(prev => ({
                    ...prev,
                    [updateData.key]: updateData.data
                }));
            }
            if (updateData.type === 'hacknight') {
                setHacknightExtras(prev => ({
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
            const [season, hacknight] = await Promise.all([
                adminAPIService.getSeasonData(),
                adminAPIService.getHackNightData()
            ]);
            setSeasonData(season);
            setHacknightExtras({
                finalCall: hacknight.finalCall,
                hackerChallenge: hacknight.hackerChallenge
            });
        } catch (error) {
            console.error('Error loading Season data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading Season data...</div>;
    }

    const finalCall = hacknightExtras.finalCall;
    const hackerChallenge = hacknightExtras.hackerChallenge;

    return (
        <div className="season-container">
            <div className="season-top-grid">
                {finalCall?.isActive && (
                    <div className="final-call-section">
                        <div className="call-to-action">
                            <h2 className="call-title">⚡ {finalCall.title}</h2>
                            <p className="call-description">
                                {finalCall.description}
                            </p>
                            {finalCall.buttonUrl ? (
                                <a
                                    href={finalCall.buttonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary join-button"
                                >
                                    {finalCall.buttonText || 'Join the Hunt'}
                                </a>
                            ) : (
                                <button className="btn btn-primary join-button" disabled>
                                    {finalCall.buttonText || 'Join the Hunt'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {hackerChallenge?.isActive && (
                    <div className="announcement-section">
                        <h2 className="section-title">🎯 {hackerChallenge.title}</h2>
                        <div className="challenge-card">
                            <p className="challenge-description">
                                {hackerChallenge.description}
                            </p>
                            {hackerChallenge.statusLabel && (
                                <div className="challenge-status">
                                    <span className={`status-badge ${hackerChallenge.status || 'coming-soon'}`}>
                                        {hackerChallenge.statusLabel}
                                    </span>
                                </div>
                            )}
                            {hackerChallenge.buttonUrl && (
                                <a
                                    href={hackerChallenge.buttonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary challenge-button"
                                >
                                    {hackerChallenge.buttonText || 'Learn More'}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {seasonData.communityGoal?.isActive && (
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
                            <div className="stat-number">{seasonData.stats.activeParticipants}</div>
                            <div className="stat-label">Active Participants</div>
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
                            <div className="stat-number">{seasonData.stats.tasksSolved}</div>
                            <div className="stat-label">Tasks Solved</div>
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
