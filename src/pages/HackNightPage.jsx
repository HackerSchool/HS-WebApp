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

            {/* Last Winner Section - Right below header */}
            <div className="last-winner-section">
                <h2 className="section-title">🏆 Last Winner</h2>
                {hacknightData.lastWinner?.isActive && hacknightData.lastWinner?.name ? (
                    <div className="winner-card victorious">
                        <div className="victory-banner">
                            <div className="confetti"></div>
                            <div className="trophy-icon">🏆</div>
                            <h3 className="winner-name">{hacknightData.lastWinner.name}</h3>
                            <div className="victory-ribbon">CHAMPION</div>
                            <div className="celebration-effects">
                                <span className="sparkle">✨</span>
                                <span className="sparkle">⭐</span>
                                <span className="sparkle">💫</span>
                                <span className="sparkle">🌟</span>
                            </div>
                        </div>
                        <div className="winner-description">
                            <p>{hacknightData.lastWinner.description}</p>
                        </div>
                    </div>
                ) : (
                    <div className="winner-card empty">
                        <div className="empty-state">
                            <span className="empty-icon">🎖️</span>
                            <p className="empty-text">
                                {hacknightData.lastWinner?.description || 'No winners yet - be the first!'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Announcement and Photoshoot side by side */}
            <div className="announcement-photoshoot-container">
                {hacknightData.hackerChallenge?.isActive && (
                    <div className="announcement-section">
                        <h2 className="section-title">🎯 {hacknightData.hackerChallenge.title}</h2>
                        <div className="challenge-card">
                            <p className="challenge-description">
                                {hacknightData.hackerChallenge.description}
                            </p>
                            <div className="challenge-status">
                                <span className="status-badge coming-soon">{hacknightData.hackerChallenge.status}</span>
                            </div>
                            {hacknightData.hackerChallenge.buttonUrl && (
                                <a 
                                    href={hacknightData.hackerChallenge.buttonUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-primary challenge-button"
                                >
                                    {hacknightData.hackerChallenge.buttonText || 'Learn More'}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                <div className="photoshoot-section">
                    <h2 className="section-title">📸 {hacknightData.photoshoot?.title || 'Last HackNight Photoshoot'}</h2>
                    <div className="photoshoot-card">
                        <div className="camera-icon">📷</div>
                        <p className="photoshoot-message">
                            {hacknightData.photoshoot?.message || 'Coming soon :))'}
                        </p>
                        {hacknightData.photoshoot?.galleryUrl && (
                            <a 
                                href={hacknightData.photoshoot.galleryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary gallery-button"
                            >
                                View Gallery
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Final Call Section - Last */}
            {hacknightData.finalCall?.isActive && (
                <div className="final-call-section">
                    <div className="call-to-action">
                        <h2 className="call-title">⚡ {hacknightData.finalCall.title}</h2>
                        <p className="call-description">
                            {hacknightData.finalCall.description}
                        </p>
                        {hacknightData.finalCall.buttonUrl ? (
                            <a 
                                href={hacknightData.finalCall.buttonUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary join-button"
                            >
                                {hacknightData.finalCall.buttonText || 'Join the Hunt'}
                            </a>
                        ) : (
                            <button className="btn btn-primary join-button" disabled>
                                {hacknightData.finalCall.buttonText || 'Join the Hunt'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HackNightPage;
