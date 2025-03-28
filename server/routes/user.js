const express = require('express');
const router = express.Router();
const {pool} = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        full_name, 
        email, 
        created_at
      FROM users 
      WHERE id = $1
    `;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user details, excluding sensitive information
    const user = {
      id: result.rows[0].id,
      full_name: result.rows[0].full_name,
      email: result.rows[0].email,
      created_at: result.rows[0].created_at
    };

    res.status(200).json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

module.exports = router;
