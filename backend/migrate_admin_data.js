const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'admin_data.db');

console.log('🔧 Starting admin_data migration...');
console.log('📂 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    console.log('🗑️  Dropping old index if exists...');
    db.run('DROP INDEX IF EXISTS idx_admin_data_type_key', (err) => {
        if (err) {
            console.error('❌ Error dropping index:', err);
        } else {
            console.log('✅ Old index dropped');
        }
    });

    console.log('🔍 Checking for duplicates...');
    db.all(`
        SELECT data_type, data_key, COUNT(*) as count 
        FROM admin_data 
        GROUP BY data_type, data_key 
        HAVING count > 1
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error checking duplicates:', err);
            db.close();
            process.exit(1);
        }

        if (rows.length > 0) {
            console.log(`⚠️  Found ${rows.length} duplicate entries:`);
            rows.forEach(row => {
                console.log(`   - ${row.data_type}.${row.data_key} (${row.count} entries)`);
            });

            console.log('🧹 Cleaning duplicates...');
            
            // For each duplicate, keep only the most recent one
            const cleanupPromises = rows.map(row => {
                return new Promise((resolve, reject) => {
                    // First, get the ID of the most recent entry
                    db.get(`
                        SELECT id FROM admin_data 
                        WHERE data_type = ? AND data_key = ? 
                        ORDER BY updated_at DESC, id DESC 
                        LIMIT 1
                    `, [row.data_type, row.data_key], (err, keepRow) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Delete all other entries
                        db.run(`
                            DELETE FROM admin_data 
                            WHERE data_type = ? AND data_key = ? AND id != ?
                        `, [row.data_type, row.data_key, keepRow.id], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log(`   ✓ Cleaned ${row.data_type}.${row.data_key}`);
                                resolve();
                            }
                        });
                    });
                });
            });

            Promise.all(cleanupPromises)
                .then(() => {
                    console.log('✅ All duplicates cleaned');
                    createUniqueIndex();
                })
                .catch(err => {
                    console.error('❌ Error cleaning duplicates:', err);
                    db.close();
                    process.exit(1);
                });
        } else {
            console.log('✅ No duplicates found');
            createUniqueIndex();
        }
    });
});

function createUniqueIndex() {
    console.log('🔨 Creating unique index...');
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_data_type_key ON admin_data (data_type, data_key)', (err) => {
        if (err) {
            console.error('❌ Error creating unique index:', err);
            db.close();
            process.exit(1);
        }

        console.log('✅ Unique index created successfully');
        
        // Verify the index
        db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='admin_data'", (err, rows) => {
            if (err) {
                console.error('❌ Error verifying index:', err);
            } else {
                console.log('📋 Indexes on admin_data table:');
                rows.forEach(row => console.log(`   - ${row.name}`));
            }

            db.close(() => {
                console.log('✅ Migration complete! You can now restart the server.');
                process.exit(0);
            });
        });
    });
}

