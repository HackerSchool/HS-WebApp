// WebSocket Status Component for debugging
import { useState, useEffect } from 'react';
import adminAPIService from '../services/adminAPIService';

const WebSocketStatus = () => {
    const [status, setStatus] = useState('disconnected');
    const [connectionCount, setConnectionCount] = useState(0);

    useEffect(() => {
        const checkStatus = () => {
            setStatus(adminAPIService.isConnected ? 'connected' : 'disconnected');
            setConnectionCount(adminAPIService.connectionCount);
        };

        const interval = setInterval(checkStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: status === 'connected' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
        }}>
            WebSocket: {status} ({connectionCount} users)
        </div>
    );
};

export default WebSocketStatus;
