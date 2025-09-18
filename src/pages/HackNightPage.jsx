import { useState, useEffect } from 'react';
import adminAPIService from '../services/adminAPIService';
import './HackNightPage.css';

const HackNightPage = () => {
    const [hacknightData, setHacknightData] = useState({});
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        
        // Connect WebSocket for real-time updates (public page needs this)
        adminAPIService.connectWebSocket('HackNightPage');
        
        // Listen for real-time updates
        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'hacknight') {
                setHacknightData(prev => ({
                    ...prev,
                    [updateData.key]: updateData.data
                }));
            }
        });

        return () => {
            unsubscribe();
            // Don't disconnect WebSocket here - other pages might need it
            // WebSocket will be disconnected when user leaves the app entirely
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await adminAPIService.getHackNightData();
            setHacknightData(data);
        } catch (error) {
            console.error('Error loading HackNight data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Calculate time until next event
        const calculateTimeLeft = () => {
            if (hacknightData.nextEvent?.isActive && hacknightData.nextEvent?.date) {
                const timeUntil = adminAPIService.getTimeUntilEvent(hacknightData.nextEvent.date);
                setTimeLeft(timeUntil);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [hacknightData.nextEvent?.date, hacknightData.nextEvent?.isActive]);

    if (loading) {
        return <div className="loading">Loading HackNight data...</div>;
    }

    return (
        <div className="hacknight-container">
            <div className="hacknight-header">
                <h1 className="hacknight-title">
                    Next HackNight: {hacknightData.nextEvent.name}
                </h1>
                
                <div className="countdown-section">
                    <div className="countdown-display">
                        <div className="time-unit">
                            <span className="time-number">{timeLeft.days}</span>
                            <span className="time-label">Days</span>
                        </div>
                        <div className="time-unit">
                            <span className="time-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
                            <span className="time-label">Hours</span>
                        </div>
                        <div className="time-unit">
                            <span className="time-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                            <span className="time-label">Minutes</span>
                        </div>
                        <div className="time-unit">
                            <span className="time-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                            <span className="time-label">Seconds</span>
                        </div>
                    </div>
                    <p className="countdown-text">To Go</p>
                </div>

                <div className="confirmed-hackers">
                    <span className="hackers-count">{hacknightData.nextEvent.confirmedHackers}</span>
                    <span className="hackers-label">Confirmed Hackers (updating)</span>
                </div>
            </div>

            <div className="hacknight-content">
                {hacknightData.hackerChallenge.isActive && (
                    <div className="announcement-section">
                        <h2 className="section-title">🎯 {hacknightData.hackerChallenge.title}</h2>
                        <div className="challenge-card">
                            <p className="challenge-description">
                                {hacknightData.hackerChallenge.description}
                            </p>
                            <div className="challenge-status">
                                <span className="status-badge coming-soon">{hacknightData.hackerChallenge.status}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="last-winner-section">
                    <h2 className="section-title">🏆 Last Winner</h2>
                    <div className="winner-card empty">
                        <div className="empty-state">
                            <span className="empty-icon">🎖️</span>
                            <p className="empty-text">
                                {hacknightData.lastWinner.isActive && hacknightData.lastWinner.name 
                                    ? `${hacknightData.lastWinner.name} - ${hacknightData.lastWinner.description}`
                                    : hacknightData.lastWinner.description
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {hacknightData.finalCall.isActive && (
                    <div className="final-call-section">
                        <div className="call-to-action">
                            <h2 className="call-title">⚡ {hacknightData.finalCall.title}</h2>
                            <p className="call-description">
                                {hacknightData.finalCall.description}
                            </p>
                            <button className="btn btn-primary join-button">
                                Join the Hunt
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HackNightPage;
