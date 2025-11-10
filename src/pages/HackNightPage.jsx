import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import adminAPIService from '../services/adminAPIService';
import useHacknightStatus from '../hooks/useHacknightStatus';
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
    const navigate = useNavigate();
    const { status: hacknightStatus } = useHacknightStatus({ pollingInterval: 20000 });

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

    const hasEventStarted = useMemo(() => {
        if (!hacknightData.nextEvent?.date) return false;
        return new Date(hacknightData.nextEvent.date) <= new Date();
    }, [hacknightData.nextEvent?.date]);

    const showCheckInButton = hasEventStarted && hacknightStatus?.state?.checkinsOpen;

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

                {showCheckInButton && (
                    <button
                        type="button"
                        className="hacknight-checkin-button"
                        onClick={() => navigate('/hacknight/vote')}
                    >
                        Check-In
                    </button>
                )}
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
        </div>
    );
};

export default HackNightPage;
