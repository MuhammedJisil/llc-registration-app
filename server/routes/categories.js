const express = require('express');
const router = express.Router();
const { pool } = require('../config/db'); // Ensure correct import

// Get all business categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM business_categories ORDER BY name');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Something went wrong, please try again later.' });
  }
});

module.exports = router;
