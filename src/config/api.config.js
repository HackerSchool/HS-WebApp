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

// Production API endpoint
const API_HOST = 'https://api.hackerschool.dev';

// Local backend configuration (adjust if running locally)
const LOCAL_HOST = 'localhost';
const NODE_BACKEND_PORT = '5000'; // Node.js backend

// .env variables take priority over defaults
export const API_CONFIG = {
    FLASK_API_BASE_URL: process.env.REACT_APP_API_URL || API_HOST,
    NODE_BACKEND_BASE_URL: process.env.REACT_APP_BACKEND_URL || `http://${LOCAL_HOST}:${NODE_BACKEND_PORT}/api`,
    WEBSOCKET_URL: process.env.REACT_APP_WS_URL || `ws://${LOCAL_HOST}:${NODE_BACKEND_PORT}`,
    HOST: API_HOST,
    LOCAL_HOST,
    NODE_BACKEND_PORT,
};

console.log('🔧 API Config:', API_CONFIG.FLASK_API_BASE_URL, '|', API_CONFIG.NODE_BACKEND_BASE_URL);

export default API_CONFIG;

