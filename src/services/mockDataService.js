// Mock Data Service - Temporary solution until backend is ready
// This contains the original simulated data from the old project

const leaderboardData = {
    teams: [
        { name: "Cyber Warriors", pjPoints: 1200, pccPoints: 2650, members: 4 },
        { name: "Code Breakers", pjPoints: 1100, pccPoints: 2620, members: 3 },
        { name: "Digital Ninjas", pjPoints: 1050, pccPoints: 2530, members: 5 },
        { name: "Hack Masters", pjPoints: 1300, pccPoints: 2470, members: 4 },
        { name: "Security Squad", pjPoints: 920, pccPoints: 2400, members: 3 },
        { name: "Byte Force", pjPoints: 880, pccPoints: 2700, members: 4 },
        { name: "Crypto Kings", pjPoints: 820, pccPoints: 2230, members: 3 },
        { name: "Network Knights", pjPoints: 780, pccPoints: 2140, members: 4 }
    ],
    individuals: [
        { name: "Alex Chen", team: "Cyber Warriors", pjPoints: 350, pccPoints: 800 },
        { name: "Maria Santos", team: "Code Breakers", pjPoints: 330, pccPoints: 790 },
        { name: "David Kim", team: "Digital Ninjas", pjPoints: 310, pccPoints: 770 },
        { name: "Sarah Johnson", team: "Hack Masters", pjPoints: 300, pccPoints: 750 },
        { name: "Carlos Rodriguez", team: "Security Squad", pjPoints: 290, pccPoints: 730 },
        { name: "Emma Wilson", team: "Byte Force", pjPoints: 280, pccPoints: 710 },
        { name: "James Lee", team: "Crypto Kings", pjPoints: 270, pccPoints: 690 },
        { name: "Ana Silva", team: "Network Knights", pjPoints: 260, pccPoints: 670 },
        { name: "Michael Brown", team: "Cyber Warriors", pjPoints: 250, pccPoints: 650 },
        { name: "Lisa Garcia", team: "Code Breakers", pjPoints: 240, pccPoints: 630 }
    ]
};

// Mock user profile data
const userProfileData = {
    "admin": {
        name: "Admin User",
        email: "admin@hackerschool.pt",
        course: "Computer Science and Engineering",
        description: "System administrator and HackerSchool coordinator. Passionate about cybersecurity and helping students develop their skills.",
        roles: ["admin", "member"],
        memberNumber: 1,
        joinDate: "2023-01-15",
        istId: "ist123456",
        extra: "Lead organizer",
        teams: ["Cyber Warriors"]
    },
    "alexchen": {
        name: "Alex Chen",
        email: "alex.chen@tecnico.ulisboa.pt",
        course: "Computer Science and Engineering",
        description: "Cybersecurity enthusiast and team leader of Cyber Warriors. Specialized in penetration testing and ethical hacking.",
        roles: ["member", "team_leader"],
        memberNumber: 5,
        joinDate: "2023-03-20",
        istId: "ist789012",
        extra: "CTF champion",
        teams: ["Cyber Warriors"]
    },
    "mariasantos": {
        name: "Maria Santos",
        email: "maria.santos@tecnico.ulisboa.pt",
        course: "Computer Science and Engineering",
        description: "Blockchain developer and Code Breakers team member. Interested in smart contracts and decentralized systems.",
        roles: ["member"],
        memberNumber: 8,
        joinDate: "2023-04-10",
        istId: "ist345678",
        extra: "Web3 expert",
        teams: ["Code Breakers"]
    },
    "davidkim": {
        name: "David Kim",
        email: "david.kim@tecnico.ulisboa.pt",
        course: "Computer Science and Engineering",
        description: "Machine learning specialist and Digital Ninjas team leader. Focuses on AI security and algorithm optimization.",
        roles: ["member", "team_leader"],
        memberNumber: 12,
        joinDate: "2023-05-05",
        istId: "ist901234",
        extra: "ML researcher",
        teams: ["Digital Ninjas"]
    }
};

const historyData = {
    "Cyber Warriors": [
        { membro: "Alex Chen", equipa: "Cyber Warriors", descrição: "HackerPitch - AI Integration", data: "2024-01-15", tipo: "PJ", pontos: 25 },
        { membro: "Michael Brown", equipa: "Cyber Warriors", descrição: "Task Completion - API Development", data: "2024-01-14", tipo: "PCC", pontos: 10 },
        { membro: "Alex Chen", equipa: "Cyber Warriors", descrição: "HackerChallenge - Security CTF", data: "2024-01-10", tipo: "PJ", pontos: 18 }
    ],
    "Code Breakers": [
        { membro: "Maria Santos", equipa: "Code Breakers", descrição: "HackerPitch - Blockchain Demo", data: "2024-01-15", tipo: "PJ", pontos: 18 },
        { membro: "Lisa Garcia", equipa: "Code Breakers", descrição: "Workshop Organization", data: "2024-01-12", tipo: "PCC", pontos: 15 },
        { membro: "Maria Santos", equipa: "Code Breakers", descrição: "HackerChallenge - Code Golf", data: "2024-01-10", tipo: "PJ", pontos: 15 }
    ],
    "Digital Ninjas": [
        { membro: "David Kim", equipa: "Digital Ninjas", descrição: "HackerPitch - ML Model", data: "2024-01-15", tipo: "PJ", pontos: 15 },
        { membro: "David Kim", equipa: "Digital Ninjas", descrição: "Lab Maintenance", data: "2024-01-13", tipo: "PCC", pontos: 8 },
        { membro: "David Kim", equipa: "Digital Ninjas", descrição: "HackerChallenge - Algorithm Race", data: "2024-01-10", tipo: "PJ", pontos: 12 }
    ],
    "Hack Masters": [
        { membro: "Sarah Johnson", equipa: "Hack Masters", descrição: "HackerPitch - Web3 Project", data: "2024-01-15", tipo: "PJ", pontos: 12 },
        { membro: "Sarah Johnson", equipa: "Hack Masters", descrição: "Documentation Update", data: "2024-01-11", tipo: "PCC", pontos: 5 },
        { membro: "Sarah Johnson", equipa: "Hack Masters", descrição: "HackerChallenge - UI Design", data: "2024-01-10", tipo: "PJ", pontos: 10 }
    ],
    "Security Squad": [
        { membro: "Carlos Rodriguez", equipa: "Security Squad", descrição: "HackerPitch - Penetration Testing", data: "2024-01-15", tipo: "PJ", pontos: 10 },
        { membro: "Carlos Rodriguez", equipa: "Security Squad", descrição: "Security Workshop", data: "2024-01-09", tipo: "PCC", pontos: 12 },
        { membro: "Carlos Rodriguez", equipa: "Security Squad", descrição: "HackerChallenge - Crypto Puzzle", data: "2024-01-10", tipo: "PJ", pontos: 8 }
    ],
    "Byte Force": [
        { membro: "Emma Wilson", equipa: "Byte Force", descrição: "HackerPitch - Mobile App", data: "2024-01-15", tipo: "PJ", pontos: 8 },
        { membro: "Emma Wilson", equipa: "Byte Force", descrição: "Code Review Session", data: "2024-01-12", tipo: "PCC", pontos: 6 },
        { membro: "Emma Wilson", equipa: "Byte Force", descrição: "HackerChallenge - Mobile Dev", data: "2024-01-10", tipo: "PJ", pontos: 6 }
    ],
    "Crypto Kings": [
        { membro: "James Lee", equipa: "Crypto Kings", descrição: "HackerPitch - Cryptography", data: "2024-01-15", tipo: "PJ", pontos: 6 },
        { membro: "James Lee", equipa: "Crypto Kings", descrição: "Mentoring Session", data: "2024-01-11", tipo: "PCC", pontos: 4 },
        { membro: "James Lee", equipa: "Crypto Kings", descrição: "HackerChallenge - Crypto CTF", data: "2024-01-10", tipo: "PJ", pontos: 4 }
    ],
    "Network Knights": [
        { membro: "Ana Silva", equipa: "Network Knights", descrição: "HackerPitch - Network Security", data: "2024-01-15", tipo: "PJ", pontos: 4 },
        { membro: "Ana Silva", equipa: "Network Knights", descrição: "Infrastructure Setup", data: "2024-01-09", tipo: "PCC", pontos: 3 },
        { membro: "Ana Silva", equipa: "Network Knights", descrição: "HackerChallenge - Network Analysis", data: "2024-01-10", tipo: "PJ", pontos: 2 }
    ]
};

// Mock API functions that simulate the real API
export const mockLeaderboardAPI = {
    getTeams: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return leaderboardData.teams;
    },
    
    getIndividuals: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return leaderboardData.individuals;
    },
    
    getStats: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const totalParticipants = leaderboardData.individuals.length;
        const activeTeams = leaderboardData.teams.length;
        
        // Calculate total points dynamically
        const teamsTotalPoints = leaderboardData.teams.reduce((sum, team) => sum + team.pjPoints + team.pccPoints, 0);
        const individualsTotalPoints = leaderboardData.individuals.reduce((sum, individual) => sum + individual.pjPoints + individual.pccPoints, 0);
        const totalPoints = teamsTotalPoints + individualsTotalPoints;
        
        return {
            totalParticipants,
            activeTeams,
            totalPoints
        };
    },
    
    getTeamHistory: async (teamName, limit = 3) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        const teamHistory = historyData[teamName] || [];
        return teamHistory
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, limit);
    },

    getIndividualHistory: async (individualName, limit = 3) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        let individualHistory = [];
        
        // Find all history entries for this individual across all teams
        for (const teamName in historyData) {
            const teamEntries = historyData[teamName].filter(entry => entry.membro === individualName);
            individualHistory = individualHistory.concat(teamEntries);
        }
        
        return individualHistory
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, limit);
    },
    
    getAllHistory: async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        let allHistory = [];
        for (const teamName in historyData) {
            allHistory = allHistory.concat(historyData[teamName]);
        }
        return allHistory.sort((a, b) => new Date(b.data) - new Date(a.data));
    }
};

// Mock User Profile API
export const mockUserAPI = {
    getUser: async (username) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        const userData = userProfileData[username];
        if (!userData) {
            // Return a default profile for any username
            return {
                name: username.charAt(0).toUpperCase() + username.slice(1),
                email: `${username}@tecnico.ulisboa.pt`,
                course: "Computer Science and Engineering",
                description: "HackerSchool member. Passionate about cybersecurity and technology.",
                roles: ["member"],
                memberNumber: Math.floor(Math.random() * 100) + 1,
                joinDate: "2024-01-01",
                istId: `ist${Math.floor(Math.random() * 1000000)}`,
                extra: "New member"
            };
        }
        return userData;
    },
    
    updateUser: async (username, userData) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        // Simulate updating user data
        userProfileData[username] = { ...userProfileData[username], ...userData };
        return { success: true };
    },
    
    getUserLogo: async (username) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simulate a default logo blob
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#6dba76';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(username.charAt(0).toUpperCase(), 50, 60);
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
    },
    
    uploadUserLogo: async (username, file) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        // Simulate logo upload
        return { success: true, message: 'Logo uploaded successfully' };
    },

    // Admin API functions
    getAllUsers: async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const allUsers = [];
        for (const [username, userData] of Object.entries(userProfileData)) {
            allUsers.push({
                id: userData.memberNumber || Math.floor(Math.random() * 1000),
                username,
                ...userData
            });
        }
        return allUsers;
    },

    createUser: async (userData) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        userProfileData[userData.username] = {
            ...userData,
            memberNumber: Math.floor(Math.random() * 1000) + 100,
            joinDate: new Date().toISOString().split('T')[0]
        };
        return { success: true, message: 'User created successfully' };
    },

    deleteUser: async (username) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        delete userProfileData[username];
        return { success: true, message: 'User deleted successfully' };
    },

    // Points history management
    getAllPointsHistory: async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        let allHistory = [];
        let idCounter = 1;
        
        for (const teamName in historyData) {
            for (const entry of historyData[teamName]) {
                allHistory.push({
                    id: idCounter++,
                    ...entry,
                    createdAt: entry.data,
                    updatedAt: entry.data
                });
            }
        }
        
        return allHistory.sort((a, b) => new Date(b.data) - new Date(a.data));
    },

    createPointsEntry: async (pointsData) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { members, description, points, type } = pointsData;
        const date = new Date().toISOString().split('T')[0];
        
        // Add entries for each selected member
        members.forEach(member => {
            const memberData = userProfileData[member.username];
            const team = memberData?.teams?.[0] || 'No Team';
            
            if (!historyData[team]) {
                historyData[team] = [];
            }
            
            historyData[team].push({
                membro: member.name,
                equipa: team,
                descrição: description,
                data: date,
                tipo: type,
                pontos: points
            });
        });
        
        return { success: true, message: 'Points awarded successfully' };
    },

    updatePointsEntry: async (id, pointsData) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        // Find and update the entry
        for (const teamName in historyData) {
            const entryIndex = historyData[teamName].findIndex((_, index) => index + 1 === id);
            if (entryIndex !== -1) {
                historyData[teamName][entryIndex] = {
                    ...historyData[teamName][entryIndex],
                    descrição: pointsData.description,
                    pontos: pointsData.points,
                    tipo: pointsData.type,
                    data: pointsData.date || historyData[teamName][entryIndex].data
                };
                return { success: true, message: 'Points entry updated successfully' };
            }
        }
        throw new Error('Points entry not found');
    },

    deletePointsEntry: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        // Find and delete the entry
        for (const teamName in historyData) {
            const entryIndex = historyData[teamName].findIndex((_, index) => index + 1 === id);
            if (entryIndex !== -1) {
                historyData[teamName].splice(entryIndex, 1);
                return { success: true, message: 'Points entry deleted successfully' };
            }
        }
        throw new Error('Points entry not found');
    },

    // Hall of Fame data service
    getHallOfFameData: async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            categories: [
                {
                    id: 'pitch-month',
                    title: 'Pitch do Mês',
                    subtitle: 'Equipa que ganhou mais pontos no pitch da HackNight anterior',
                    icon: '🎯',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    winner: {
                        name: 'Cyber Warriors',
                        photo: '/images/team-cyber-warriors.jpg',
                        score: '1,200 pts',
                        achievement: 'Pitch revolucionário sobre IA em Cybersecurity',
                        badge: 'gold',
                        streak: 2
                    },
                    rarity: 'legendary'
                },
                {
                    id: 'rising-star',
                    title: 'Estrela em Ascensão',
                    subtitle: 'Equipa que ganhou mais pontos',
                    icon: '⭐',
                    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    winner: {
                        name: 'Code Breakers',
                        photo: '/images/team-code-breakers.jpg',
                        score: '2,650 pts',
                        achievement: 'Crescimento de 400% nos últimos 3 meses',
                        badge: 'gold',
                        streak: 1
                    },
                    rarity: 'epic'
                }
            ],
            specialAchievements: [
                {
                    id: 'grand-slam',
                    title: 'Grand Slam',
                    description: 'Conquistou 4+ categorias diferentes no mesmo mês',
                    winner: 'Alex Chen',
                    icon: '🏆',
                    rarity: 'mythic'
                }
            ],
            lastUpdated: new Date().toISOString()
        };
    }
}; 