const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute migration file
    const files = fs.readdirSync(path.join(__dirname, '../migrations'))
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
      await client.query(migrationSQL);
    }
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

