const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize SQLite database
const db = new sqlite3.Database('./admin_data.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admin_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_type TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default data
    const defaultData = {
        'hallOfFame.pitchDoMes': JSON.stringify({
            name: '',
            points: 0,
            description: '',
            isActive: false
        }),
        'hallOfFame.estrelaEmAscensao': JSON.stringify({
            name: '',
            points: 0,
            description: '',
            isActive: false
        }),
        'hallOfFame.hackerDoMes': JSON.stringify({
            name: '',
            points: 0,
            description: '',
            isActive: false
        }),
        'hallOfFame.equipaDoMes': JSON.stringify({
            name: '',
            points: 0,
            description: '',
            isActive: false
        }),
        'hacknight.nextEvent': JSON.stringify({
            name: 'HackNight Setembro',
            date: '2024-10-15T18:00:00',
            confirmedHackers: 4,
            isActive: true
        }),
        'hacknight.hackerChallenge': JSON.stringify({
            title: 'HackerChallenge',
            description: 'Get ready for an epic coding challenge that will test your skills and creativity! The HackerChallenge is coming soon with exciting prizes and recognition for the best hackers.',
            status: 'Coming Soon',
            isActive: true
        }),
        'hacknight.lastWinner': JSON.stringify({
            name: '',
            description: 'No winners yet - be the first!',
            isActive: false
        }),
        'hacknight.finalCall': JSON.stringify({
            title: 'X-Biters are still on the loose!',
            description: 'Join the hunt and prove your skills in the ultimate hacking challenge. The competition is fierce, but the rewards are legendary!',
            isActive: true
        }),
        'season.currentSeason': JSON.stringify({
            title: 'Current Season',
            description: '🚀 Welcome to the Hacker League\'s Inaugural Season - where legends are born and boundaries are shattered! This isn\'t just another competition; it\'s the genesis of something extraordinary that will redefine what it means to be a hacker.',
            isActive: true
        }),
        'season.communityGoal': JSON.stringify({
            title: 'Community Goal',
            goal: '30 Hackers @ HackNight',
            progressPercentage: 63,
            finalPrize: 'Legendary Surprise Final Prize',
            isActive: true
        }),
        'season.stats': JSON.stringify({
            activeHackers: 19,
            daysRemaining: 12,
            challengesSolved: 156,
            communityEngagement: 89
        })
    };

    // Insert default data if not exists
    Object.entries(defaultData).forEach(([key, value]) => {
        db.get('SELECT * FROM admin_data WHERE data_key = ?', [key], (err, row) => {
            if (!row) {
                const [dataType, dataKey] = key.split('.');
                db.run('INSERT INTO admin_data (data_type, data_key, data_value) VALUES (?, ?, ?)', 
                    [dataType, dataKey, value]);
            }
        });
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Broadcast function to send updates to all connected clients
function broadcastUpdate(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'admin_data_update',
                data: data
            }));
        }
    });
}

// API Routes

// Get all admin data
app.get('/api/admin-data', (req, res) => {
    db.all('SELECT * FROM admin_data', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const data = {
            hallOfFame: {},
            hacknight: {},
            season: {}
        };
        
        rows.forEach(row => {
            try {
                const parsedValue = JSON.parse(row.data_value);
                if (row.data_type === 'hallOfFame') {
                    data.hallOfFame[row.data_key] = parsedValue;
                } else if (row.data_type === 'hacknight') {
                    data.hacknight[row.data_key] = parsedValue;
                } else if (row.data_type === 'season') {
                    data.season[row.data_key] = parsedValue;
                }
            } catch (e) {
                console.error('Error parsing data:', e);
            }
        });
        
        res.json(data);
    });
});

// Update admin data
app.put('/api/admin-data/:type/:key', (req, res) => {
    const { type, key } = req.params;
    const { data } = req.body;
    
    const dataKey = `${type}.${key}`;
    const dataValue = JSON.stringify(data);
    
    db.run(
        'UPDATE admin_data SET data_value = ?, updated_at = CURRENT_TIMESTAMP WHERE data_key = ?',
        [dataValue, dataKey],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                // Insert if doesn't exist
                db.run(
                    'INSERT INTO admin_data (data_type, data_key, data_value) VALUES (?, ?, ?)',
                    [type, key, dataValue],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        res.json({ success: true, id: this.lastID });
                        broadcastUpdate({ type, key, data });
                    }
                );
            } else {
                res.json({ success: true });
                broadcastUpdate({ type, key, data });
            }
        }
    );
});

// Get specific data type
app.get('/api/admin-data/:type', (req, res) => {
    const { type } = req.params;
    
    db.all('SELECT * FROM admin_data WHERE data_type = ?', [type], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const data = {};
        rows.forEach(row => {
            try {
                data[row.data_key] = JSON.parse(row.data_value);
            } catch (e) {
                console.error('Error parsing data:', e);
            }
        });
        
        res.json(data);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
    console.log(`🗄️  SQLite database initialized`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
});
