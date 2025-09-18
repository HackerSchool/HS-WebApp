// API Service for Admin Data Management
// This service handles communication with the backend server

class AdminAPIService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        this.ws = null;
        this.listeners = [];
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectionCount = 0; // Track how many components are using WebSocket
        this.connectionSources = new Set(); // Track which components are connected
    }

    // Connect WebSocket with source tracking
    connectWebSocket(source = 'unknown') {
        this.connectionSources.add(source);
        this.connectionCount = this.connectionSources.size;
        
        console.log(`🔌 WebSocket connection requested by: ${source} (${this.connectionCount} total connections)`);
        
        if (this.ws && this.isConnected) {
            console.log('🔌 WebSocket already connected, skipping new connection');
            return; // Already connected
        }

        const wsURL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        this.ws = new WebSocket(wsURL);

        this.ws.onopen = () => {
            console.log('🔌 Connected to WebSocket server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'admin_data_update') {
                    this.notifyListeners(message.data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('🔌 WebSocket connection closed');
            this.isConnected = false;
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
        };
    }

    // Disconnect WebSocket with source tracking
    disconnectWebSocket(source = 'unknown') {
        this.connectionSources.delete(source);
        this.connectionCount = this.connectionSources.size;
        
        console.log(`🔌 WebSocket disconnection requested by: ${source} (${this.connectionCount} remaining connections)`);
        
        if (this.connectionCount === 0 && this.ws) {
            console.log('🔌 No more connections needed - disconnecting WebSocket to save resources');
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        } else if (this.connectionCount > 0) {
            console.log('🔌 Other components still need WebSocket - keeping connection alive');
        }
    }

    // Attempt to reconnect with exponential backoff
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            console.log('❌ Max reconnection attempts reached. WebSocket will not reconnect.');
        }
    }

    addUpdateListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in update listener:', error);
            }
        });
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get all admin data
    async getAllData() {
        return await this.makeRequest('/admin-data');
    }

    // Get specific data type
    async getDataByType(type) {
        return await this.makeRequest(`/admin-data/${type}`);
    }

    // Update specific data
    async updateData(type, key, data) {
        return await this.makeRequest(`/admin-data/${type}/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ data })
        });
    }

    // Hall of Fame methods
    async getHallOfFameData() {
        return await this.getDataByType('hallOfFame');
    }

    async updateHallOfFameData(section, data) {
        return await this.updateData('hallOfFame', section, data);
    }

    // HackNight methods
    async getHackNightData() {
        return await this.getDataByType('hacknight');
    }

    async updateHackNightData(section, data) {
        return await this.updateData('hacknight', section, data);
    }

    // Season methods
    async getSeasonData() {
        return await this.getDataByType('season');
    }

    async updateSeasonData(section, data) {
        return await this.updateData('season', section, data);
    }

    // Utility methods
    getTimeUntilEvent(eventDate) {
        const now = new Date();
        const event = new Date(eventDate);
        const diff = event - now;

        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }

    calculateProgressPercentage(current, target) {
        return Math.min(Math.round((current / target) * 100), 100);
    }

    // Health check
    async healthCheck() {
        return await this.makeRequest('/health');
    }
}

// Create singleton instance
const adminAPIService = new AdminAPIService();

export default adminAPIService;
