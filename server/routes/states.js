const express = require('express');
const router = express.Router();
  const { pool } = require('../config/db');

// Get all states with fees
router.get('/states', async (req, res) => {
  try {
    const result = await pool.query('SELECT state_name as name, fee FROM state_fees ORDER BY state_name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;