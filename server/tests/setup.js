// Test setup file
// Ensure database is ready before running tests

const { pool } = require('../db');

beforeAll(async () => {
  // Wait a bit for database connection
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
});

