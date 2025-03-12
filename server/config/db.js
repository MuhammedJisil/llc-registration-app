
/******** config/db.js ********/
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Database queries
const db = {
  connect: async () => {
    try {
      const client = await pool.connect();
      client.release();
      return true;
    } catch (error) {
      throw error;
    }
  },
  query: (text, params) => pool.query(text, params),
};

module.exports = { db };
