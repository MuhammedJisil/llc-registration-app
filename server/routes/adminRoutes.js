const express = require('express');
const router = express.Router();
const {pool} = require('../config/db'); // Your database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Middleware to check if user is authenticated as admin
const isAdminAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const decodedToken = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    
    // Verify this is an admin token
    if (!decodedToken.isAdmin) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }
    
    req.adminId = decodedToken.id;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin login route
router.post('/login', [
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Find admin with the provided username
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        isAdmin: true 
      },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Protected route to check admin authentication
router.get('/verify', isAdminAuthenticated, (req, res) => {
  res.status(200).json({ message: 'Admin authenticated successfully' });
});


// Get all LLC registrations with user details
router.get('/registrations', isAdminAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic query based on filters
    let query = `
      SELECT 
        r.id, 
        r.company_name, 
        r.company_type, 
        r.state, 
        r.status, 
        r.payment_status, 
        r.created_at, 
        r.updated_at,
        u.full_name as user_name,
        u.email as user_email,
        bc.name as category
      FROM llc_registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN business_categories bc ON r.category_id = bc.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Add status filter
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      query += ` AND (
        r.company_name ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add pagination
    query += ` 
      ORDER BY r.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM llc_registrations r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
      ${status ? `AND r.status = $1` : ''}
      ${search ? `AND (
        r.company_name ILIKE $${status ? 2 : 1} OR 
        u.full_name ILIKE $${status ? 2 : 1} OR 
        u.email ILIKE $${status ? 2 : 1}
      )` : ''}
    `;

    const [registrationsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, status || search ? queryParams.slice(0, -2) : [])
    ]);

    res.status(200).json({
      registrations: registrationsResult.rows,
      totalRegistrations: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed information for a specific registration
router.get('/registrations/:id', isAdminAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    // Get registration details
    const registrationResult = await pool.query(
      `SELECT 
        r.*, 
        u.full_name as user_name, 
        u.email as user_email,
        bc.name as category
      FROM llc_registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN business_categories bc ON r.category_id = bc.id
      WHERE r.id = $1`,
      [id]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const registration = registrationResult.rows[0];

    // Get owners
    const ownersResult = await pool.query(
      `SELECT full_name, ownership_percentage 
       FROM llc_owners 
       WHERE registration_id = $1`,
      [id]
    );

    // Get address
    const addressResult = await pool.query(
      `SELECT street, city, state_province, postal_code, country 
       FROM llc_addresses 
       WHERE registration_id = $1`,
      [id]
    );

    // Get documents
    const documentsResult = await pool.query(
      `SELECT 
        id_type, 
        document_type, 
        file_name, 
        file_path 
      FROM identification_documents
      WHERE registration_id = $1`,
      [id]
    );

    res.status(200).json({
      registration,
      owners: ownersResult.rows,
      address: addressResult.rows[0] || null,
      documents: documentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update registration status
router.patch('/registrations/:id/status', isAdminAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE llc_registrations 
       SET status = $1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.status(200).json({
      message: 'Registration status updated successfully',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard statistics
router.get('/dashboard-stats', isAdminAuthenticated, async (req, res) => {
  try {
    const statsQueries = {
      totalRegistrations: `SELECT COUNT(*) as count FROM llc_registrations`,
      registrationsByStatus: `
        SELECT status, COUNT(*) as count 
        FROM llc_registrations 
        GROUP BY status
      `,
      registrationsByMonth: `
        SELECT 
          DATE_TRUNC('month', created_at) as month, 
          COUNT(*) as count 
        FROM llc_registrations 
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 6
      `,
      recentRegistrations: `
        SELECT 
          r.id, 
          r.company_name, 
          r.status, 
          r.created_at,
          u.full_name as user_name
        FROM llc_registrations r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC 
        LIMIT 5
      `
    };

    const stats = {};
    for (const [key, query] of Object.entries(statsQueries)) {
      const result = await pool.query(query);
      stats[key] = result.rows;
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;