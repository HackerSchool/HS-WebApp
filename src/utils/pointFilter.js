/**
 * Utility functions for filtering and hiding PS (Problem Solving) points
 * PS points are secret and must not be shown in any table or display
 */

/**
 * Filter out PS points from an array of tasks/entries
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Filtered array without PS points
 */
export const filterOutPSPoints = (tasks) => {
    if (!Array.isArray(tasks)) return [];
    
    return tasks.filter(task => {
        // Check various possible field names for PS points
        const pointType = task.point_type || task.pointType || task.type || '';
        const description = task.description || '';
        const category = task.category || '';
        
        // Hide if it's explicitly PS
        if (pointType.toLowerCase().includes('ps') || 
            pointType.toLowerCase().includes('problem solving')) {
            return false;
        }
        
        // Hide if description mentions PS
        if (description.toLowerCase().includes('ps') ||
            description.toLowerCase().includes('problem solving')) {
            return false;
        }
        
        // Hide if category is PS
        if (category.toLowerCase().includes('ps') ||
            category.toLowerCase().includes('problem solving')) {
            return false;
        }
        
        return true;
    });
};

/**
 * Filter out PS points from leaderboard data
 * @param {Object} leaderboardData - Leaderboard data object
 * @returns {Object} Filtered leaderboard data
 */
export const filterLeaderboardPSPoints = (leaderboardData) => {
    if (!leaderboardData) return leaderboardData;
    
    const filtered = { ...leaderboardData };
    
    // Filter team history
    if (filtered.teamHistory) {
        Object.keys(filtered.teamHistory).forEach(teamName => {
            filtered.teamHistory[teamName] = filterOutPSPoints(filtered.teamHistory[teamName]);
        });
    }
    
    // Filter individual history
    if (filtered.individualHistory) {
        Object.keys(filtered.individualHistory).forEach(memberName => {
            filtered.individualHistory[memberName] = filterOutPSPoints(filtered.individualHistory[memberName]);
        });
    }
    
    return filtered;
};

/**
 * Check if a point type is PS (Problem Solving)
 * @param {string} pointType - The point type to check
 * @returns {boolean} True if it's PS, false otherwise
 */
export const isPSPoint = (pointType) => {
    if (!pointType) return false;
    
    const type = pointType.toLowerCase();
    return type.includes('ps') || type.includes('problem solving');
};

/**
 * Get a safe display name for point types (replace PS with generic name)
 * @param {string} pointType - The original point type
 * @returns {string} Safe display name
 */
export const getSafePointTypeName = (pointType) => {
    if (!pointType) return '';
    
    if (isPSPoint(pointType)) {
        return 'Special Task'; // Generic replacement for PS points
    }
    
    return pointType;
};

/**
 * Filter user points to exclude PS points
 * @param {Array} userPoints - Array of user point entries
 * @returns {Array} Filtered array without PS points
 */
export const filterUserPoints = (userPoints) => {
    return filterOutPSPoints(userPoints);
};

/**
 * Filter project points to exclude PS points
 * @param {Array} projectPoints - Array of project point entries
 * @returns {Array} Filtered array without PS points
 */
export const filterProjectPoints = (projectPoints) => {
    return filterOutPSPoints(projectPoints);
};

/**
 * Filter task data to exclude PS points
 * @param {Array} tasks - Array of task data
 * @returns {Array} Filtered array without PS points
 */
export const filterTaskData = (tasks) => {
    return filterOutPSPoints(tasks);
};

/**
 * Apply PS point filtering to any data structure
 * This is a general-purpose function that can be used throughout the app
 * @param {*} data - Any data structure that might contain PS points
 * @returns {*} Filtered data structure
 */
export const applyPSPointFilter = (data) => {
    if (Array.isArray(data)) {
        return filterOutPSPoints(data);
    }
    
    if (data && typeof data === 'object') {
        // If it's an object, try to filter common array properties
        const filtered = { ...data };
        
        // Common property names that might contain arrays of points/tasks
        const arrayProperties = [
            'tasks', 'points', 'entries', 'activities', 'history',
            'teamHistory', 'individualHistory', 'userPoints', 'projectPoints'
        ];
        
        arrayProperties.forEach(prop => {
            if (Array.isArray(filtered[prop])) {
                filtered[prop] = filterOutPSPoints(filtered[prop]);
            }
        });
        
        return filtered;
    }
    
    return data;
};
