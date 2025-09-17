const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export async function apiRequest(endpoint, method = 'GET', body = null, includeCredentials = true) {
    const options = {
        method,
        headers: { 
            'Content-Type': 'application/json',
        },
        credentials: includeCredentials ? 'include' : 'omit',
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error(`API request failed: ${error.message}`);
        throw error;
    }
}

// Auth API functions
export const authAPI = {
    login: async (username, password) => {
        return apiRequest('/login', 'POST', { username, password });
    },
    
    logout: async () => {
        return apiRequest('/logout', 'POST');
    },
    
    checkAuth: async () => {
        return apiRequest('/auth/check');
    }
};

// User API functions
export const userAPI = {
    getAllUsers: async () => {
        return apiRequest('/members');
    },
    
    getUser: async (username) => {
        return apiRequest(`/members/${username}`);
    },
    
    getUserRoles: async (username) => {
        return apiRequest(`/members/${username}/roles`);
    },
    
    registerUser: async (userData) => {
        return apiRequest('/members/register', 'POST', userData);
    },
    
    updateUser: async (username, userData) => {
        return apiRequest(`/members/${username}`, 'PUT', userData);
    },
    
    uploadUserLogo: async (username, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${apiBaseUrl}/members/${username}/logo`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return response.json();
    },
    
    getUserLogo: async (username) => {
        const response = await fetch(`${apiBaseUrl}/members/${username}/logo`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch logo: ${response.statusText}`);
        }
        
        return response.blob();
    }
};

// Leaderboard API functions
export const leaderboardAPI = {
    getTeams: async () => {
        return apiRequest('/leaderboard/teams');
    },
    
    getIndividuals: async () => {
        return apiRequest('/leaderboard/individuals');
    },
    
    getStats: async () => {
        return apiRequest('/leaderboard/stats');
    },
    
    getTeamHistory: async (teamName, limit = 3) => {
        return apiRequest(`/history/${teamName}?limit=${limit}`);
    },
    
    getAllHistory: async () => {
        return apiRequest('/history');
    }
};

// Admin API functions
export const adminAPI = {
    createUser: async (userData) => {
        return apiRequest('/admin/users', 'POST', userData);
    },
    
    updateUser: async (userId, userData) => {
        return apiRequest(`/admin/users/${userId}`, 'PUT', userData);
    },
    
    deleteUser: async (userId) => {
        return apiRequest(`/admin/users/${userId}`, 'DELETE');
    },
    
    getProjects: async () => {
        return apiRequest('/admin/projects');
    },
    
    createProject: async (projectData) => {
        return apiRequest('/admin/projects', 'POST', projectData);
    },
    
    updateProject: async (projectId, projectData) => {
        return apiRequest(`/admin/projects/${projectId}`, 'PUT', projectData);
    },
    
    deleteProject: async (projectId) => {
        return apiRequest(`/admin/projects/${projectId}`, 'DELETE');
    }
}; 