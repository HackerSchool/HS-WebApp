/**
 * Script para limpar dados duplicados do banco de dados
 * Executa: node cleanup-duplicates.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'admin_data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Procurando dados duplicados...');

db.all(`
    SELECT data_type, data_key, COUNT(*) as count
    FROM admin_data
    GROUP BY data_type, data_key
    HAVING COUNT(*) > 1
`, (err, duplicates) => {
    if (err) {
        console.error('❌ Erro ao procurar duplicados:', err);
        db.close();
        process.exit(1);
    }
    
    if (duplicates.length === 0) {
        console.log('✅ Nenhum dado duplicado encontrado!');
        db.close();
        process.exit(0);
    }
    
    console.log(`⚠️  Encontrados ${duplicates.length} conjuntos de dados duplicados:`);
    duplicates.forEach(dup => {
        console.log(`   - ${dup.data_type}.${dup.data_key} (${dup.count} cópias)`);
    });
    
    console.log('\n🧹 Limpando duplicados (mantendo o registro mais antigo)...');
    
    let cleaned = 0;
    let processed = 0;
    
    duplicates.forEach(dup => {
        // Mantém o registro com ID menor (mais antigo) e deleta os outros
        db.run(
            `DELETE FROM admin_data 
             WHERE data_type = ? AND data_key = ? 
             AND id NOT IN (
                 SELECT MIN(id) 
                 FROM admin_data 
                 WHERE data_type = ? AND data_key = ?
             )`,
            [dup.data_type, dup.data_key, dup.data_type, dup.data_key],
            function(err) {
                processed++;
                
                if (err) {
                    console.error(`❌ Erro ao limpar ${dup.data_type}.${dup.data_key}:`, err);
                } else {
                    cleaned += this.changes;
                    console.log(`✅ ${dup.data_type}.${dup.data_key} - removidos ${this.changes} duplicados`);
                }
                
                // Quando todos forem processados, fecha o banco
                if (processed === duplicates.length) {
                    console.log(`\n✨ Limpeza concluída! ${cleaned} registros duplicados foram removidos.`);
                    db.close();
                    process.exit(0);
                }
            }
        );
    });
});

