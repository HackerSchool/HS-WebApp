const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const archiver = require('archiver');

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

// Initialize SQLite database with absolute path for consistency
const dbPath = path.join(__dirname, 'admin_data.db');
const backupPath = path.join(__dirname, 'admin_data_backup.json');
// Use environment variable if set (for Docker), otherwise use relative path (for local dev)
const scoreboardDbPath = process.env.SCOREBOARD_DB_PATH || path.resolve(__dirname, '../../API/resources/hackerschool.sqlite3');
let dbOpen = false;
let scoreboardDb = null;
let scoreboardDbOpen = false;

function openDatabase() {
    dbOpen = true;
    const connection = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Failed to open SQLite database', err);
            dbOpen = false;
        } else {
            dbOpen = true;
            console.log('✅ SQLite connection established');
        }
    });
    connection.configure('busyTimeout', 5000);
    return connection;
}

let db = openDatabase();
if (!dbOpen) {
    console.warn('⚠️  Failed to establish SQLite connection on startup.');
}
let hasInitialized = false;
let isShuttingDown = false;

function ensureDbOpen() {
    if (!db || !dbOpen) {
        console.warn('⚠️  SQLite connection was closed unexpectedly. Reopening...');
        db = openDatabase();
        if (hasInitialized) {
            initializeDatabase(db);
        }
    }
    return db;
}

// Promisified database helpers
const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureDbOpen();
    connection.run(sql, params, function(err) {
        if (err) {
            reject(err);
        } else {
            resolve(this);
        }
    });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureDbOpen();
    connection.get(sql, params, (err, row) => {
        if (err) {
            reject(err);
        } else {
            resolve(row);
        }
    });
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureDbOpen();
    connection.all(sql, params, (err, rows) => {
        if (err) {
            reject(err);
        } else {
            resolve(rows);
        }
    });
});

function openScoreboardDatabase() {
    if (!fs.existsSync(scoreboardDbPath)) {
        console.warn(`⚠️  HackerSchool database not found at ${scoreboardDbPath}`);
        scoreboardDbOpen = false;
        return null;
    }
    const connection = new sqlite3.Database(scoreboardDbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('❌ Failed to open HackerSchool SQLite database', err);
            scoreboardDbOpen = false;
        } else {
            scoreboardDbOpen = true;
            console.log('✅ HackerSchool SQLite connection established');
        }
    });
    connection.configure('busyTimeout', 5000);
    return connection;
}

function ensureScoreboardDbOpen() {
    if (scoreboardDb && scoreboardDbOpen) {
        return scoreboardDb;
    }
    scoreboardDb = openScoreboardDatabase();
    return scoreboardDb;
}

const scoreboardRunAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureScoreboardDbOpen();
    if (!connection) {
        return reject(new Error('HackerSchool database is not available'));
    }
    connection.run(sql, params, function(err) {
        if (err) {
            reject(err);
        } else {
            resolve(this);
        }
    });
});

const scoreboardGetAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureScoreboardDbOpen();
    if (!connection) {
        return reject(new Error('HackerSchool database is not available'));
    }
    connection.get(sql, params, (err, row) => {
        if (err) {
            reject(err);
        } else {
            resolve(row);
        }
    });
});

const scoreboardAllAsync = (sql, params = []) => new Promise((resolve, reject) => {
    const connection = ensureScoreboardDbOpen();
    if (!connection) {
        return reject(new Error('HackerSchool database is not available'));
    }
    connection.all(sql, params, (err, rows) => {
        if (err) {
            reject(err);
        } else {
            resolve(rows);
        }
    });
});

console.log('📂 Database path:', dbPath);
console.log('💾 Backup path:', backupPath);

// Backup and restore functions
function createBackup() {
    const connection = ensureDbOpen();
    connection.all('SELECT * FROM admin_data', (err, rows) => {
        if (err) {
            console.error('❌ Error creating backup:', err);
            return;
        }
        
        const backup = {
            timestamp: new Date().toISOString(),
            data: rows
        };
        
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        console.log('✅ Backup created successfully');
    });
}

function restoreFromBackup() {
    if (!fs.existsSync(backupPath)) {
        console.log('ℹ️  No backup file found');
        return false;
    }
    
    try {
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backup = JSON.parse(backupContent);
        
        console.log('📥 Restoring from backup...');
        const connection = ensureDbOpen();
        backup.data.forEach(row => {
            connection.run(
                'INSERT OR REPLACE INTO admin_data (data_type, data_key, data_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [row.data_type, row.data_key, row.data_value, row.created_at, row.updated_at],
                (err) => {
                    if (err) {
                        console.error('❌ Error restoring row:', err);
                    }
                }
            );
        });
        
        console.log('✅ Data restored from backup');
        return true;
    } catch (error) {
        console.error('❌ Error reading backup file:', error);
        return false;
    }
}

function initializeDatabase(connectionParam) {
    const connection = connectionParam || db;
    if (!connection || !connection.open) {
        return;
    }

    connection.serialize(() => {
        connection.run(`CREATE TABLE IF NOT EXISTS admin_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_type TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(data_type, data_key)
    )`, () => {
        // Check if database is empty and restore from backup if needed
        connection.get('SELECT COUNT(*) as count FROM admin_data', (err, row) => {
            if (!err && row.count === 0) {
                console.log('🔍 Database is empty, checking for backup...');
                const restored = restoreFromBackup();
                if (!restored) {
                    console.log('ℹ️  No backup found, initializing with default data');
                }
            } else {
                console.log(`✅ Database loaded with ${row.count} records`);
            }
        });
    });
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_data_type_key ON admin_data (data_type, data_key)`);

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
        statusLabel: 'Coming Soon',
        status: 'coming-soon',
        buttonText: 'Learn More',
        buttonUrl: '',
        isActive: true
    }),
        'hacknight.lastWinner': JSON.stringify({
            name: '',
            teamSlug: '',
            description: 'No winners yet - be the first!',
            isActive: false
        }),
        'hacknight.finalCall': JSON.stringify({
            title: 'X-Biters are still on the loose!',
            description: 'Join the hunt and prove your skills in the ultimate hacking challenge. The competition is fierce, but the rewards are legendary!',
            buttonText: 'Join the Hunt',
            buttonUrl: '',
            isActive: true
        }),
        'hacknight.votingState': JSON.stringify({
        checkinsOpen: false,
        pitchLocked: false,
        challengeLocked: false,
        xadowStage: 'idle',
        decisionDeadline: null,
        guessDeadline: null,
        lastResetAt: null
    }),
    'hacknight.photoshoot': JSON.stringify({
            title: 'Last HackNight Photoshoot',
            message: 'Coming soon :))',
            galleryUrl: '',
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
        activeParticipants: 19,
        daysRemaining: 12,
        tasksSolved: 156,
        communityEngagement: 89
    })
    };

    // Insert default data if not exists
    Object.entries(defaultData).forEach(([key, value]) => {
        const [dataType, dataKey] = key.split('.');
        connection.get('SELECT * FROM admin_data WHERE data_type = ? AND data_key = ?', [dataType, dataKey], (err, row) => {
            if (!row) {
                connection.run('INSERT INTO admin_data (data_type, data_key, data_value) VALUES (?, ?, ?)', 
                    [dataType, dataKey, value], (err) => {
                        if (!err) {
                            // Create backup after inserting default data
                            createBackup();
                        }
                    });
            }
        });
    });
    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        team_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, member_id)
    )`);
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_checkins_event_member ON hacknight_checkins (event_date, member_id)`);

    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_pre_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        member_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, member_id)
    )`);
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_pre_checkins_event_member ON hacknight_pre_checkins (event_date, member_id)`);

    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_votes_pitch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        team_id TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        appeal INTEGER NOT NULL,
        surprise INTEGER NOT NULL,
        time_score INTEGER NOT NULL,
        content INTEGER NOT NULL,
        effort INTEGER NOT NULL,
        total INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, team_id, voter_id)
    )`);
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_votes_pitch_unique ON hacknight_votes_pitch (event_date, team_id, voter_id)`);

    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_votes_challenge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        team_id TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        order_position INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, team_id, voter_id)
    )`);
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_votes_challenge_unique ON hacknight_votes_challenge (event_date, team_id, voter_id)`);

    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_votes_xadow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        stage TEXT NOT NULL,
        team_id TEXT,
        voter_id TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, stage, voter_id)
    )`);
    connection.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_votes_xadow_unique ON hacknight_votes_xadow (event_date, stage, voter_id)`);

    connection.run(`CREATE TABLE IF NOT EXISTS hacknight_xadow_decision (
        event_date TEXT PRIMARY KEY,
        team_id TEXT,
        admin_id TEXT,
        is_xadow_team INTEGER NOT NULL,
        decided_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    });
    hasInitialized = true;
}

initializeDatabase(db);

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

const ensurePreCheckinsTable = async () => {
    await runAsync(`CREATE TABLE IF NOT EXISTS hacknight_pre_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        member_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, member_id)
    )`);
    await runAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hacknight_pre_checkins_event_member ON hacknight_pre_checkins (event_date, member_id)`);
};

// API Routes

// HackNight helpers and routes
const DEFAULT_VOTING_STATE = {
    checkinsOpen: false,
    pitchLocked: true,
    challengeLocked: true,
    xadowStage: 'idle',
    decisionDeadline: null,
    guessDeadline: null,
    lastResetAt: null,
    xadowTargetTeam: null,
    decisionResults: null,
    guessResults: null
};

const getAdminDataValue = async (type, key, fallback = null) => {
    const row = await getAsync('SELECT data_value FROM admin_data WHERE data_type = ? AND data_key = ?', [type, key]);
    if (!row) {
        return fallback;
    }
    try {
        return JSON.parse(row.data_value);
    } catch (error) {
        console.error('Error parsing admin data value', error);
        return fallback;
    }
};

const setAdminDataValue = async (type, key, value, options = {}) => {
    const { broadcast = true } = options;
    const payload = JSON.stringify(value);
    await runAsync(
        `INSERT INTO admin_data (data_type, data_key, data_value, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(data_type, data_key) DO UPDATE SET data_value = excluded.data_value, updated_at = CURRENT_TIMESTAMP`,
        [type, key, payload]
    );

    if (broadcast) {
        broadcastUpdate({ type, key, data: value });
    }
    createBackup();
};

const getHacknightState = async () => {
    const state = await getAdminDataValue('hacknight', 'votingState', null);
    if (!state) {
        await setAdminDataValue('hacknight', 'votingState', DEFAULT_VOTING_STATE, { broadcast: false });
        return { ...DEFAULT_VOTING_STATE };
    }
    return { ...DEFAULT_VOTING_STATE, ...state };
};

const updateHacknightState = async (patch = {}) => {
    const current = await getHacknightState();
    const next = { ...current, ...patch };
    await setAdminDataValue('hacknight', 'votingState', next);
    return next;
};

const getCurrentEventDate = async () => {
    const nextEvent = await getAdminDataValue('hacknight', 'nextEvent', null);
    if (nextEvent && nextEvent.date) {
        return nextEvent.date;
    }
    return new Date().toISOString();
};

const clearHacknightData = async (eventDate) => {
    await ensurePreCheckinsTable();
    await runAsync('DELETE FROM hacknight_checkins WHERE event_date = ?', [eventDate]);
    await runAsync('DELETE FROM hacknight_pre_checkins WHERE event_date = ?', [eventDate]);
    await runAsync('DELETE FROM hacknight_votes_pitch WHERE event_date = ?', [eventDate]);
    await runAsync('DELETE FROM hacknight_votes_challenge WHERE event_date = ?', [eventDate]);
    await runAsync('DELETE FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
    await runAsync('DELETE FROM hacknight_xadow_decision WHERE event_date = ?', [eventDate]);
};

const computeDecisionResults = async (eventDate) => {
    const votes = await allAsync(
        'SELECT value FROM hacknight_votes_xadow WHERE event_date = ? AND stage = ?',
        [eventDate, 'decision']
    );
    const yes = votes.filter((vote) => (vote.value || '').toLowerCase() === 'yes').length;
    const no = votes.filter((vote) => (vote.value || '').toLowerCase() === 'no').length;
    const majority = yes === no ? 'tie' : yes > no ? 'yes' : 'no';
    return {
        yes,
        no,
        total: votes.length,
        majority,
    };
};

const computeGuessResults = (votes) => {
    const tally = votes.reduce((acc, vote) => {
        const key = vote.teamId || vote.value || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const sorted = Object.entries(tally)
        .map(([teamId, count]) => ({ teamId, count }))
        .sort((a, b) => {
            if (b.count === a.count) {
                return a.teamId.localeCompare(b.teamId);
            }
            return b.count - a.count;
        });

    const leadingTeam = sorted.length > 0 ? sorted[0].teamId : null;

    return {
        tally,
        leadingTeam,
    };
};

const applyXadowPenalty = async ({ eventDate, penaltyPoints = -10 }) => {
    if (!ensureScoreboardDbOpen()) {
        throw new Error('HackerSchool database is not available');
    }

    const eventDay = (eventDate || new Date().toISOString()).slice(0, 10);
    const penaltyDescription = `Penalização xad0w.b1ts (${eventDay})`;

    await scoreboardRunAsync('BEGIN IMMEDIATE');

    const summary = {
        appliedCount: 0,
        skippedCount: 0,
        appliedSample: [],
        skippedSample: [],
        description: penaltyDescription,
        pointType: 'PJ',
        points: penaltyPoints,
        finishedAt: eventDay,
    };

    try {
        const members = await scoreboardAllAsync('SELECT id, username FROM members');
        const participations = await scoreboardAllAsync(
            'SELECT id, member_id, join_date FROM project_participations ORDER BY join_date ASC'
        );
        const participationByMember = new Map();
        participations.forEach((row) => {
            if (!participationByMember.has(row.member_id)) {
                participationByMember.set(row.member_id, row.id);
            }
        });

        for (const member of members) {
            const participationId = participationByMember.get(member.id);
            if (!participationId) {
                summary.skippedCount += 1;
                if (summary.skippedSample.length < 5) {
                    summary.skippedSample.push(member.username);
                }
                continue;
            }

            const existing = await scoreboardGetAsync(
                'SELECT id FROM tasks WHERE participation_id = ? AND description = ?',
                [participationId, penaltyDescription]
            );
            if (existing) {
                continue;
            }

            await scoreboardRunAsync(
                'INSERT INTO tasks (point_type, points, description, finished_at, participation_id) VALUES (?, ?, ?, ?, ?)',
                ['PJ', penaltyPoints, penaltyDescription, eventDay, participationId]
            );

            summary.appliedCount += 1;
            if (summary.appliedSample.length < 5) {
                summary.appliedSample.push(member.username);
            }
        }

        await scoreboardRunAsync('COMMIT');

        console.log(
            `🚨 Applied xad0w.b1ts penalty of ${penaltyPoints} PJ to ${summary.appliedCount} members (skipped: ${summary.skippedCount})`
        );

        return summary;
    } catch (error) {
        try {
            await scoreboardRunAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back xad0w.b1ts penalty transaction', rollbackError);
        }
        throw error;
    }
};

const synchronizeXadowState = async (eventDate) => {
    await ensurePreCheckinsTable();
    const now = new Date();
    let state = await getHacknightState();
    let stateUpdated = false;

    if (
        state.xadowStage === 'decision' &&
        state.decisionDeadline &&
        new Date(state.decisionDeadline).getTime() <= now.getTime() &&
        !state.decisionResults
    ) {
        const decisionResults = await computeDecisionResults(eventDate);
        await updateHacknightState({ decisionResults });
        state = await getHacknightState();
        stateUpdated = true;
    }

    state = stateUpdated ? state : await getHacknightState();

    if (
        state.xadowStage === 'guess' &&
        state.guessDeadline &&
        new Date(state.guessDeadline).getTime() <= now.getTime()
    ) {
        const decisionResults = state.decisionResults || await computeDecisionResults(eventDate);
        const guessVotes = await allAsync(
            'SELECT team_id AS teamId FROM hacknight_votes_xadow WHERE event_date = ? AND stage = ?',
            [eventDate, 'guess']
        );
        const guessResultsData = computeGuessResults(guessVotes);
        const targetTeam = state.xadowTargetTeam || null;
        const checkins = await allAsync(
            'SELECT member_id FROM hacknight_checkins WHERE event_date = ?',
            [eventDate]
        );
        const eligibleCount = checkins.length;
        const voteCount = guessVotes.length;
        const requiredVotes = eligibleCount === 0 ? 0 : Math.max(1, Math.floor(eligibleCount * 0.8));
        const hasEnoughVotes = eligibleCount > 0 && voteCount >= requiredVotes;

        const playersCaught = Boolean(
            hasEnoughVotes &&
            guessResultsData.leadingTeam &&
            targetTeam &&
            guessResultsData.leadingTeam === targetTeam
        );

        const previousGuessResults = state.guessResults || {};
        let penaltyApplied = Boolean(previousGuessResults.penaltyApplied);
        let penaltySummary = previousGuessResults.penalty || null;
        let penaltyError = null;

        if (hasEnoughVotes && !playersCaught) {
            if (!penaltyApplied) {
                try {
                    penaltySummary = await applyXadowPenalty({ eventDate });
                    penaltyApplied = true;
                } catch (error) {
                    penaltyApplied = false;
                    penaltySummary = null;
                    penaltyError = error.message || 'Falha ao aplicar penalização xad0w.b1ts';
                    console.error('Error applying xad0w.b1ts penalty', error);
                }
            }
        } else {
            penaltyApplied = false;
            penaltySummary = null;
        }

        const guessResults = {
            tally: guessResultsData.tally,
            leadingTeam: guessResultsData.leadingTeam,
            success: playersCaught,
            votes: voteCount,
            eligible: eligibleCount,
            required: requiredVotes,
            hasEnoughVotes,
            penaltyApplied,
            penalty: penaltySummary,
        };

        if (penaltyError) {
            guessResults.penaltyError = penaltyError;
        }

        await updateHacknightState({
            xadowStage: 'complete',
            decisionDeadline: null,
            guessDeadline: null,
            decisionResults,
            guessResults,
        });

        await runAsync(
            `INSERT INTO hacknight_xadow_decision (event_date, team_id, admin_id, is_xadow_team, decided_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(event_date) DO UPDATE SET team_id = excluded.team_id, admin_id = excluded.admin_id, is_xadow_team = excluded.is_xadow_team, decided_at = CURRENT_TIMESTAMP`,
            [eventDate, targetTeam, 'system', playersCaught ? 1 : 0]
        );

        const updatedState = await getHacknightState();
        const decisionRecord = await getAsync(
            'SELECT event_date AS eventDate, team_id AS teamId, admin_id AS adminId, is_xadow_team AS isXadowTeam, decided_at AS decidedAt FROM hacknight_xadow_decision WHERE event_date = ?',
            [eventDate]
        );

        broadcastUpdate({ type: 'hacknight-xadow-final', eventDate, decision: decisionRecord, state: updatedState });
    }
};

const clampScore = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return 5;
    }
    return Math.min(5, Math.max(1, parsed));
};

const sanitizeFileName = (value) => {
    return String(value ?? 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
};

app.get('/api/hacknight/status', async (req, res) => {
    try {
        const requestedEventDate = req.query.eventDate;
        const eventDate = requestedEventDate || await getCurrentEventDate();

        // Ensure table exists BEFORE any reads
        await ensurePreCheckinsTable();
        await synchronizeXadowState(eventDate);

        const checkins = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, member_id AS memberId, checked_in_at AS checkedInAt FROM hacknight_checkins WHERE event_date = ?', [eventDate]);
        const preCheckins = await allAsync('SELECT event_date AS eventDate, member_id AS memberId, created_at AS createdAt FROM hacknight_pre_checkins WHERE event_date = ?', [eventDate]);
        const pitchVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, appeal, surprise, time_score AS timeScore, content, effort, total, created_at AS createdAt FROM hacknight_votes_pitch WHERE event_date = ?', [eventDate]);
        const challengeVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, order_position AS orderPosition, created_at AS createdAt FROM hacknight_votes_challenge WHERE event_date = ?', [eventDate]);
        const xadowVotes = await allAsync('SELECT event_date AS eventDate, stage, team_id AS teamId, voter_id AS voterId, value, created_at AS createdAt FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
        const xadowDecision = await getAsync('SELECT event_date AS eventDate, team_id AS teamId, admin_id AS adminId, is_xadow_team AS isXadowTeam, decided_at AS decidedAt FROM hacknight_xadow_decision WHERE event_date = ?', [eventDate]);
        const state = await getHacknightState();

        res.json({ eventDate, checkins, preCheckins, pitchVotes, challengeVotes, xadowVotes, xadowDecision, state });
    } catch (error) {
        console.error('Error loading hacknight status', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/check-in', async (req, res) => {
    try {
        const { teamId, memberId, eventDate: bodyEventDate } = req.body || {};
        if (!teamId || !memberId) {
            return res.status(400).json({ error: 'teamId and memberId are required' });
        }
        const eventDate = bodyEventDate || await getCurrentEventDate();
        await runAsync(
            `INSERT INTO hacknight_checkins (event_date, team_id, member_id)
             VALUES (?, ?, ?)
             ON CONFLICT(event_date, member_id) DO UPDATE SET team_id = excluded.team_id, checked_in_at = CURRENT_TIMESTAMP`,
            [eventDate, teamId, memberId]
        );
        const checkins = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, member_id AS memberId, checked_in_at AS checkedInAt FROM hacknight_checkins WHERE event_date = ?', [eventDate]);
        broadcastUpdate({ type: 'hacknight-checkins', eventDate, checkins });
        res.json({ success: true, eventDate, checkins });
    } catch (error) {
        console.error('Error recording hacknight check-in', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/pre-checkin', async (req, res) => {
    try {
        const { memberId, eventDate: bodyEventDate } = req.body || {};
        if (!memberId) {
            return res.status(400).json({ error: 'memberId is required' });
        }
        const eventDate = bodyEventDate || await getCurrentEventDate();
        await ensurePreCheckinsTable();
        const existing = await getAsync(
            'SELECT id FROM hacknight_pre_checkins WHERE event_date = ? AND member_id = ?',
            [eventDate, memberId]
        );
        let active;
        if (existing) {
            await runAsync('DELETE FROM hacknight_pre_checkins WHERE event_date = ? AND member_id = ?', [eventDate, memberId]);
            active = false;
        } else {
            await runAsync('INSERT INTO hacknight_pre_checkins (event_date, member_id) VALUES (?, ?)', [eventDate, memberId]);
            active = true;
        }
        const preCheckins = await allAsync(
            'SELECT event_date AS eventDate, member_id AS memberId, created_at AS createdAt FROM hacknight_pre_checkins WHERE event_date = ?',
            [eventDate]
        );
        broadcastUpdate({ type: 'hacknight-precheckins', eventDate, preCheckins });
        res.json({ success: true, eventDate, memberId, active, preCheckins });
    } catch (error) {
        console.error('Error toggling pre-checkin', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/vote/pitch', async (req, res) => {
    try {
        const state = await getHacknightState();
        if (state.pitchLocked) {
            return res.status(423).json({ error: 'Pitch voting is locked' });
        }

        const { voterId, votes, eventDate: bodyEventDate } = req.body || {};
        if (!voterId || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({ error: 'voterId and votes are required' });
        }

        const eventDate = bodyEventDate || await getCurrentEventDate();
        const voterCheckin = await getAsync(
            'SELECT team_id AS teamId FROM hacknight_checkins WHERE event_date = ? AND member_id = ?',
            [eventDate, voterId]
        );
        const blockedTeamId = voterCheckin && voterCheckin.teamId ? voterCheckin.teamId : null;

        let processedCount = 0;
        for (const entry of votes) {
            if (!entry || !entry.teamId) {
                continue;
            }
            if (blockedTeamId && entry.teamId === blockedTeamId) {
                continue;
            }
            const scores = entry.scores || {};
            const appeal = clampScore(scores.appeal ?? 5);
            const surprise = clampScore(scores.surprise ?? 5);
            const timeScore = clampScore(scores.time ?? scores.timeScore ?? 5);
            const content = clampScore(scores.content ?? 5);
            const effort = clampScore(scores.effort ?? 5);
            const total = appeal + surprise + timeScore + content + effort;
            await runAsync(
                `INSERT INTO hacknight_votes_pitch (event_date, team_id, voter_id, appeal, surprise, time_score, content, effort, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(event_date, team_id, voter_id) DO UPDATE SET appeal = excluded.appeal, surprise = excluded.surprise, time_score = excluded.time_score, content = excluded.content, effort = excluded.effort, total = excluded.total, created_at = CURRENT_TIMESTAMP`,
                [eventDate, entry.teamId, voterId, appeal, surprise, timeScore, content, effort, total]
            );
            processedCount += 1;
        }

        if (processedCount === 0) {
            return res.status(400).json({ error: 'Não podes votar na tua própria equipa.' });
        }

        const pitchVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, appeal, surprise, time_score AS timeScore, content, effort, total, created_at AS createdAt FROM hacknight_votes_pitch WHERE event_date = ?', [eventDate]);
        broadcastUpdate({ type: 'hacknight-pitch', eventDate, pitchVotes });
        res.json({ success: true, eventDate, pitchVotes });
    } catch (error) {
        console.error('Error recording pitch vote', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/vote/challenge', async (req, res) => {
    try {
        const state = await getHacknightState();
        if (state.challengeLocked) {
            return res.status(423).json({ error: 'Challenge voting is locked' });
        }

        const { voterId, orderings, eventDate: bodyEventDate } = req.body || {};
        if (!voterId || !Array.isArray(orderings) || orderings.length === 0) {
            return res.status(400).json({ error: 'voterId and orderings are required' });
        }

        const eventDate = bodyEventDate || await getCurrentEventDate();
        const voterCheckin = await getAsync(
            'SELECT team_id AS teamId FROM hacknight_checkins WHERE event_date = ? AND member_id = ?',
            [eventDate, voterId]
        );
        const blockedTeamId = voterCheckin && voterCheckin.teamId ? voterCheckin.teamId : null;

        let processedCount = 0;
        for (const entry of orderings) {
            if (!entry || !entry.teamId) {
                continue;
            }
            if (blockedTeamId && entry.teamId === blockedTeamId) {
                continue;
            }
            const orderPosition = parseInt(entry.order, 10);
            await runAsync(
                `INSERT INTO hacknight_votes_challenge (event_date, team_id, voter_id, order_position)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(event_date, team_id, voter_id) DO UPDATE SET order_position = excluded.order_position, created_at = CURRENT_TIMESTAMP`,
                [eventDate, entry.teamId, voterId, Number.isNaN(orderPosition) ? null : orderPosition]
            );
            processedCount += 1;
        }

        if (processedCount === 0) {
            return res.status(400).json({ error: 'Não podes votar na tua própria equipa.' });
        }

        const challengeVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, order_position AS orderPosition, created_at AS createdAt FROM hacknight_votes_challenge WHERE event_date = ?', [eventDate]);
        broadcastUpdate({ type: 'hacknight-challenge', eventDate, challengeVotes });
        res.json({ success: true, eventDate, challengeVotes });
    } catch (error) {
        console.error('Error recording challenge vote', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/vote/xadow/decision', async (req, res) => {
    try {
        const state = await getHacknightState();
        if (state.xadowStage !== 'decision') {
            return res.status(423).json({ error: 'xad0w.b1ts decision stage is not active' });
        }

        const { voterId, participate, eventDate: bodyEventDate } = req.body || {};
        if (!voterId || typeof participate !== 'boolean') {
            return res.status(400).json({ error: 'voterId and participate flag are required' });
        }

        const eventDate = bodyEventDate || await getCurrentEventDate();
        const value = participate ? 'yes' : 'no';
        await runAsync(
            `INSERT INTO hacknight_votes_xadow (event_date, stage, team_id, voter_id, value)
             VALUES (?, 'decision', NULL, ?, ?)
             ON CONFLICT(event_date, stage, voter_id) DO UPDATE SET value = excluded.value, created_at = CURRENT_TIMESTAMP`,
            [eventDate, voterId, value]
        );

        const xadowVotes = await allAsync('SELECT event_date AS eventDate, stage, team_id AS teamId, voter_id AS voterId, value, created_at AS createdAt FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
        broadcastUpdate({ type: 'hacknight-xadow-decision', eventDate, xadowVotes });
        res.json({ success: true, eventDate, xadowVotes });
    } catch (error) {
        console.error('Error recording xad0w.b1ts decision vote', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/vote/xadow/guess', async (req, res) => {
    try {
        const state = await getHacknightState();
        if (state.xadowStage !== 'guess') {
            return res.status(423).json({ error: 'xad0w.b1ts guess stage is not active' });
        }

        const { voterId, teamId, eventDate: bodyEventDate } = req.body || {};
        if (!voterId || !teamId) {
            return res.status(400).json({ error: 'voterId and teamId are required' });
        }

        const eventDate = bodyEventDate || await getCurrentEventDate();
        const voterCheckin = await getAsync(
            'SELECT team_id AS teamId FROM hacknight_checkins WHERE event_date = ? AND member_id = ?',
            [eventDate, voterId]
        );
        if (voterCheckin && voterCheckin.teamId && voterCheckin.teamId === teamId) {
            return res.status(400).json({ error: 'Não podes votar na tua própria equipa.' });
        }
        await runAsync(
            `INSERT INTO hacknight_votes_xadow (event_date, stage, team_id, voter_id, value)
             VALUES (?, 'guess', ?, ?, ?)
             ON CONFLICT(event_date, stage, voter_id) DO UPDATE SET team_id = excluded.team_id, value = excluded.value, created_at = CURRENT_TIMESTAMP`,
            [eventDate, teamId, voterId, teamId]
        );

        const xadowVotes = await allAsync('SELECT event_date AS eventDate, stage, team_id AS teamId, voter_id AS voterId, value, created_at AS createdAt FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
        broadcastUpdate({ type: 'hacknight-xadow-guess', eventDate, xadowVotes });
        res.json({ success: true, eventDate, xadowVotes });
    } catch (error) {
        console.error('Error recording xad0w.b1ts guess vote', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/xadow/trigger', async (req, res) => {
    try {
        const { stage, durationMinutes, eventDate: bodyEventDate, resetVotes = true } = req.body || {};
        if (!stage) {
            return res.status(400).json({ error: 'stage is required' });
        }
        const eventDate = bodyEventDate || await getCurrentEventDate();
        const now = new Date();
        const patch = {};
        let decisionResults = null;
        let guessResults = null;
        let targetTeam = null;

        if (stage === 'decision') {
            patch.xadowStage = 'decision';
            patch.decisionDeadline = durationMinutes ? new Date(now.getTime() + durationMinutes * 60000).toISOString() : null;
            patch.guessDeadline = null;
            patch.decisionResults = null;
            patch.guessResults = null;
            if (resetVotes) {
                await runAsync('DELETE FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
                await runAsync('DELETE FROM hacknight_xadow_decision WHERE event_date = ?', [eventDate]);
            }
        } else if (stage === 'guess') {
            const state = await getHacknightState();
            targetTeam = state.xadowTargetTeam || null;
            if (!targetTeam) {
                return res.status(400).json({ error: 'Selecione a equipa xad0w.b1ts antes de abrir a fase de palpites.' });
            }
            const votes = await allAsync(
                'SELECT value FROM hacknight_votes_xadow WHERE event_date = ? AND stage = ?',
                [eventDate, 'decision']
            );
            const yesVotes = votes.filter((vote) => (vote.value || '').toLowerCase() === 'yes').length;
            const noVotes = votes.filter((vote) => (vote.value || '').toLowerCase() === 'no').length;
            decisionResults = {
                yes: yesVotes,
                no: noVotes,
                total: votes.length,
                majority: yesVotes === noVotes ? 'tie' : (yesVotes > noVotes ? 'yes' : 'no')
            };
            patch.xadowStage = 'guess';
            patch.guessDeadline = durationMinutes ? new Date(now.getTime() + durationMinutes * 60000).toISOString() : null;
            patch.decisionResults = decisionResults;
            patch.xadowTargetTeam = targetTeam;
        } else if (stage === 'complete' || stage === 'idle') {
            patch.xadowStage = stage;
            patch.decisionDeadline = null;
            patch.guessDeadline = null;
            if (stage === 'idle') {
                patch.decisionResults = null;
                patch.guessResults = null;
                patch.xadowTargetTeam = null;
            }
            if (stage === 'complete') {
                const state = await getHacknightState();
                targetTeam = state.xadowTargetTeam || null;
                if (!targetTeam) {
                    return res.status(400).json({ error: 'Não existe equipa xad0w.b1ts definida para revelar.' });
                }
                const guessVotes = await allAsync(
                    'SELECT team_id AS teamId FROM hacknight_votes_xadow WHERE event_date = ? AND stage = ?',
                    [eventDate, 'guess']
                );
                const guessResultsData = computeGuessResults(guessVotes);
                const checkins = await allAsync(
                    'SELECT member_id FROM hacknight_checkins WHERE event_date = ?',
                    [eventDate]
                );
                const eligibleCount = checkins.length;
                const voteCount = guessVotes.length;
                const requiredVotes = eligibleCount === 0 ? 0 : Math.max(1, Math.floor(eligibleCount * 0.8));
                const hasEnoughVotes = eligibleCount > 0 && voteCount >= requiredVotes;

                const playersCaught = Boolean(
                    hasEnoughVotes &&
                    guessResultsData.leadingTeam &&
                    targetTeam &&
                    guessResultsData.leadingTeam === targetTeam
                );

                const previousGuessResults = state.guessResults || {};
                let penaltyApplied = Boolean(previousGuessResults.penaltyApplied);
                let penaltySummary = previousGuessResults.penalty || null;
                let penaltyError = null;

                if (hasEnoughVotes && !playersCaught) {
                    if (!penaltyApplied) {
                        try {
                            penaltySummary = await applyXadowPenalty({ eventDate });
                            penaltyApplied = true;
                        } catch (error) {
                            penaltyApplied = false;
                            penaltySummary = null;
                            penaltyError = error.message || 'Falha ao aplicar penalização xad0w.b1ts';
                            console.error('Error applying xad0w.b1ts penalty', error);
                        }
                    }
                } else {
                    penaltyApplied = false;
                    penaltySummary = null;
                }

                guessResults = {
                    tally: guessResultsData.tally,
                    leadingTeam: guessResultsData.leadingTeam,
                    success: playersCaught,
                    votes: voteCount,
                    eligible: eligibleCount,
                    required: requiredVotes,
                    hasEnoughVotes,
                    penaltyApplied,
                    penalty: penaltySummary,
                };

                if (penaltyError) {
                    guessResults.penaltyError = penaltyError;
                }

                patch.guessResults = guessResults;

                await runAsync(
                    `INSERT INTO hacknight_xadow_decision (event_date, team_id, admin_id, is_xadow_team, decided_at)
                     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                     ON CONFLICT(event_date) DO UPDATE SET team_id = excluded.team_id, admin_id = excluded.admin_id, is_xadow_team = excluded.is_xadow_team, decided_at = CURRENT_TIMESTAMP`,
                    [eventDate, targetTeam, 'system', playersCaught ? 1 : 0]
                );
            }
        }

        const state = await updateHacknightState(patch);
        broadcastUpdate({
            type: 'hacknight-xadow-state',
            eventDate,
            state,
            decisionResults,
            guessResults,
        });
        res.json({ success: true, eventDate, state, decisionResults, guessResults });
    } catch (error) {
        console.error('Error updating xad0w.b1ts stage', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/xadow/set-target', async (req, res) => {
    try {
        const { teamId } = req.body || {};
        if (!teamId) {
            return res.status(400).json({ error: 'teamId is required' });
        }
        const state = await updateHacknightState({ xadowTargetTeam: teamId });
        broadcastUpdate({ type: 'hacknight-xadow-target', teamId, state });
        res.json({ success: true, teamId, state });
    } catch (error) {
        console.error('Error setting xad0w.b1ts target team', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/state', async (req, res) => {
    try {
        const patch = req.body || {};
        const state = await updateHacknightState(patch);
        broadcastUpdate({ type: 'hacknight-state', state });
        res.json({ success: true, state });
    } catch (error) {
        console.error('Error updating hacknight state', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/reset', async (req, res) => {
    try {
        const eventDate = (req.body && req.body.eventDate) || await getCurrentEventDate();
        await clearHacknightData(eventDate);
        const state = await updateHacknightState({ ...DEFAULT_VOTING_STATE, lastResetAt: new Date().toISOString() });
        broadcastUpdate({ type: 'hacknight-reset', eventDate, state });
        res.json({ success: true, eventDate, state });
    } catch (error) {
        console.error('Error resetting hacknight data', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hacknight/export', async (req, res) => {
    try {
        const eventDate = (req.body && req.body.eventDate) || await getCurrentEventDate();
        const pitchVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, appeal, surprise, time_score AS timeScore, content, effort, total FROM hacknight_votes_pitch WHERE event_date = ?', [eventDate]);
        const challengeVotes = await allAsync('SELECT event_date AS eventDate, team_id AS teamId, voter_id AS voterId, order_position AS orderPosition FROM hacknight_votes_challenge WHERE event_date = ?', [eventDate]);
        const xadowVotes = await allAsync('SELECT event_date AS eventDate, stage, team_id AS teamId, voter_id AS voterId, value FROM hacknight_votes_xadow WHERE event_date = ?', [eventDate]);
        const decision = await getAsync('SELECT event_date AS eventDate, team_id AS teamId, admin_id AS adminId, is_xadow_team AS isXadowTeam, decided_at AS decidedAt FROM hacknight_xadow_decision WHERE event_date = ?', [eventDate]);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="hacknight_votes_${sanitizeFileName(eventDate)}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);

        const writeTeamCsv = (prefix, grouped, columns, formatRow) => {
            Object.entries(grouped).forEach(([teamId, rows]) => {
                const header = columns.join(',');
                const lines = rows.map(formatRow);
                const csv = [header, ...lines].join('\n');
                archive.append(csv, { name: `${prefix}_${sanitizeFileName(teamId || 'unknown')}.csv` });
            });
        };

        const pitchGrouped = pitchVotes.reduce((acc, vote) => {
            if (!acc[vote.teamId]) {
                acc[vote.teamId] = [];
            }
            acc[vote.teamId].push(vote);
            return acc;
        }, {});

        writeTeamCsv('pitch', pitchGrouped, ['voter', 'appeal', 'surprise', 'time', 'content', 'effort', 'total'], (vote) => {
            return `${vote.voterId},${vote.appeal},${vote.surprise},${vote.timeScore},${vote.content},${vote.effort},${vote.total}`;
        });

        const challengeGrouped = challengeVotes.reduce((acc, vote) => {
            if (!acc[vote.teamId]) {
                acc[vote.teamId] = [];
            }
            acc[vote.teamId].push(vote);
            return acc;
        }, {});

        writeTeamCsv('challenge', challengeGrouped, ['voter', 'order'], (vote) => {
            return `${vote.voterId},${vote.orderPosition ?? ''}`;
        });

        const xadowDecisionVotes = xadowVotes.filter((vote) => vote.stage === 'decision');
        const xadowGuessVotes = xadowVotes.filter((vote) => vote.stage === 'guess');

        const decisionCsvLines = ['voter,value', ...xadowDecisionVotes.map((vote) => `${vote.voterId},${vote.value}`)];
        archive.append(decisionCsvLines.join('\n'), { name: 'xad0w_decision.csv' });

        const guessGrouped = xadowGuessVotes.reduce((acc, vote) => {
            const key = vote.teamId || vote.value || 'unknown';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(vote);
            return acc;
        }, {});

        writeTeamCsv('xad0w_guess', guessGrouped, ['voter', 'team'], (vote) => {
            return `${vote.voterId},${vote.value}`;
        });

        if (decision) {
            const summaryCsv = 'eventDate,teamId,isXadowTeam,decidedAt\n' + `${decision.eventDate},${decision.teamId || ''},${decision.isXadowTeam ? 1 : 0},${decision.decidedAt}`;
            archive.append(summaryCsv, { name: 'xad0w_summary.csv' });
        }

        archive.finalize();
    } catch (error) {
        console.error('Error exporting hacknight votes', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
});

// Get all admin data
app.get('/api/admin-data', (req, res) => {
    const connection = ensureDbOpen();
    connection.all('SELECT * FROM admin_data', (err, rows) => {
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
                if (row.data_type === 'hacknight' && row.data_key === 'hackerChallenge') {
                    if (!parsedValue.statusLabel && parsedValue.status) {
                        parsedValue.statusLabel = parsedValue.status;
                    }
                    if (!parsedValue.status) {
                        parsedValue.status = 'coming-soon';
                    }
                }
                if (row.data_type === 'season' && row.data_key === 'stats') {
                    if (typeof parsedValue.activeParticipants === 'undefined' && typeof parsedValue.activeHackers !== 'undefined') {
                        parsedValue.activeParticipants = parsedValue.activeHackers;
                    }
                    if (typeof parsedValue.tasksSolved === 'undefined' && typeof parsedValue.challengesSolved !== 'undefined') {
                        parsedValue.tasksSolved = parsedValue.challengesSolved;
                    }
                    delete parsedValue.activeHackers;
                    delete parsedValue.challengesSolved;
                }
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
    
    const connection = ensureDbOpen();
    connection.run(
        'UPDATE admin_data SET data_value = ?, updated_at = CURRENT_TIMESTAMP WHERE data_type = ? AND data_key = ?',
        [dataValue, type, key],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                // Insert if doesn't exist
                connection.run(
                    'INSERT INTO admin_data (data_type, data_key, data_value) VALUES (?, ?, ?)',
                    [type, key, dataValue],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        res.json({ success: true, id: this.lastID });
                        broadcastUpdate({ type, key, data });
                        // Create backup after successful insert
                        createBackup();
                    }
                );
            } else {
                res.json({ success: true });
                broadcastUpdate({ type, key, data });
                // Create backup after successful update
                createBackup();
            }
        }
    );
});

// Get specific data type
app.get('/api/admin-data/:type', (req, res) => {
    const { type } = req.params;
    
    const connection = ensureDbOpen();
    connection.all('SELECT * FROM admin_data WHERE data_type = ?', [type], (err, rows) => {
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

// Manual backup endpoint
app.post('/api/admin-data/backup', (req, res) => {
    try {
        createBackup();
        res.json({ success: true, message: 'Backup created successfully', path: backupPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restore from backup endpoint
app.post('/api/admin-data/restore', (req, res) => {
    try {
        const restored = restoreFromBackup();
        if (restored) {
            res.json({ success: true, message: 'Data restored from backup successfully' });
        } else {
            res.status(404).json({ error: 'No backup file found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clean duplicate data (run once if needed)
app.post('/api/admin-data/clean-duplicates', (req, res) => {
    const connection = ensureDbOpen();
    connection.all(`
        SELECT data_type, data_key, MIN(id) as keep_id
        FROM admin_data
        GROUP BY data_type, data_key
        HAVING COUNT(*) > 1
    `, (err, duplicates) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (duplicates.length === 0) {
            res.json({ success: true, message: 'No duplicates found', cleaned: 0 });
            return;
        }
        
        let cleaned = 0;
        duplicates.forEach(dup => {
            connection.run(
                'DELETE FROM admin_data WHERE data_type = ? AND data_key = ? AND id != ?',
                [dup.data_type, dup.data_key, dup.keep_id],
                function(err) {
                    if (!err) {
                        cleaned += this.changes;
                    }
                }
            );
        });
        
        setTimeout(() => {
            createBackup();
            res.json({ success: true, message: 'Duplicates cleaned successfully', cleaned });
        }, 1000);
    });
});

// Start server
// Listen on all network interfaces (0.0.0.0) to allow access from other devices
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
    console.log(`🗄️  SQLite database initialized`);
    console.log(`🌐 Server accessible on all network interfaces (0.0.0.0)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    console.log('\n🛑 Shutting down server...');
    const closeServer = () => {
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    };

    if (db && dbOpen) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('✅ Database connection closed');
            }
            dbOpen = false;
            db = null;
            closeServer();
        });
    } else {
        closeServer();
    }
});
