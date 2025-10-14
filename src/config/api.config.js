/**
 * API Configuration - Centralized config for all API endpoints
 * 
 * OPTION 1: Edit this file directly (easier for beginners)
 *   - Change HOST below to your PC's IP (e.g., '10.212.169.150')
 * 
 * OPTION 2: Use .env file (better for different environments)
 *   - Create .env file with REACT_APP_API_URL, REACT_APP_BACKEND_URL, etc.
 *   - See .env.example for template
 */

// 👇 CHANGE THIS to localhost or your PC's IP for network access (e.g., '10.212.169.150')
const HOST = '10.212.169.150';

const FLASK_API_PORT = '8080';  // Flask API (HS-API)
const NODE_BACKEND_PORT = '5000'; // Node.js backend

// .env variables take priority over defaults
export const API_CONFIG = {
    FLASK_API_BASE_URL: process.env.REACT_APP_API_URL || `http://${HOST}:${FLASK_API_PORT}`,
    NODE_BACKEND_BASE_URL: process.env.REACT_APP_BACKEND_URL || `http://${HOST}:${NODE_BACKEND_PORT}/api`,
    WEBSOCKET_URL: process.env.REACT_APP_WS_URL || `ws://${HOST}:${NODE_BACKEND_PORT}`,
    HOST,
    FLASK_API_PORT,
    NODE_BACKEND_PORT,
};

console.log('🔧 API Config:', API_CONFIG.FLASK_API_BASE_URL, '|', API_CONFIG.NODE_BACKEND_BASE_URL);

export default API_CONFIG;

