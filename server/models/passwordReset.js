const { db } = require('../config/db');


// Password reset model functions
const PasswordReset = {
    create: async (userId, token, expiresAt) => {
      // Delete any existing tokens for this user
      await db.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
      
      // Create a new token
      const result = await db.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
        [userId, token, expiresAt]
      );
      return result.rows[0];
    },
    
    findByToken: async (token) => {
      const result = await db.query(
        'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      return result.rows[0];
    },
    
    delete: async (token) => {
      await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
    },
    
    cleanup: async () => {
      // Delete expired tokens
      await db.query('DELETE FROM password_resets WHERE expires_at < NOW()');
    }
  };
  
  module.exports = { PasswordReset };
  
  