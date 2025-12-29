// Admin Data Management Service
// This service manages all admin-controlled dynamic content

class AdminDataService {
    constructor() {
        this.storageKey = 'hacker_league_admin_data';
        this.defaultData = this.getDefaultData();
        this.data = this.loadData();
    }

    getDefaultData() {
        return {
            hallOfFame: {
                pitchDoMes: {
                    name: '',
                    points: 0,
                    description: '',
                    isActive: false
                },
                estrelaEmAscensao: {
                    name: '',
                    points: 0,
                    description: '',
                    isActive: false
                },
                hackerDoMes: {
                    name: '',
                    points: 0,
                    description: '',
                    isActive: false
                },
                equipaDoMes: {
                    name: '',
                    points: 0,
                    description: '',
                    isActive: false
                }
            },
            hacknight: {
                nextEvent: {
                    name: 'HackNight Setembro',
                    date: '2024-10-15T18:00:00',
                    confirmedHackers: 4,
                    isActive: true
                },
                hackerChallenge: {
                    title: 'HackerChallenge',
                    description: 'Get ready for an epic coding challenge that will test your skills and creativity! The HackerChallenge is coming soon with exciting prizes and recognition for the best hackers.',
                    status: 'Coming Soon',
                    isActive: true
                },
                lastWinner: {
                    name: '',
                    description: 'No winners yet - be the first!',
                    isActive: false
                },
                finalCall: {
                    title: 'X-Biters are still on the loose!',
                    description: 'Join the hunt and prove your skills in the ultimate hacking challenge. The competition is fierce, but the rewards are legendary!',
                    isActive: true
                }
            },
            season: {
                currentSeason: {
                    title: 'Current Season',
                    description: '🚀 Welcome to the Hacker League\'s Inaugural Season - where legends are born and boundaries are shattered! This isn\'t just another competition; it\'s the genesis of something extraordinary that will redefine what it means to be a hacker.',
                    isActive: true
                },
                communityGoal: {
                    title: 'Community Goal',
                    goal: '30 Hackers @ HackNight',
                    progressPercentage: 63,
                    finalPrize: 'Legendary Surprise Final Prize',
                    isActive: true
                },
                stats: {
                    activeHackers: 19,
                    daysRemaining: 12,
                    challengesSolved: 156,
                    communityEngagement: 89
                }
            }
        };
    }

    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with default data to ensure all properties exist
                return this.mergeWithDefaults(parsed);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
        return this.defaultData;
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving admin data:', error);
            return false;
        }
    }

    mergeWithDefaults(data) {
        const merged = { ...this.defaultData };
        
        // Deep merge for nested objects
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && data[key] !== null) {
                merged[key] = { ...merged[key], ...data[key] };
            } else {
                merged[key] = data[key];
            }
        });

        return merged;
    }

    // Hall of Fame methods
    getHallOfFameData() {
        return this.data.hallOfFame;
    }

    updateHallOfFameData(section, data) {
        this.data.hallOfFame[section] = { ...this.data.hallOfFame[section], ...data };
        return this.saveData();
    }

    // HackNight methods
    getHackNightData() {
        return this.data.hacknight;
    }

    updateHackNightData(section, data) {
        this.data.hacknight[section] = { ...this.data.hacknight[section], ...data };
        return this.saveData();
    }

    // Season methods
    getSeasonData() {
        return this.data.season;
    }

    updateSeasonData(section, data) {
        this.data.season[section] = { ...this.data.season[section], ...data };
        return this.saveData();
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

    // Reset to defaults
    resetToDefaults() {
        this.data = this.defaultData;
        return this.saveData();
    }
}

// Create singleton instance
const adminDataService = new AdminDataService();

export default adminDataService;
