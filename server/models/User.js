// models/User.js
const { pool } = require('../config/db');

const User = {
  findByEmail: async (email) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },
  
  findById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },
  
  updatePassword: async (userId, hashedPassword) => {
    try {
      const result = await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [hashedPassword, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};

module.exports = User;