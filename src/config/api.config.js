/**
 * API Configuration - Centralized config for all API endpoints
 * 
 * OPTION 1: Edit this file directly (easier for beginners)
 *   - Change HOST below to your domain or IP
 * 
 * OPTION 2: Use .env file (better for different environments)
 *   - Create .env file with REACT_APP_API_URL, REACT_APP_BACKEND_URL, etc.
 *   - See .env.example for template
 */

// Detect if we're on hackerleague.app (production via Cloudflare Tunnel)
const isProduction = typeof window !== 'undefined' && window.location.hostname === 'hackerschool.dev';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

// Production API endpoint
// If on hackerleague.app, use subdomains via HTTPS
// Otherwise, use localhost (development)
const getAPIHost = () => {
    // .env variable takes priority
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    
    // Production: use API subdomain via HTTPS
    if (isProduction) {
        return `${protocol}//api.hackerschool.dev`;
    }
    
    // Development: use localhost
    return 'http://localhost:8080';
};

const API_HOST = getAPIHost();

// Local backend configuration (adjust if running locally)
const LOCAL_HOST = 'localhost';
const NODE_BACKEND_PORT = '5000'; // Node.js backend

// Get backend URL
const getBackendURL = () => {
    // .env variable takes priority
    if (process.env.REACT_APP_BACKEND_URL) {
        return process.env.REACT_APP_BACKEND_URL;
    }
    
    // Production: use backend subdomain via HTTPS
    if (isProduction) {
        return `${protocol}//backend.hackerleague.app/api`;
    }
    
    // Development: use localhost
    return `http://${LOCAL_HOST}:${NODE_BACKEND_PORT}/api`;
};

// Get WebSocket URL
const getWebSocketURL = () => {
    // .env variable takes priority
    if (process.env.REACT_APP_WS_URL) {
        return process.env.REACT_APP_WS_URL;
    }
    
    // Production: use WSS (secure WebSocket) on backend subdomain
    if (isProduction) {
        return `wss://leagueback.hackerschool.dev`;
    }
    
    // Development: use WS (non-secure WebSocket)
    return `ws://${LOCAL_HOST}:${NODE_BACKEND_PORT}`;
};

// .env variables take priority over defaults
export const API_CONFIG = {
    FLASK_API_BASE_URL: API_HOST,
    NODE_BACKEND_BASE_URL: getBackendURL(),
    WEBSOCKET_URL: getWebSocketURL(),
    HOST: API_HOST,
    LOCAL_HOST,
    NODE_BACKEND_PORT,
};

console.log('🔧 API Config:', API_CONFIG.FLASK_API_BASE_URL, '|', API_CONFIG.NODE_BACKEND_BASE_URL);

export default API_CONFIG;

