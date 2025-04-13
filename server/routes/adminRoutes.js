const express = require('express');
const router = express.Router();
const {pool} = require('../config/db'); // Your database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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



//  route to get all users with registration status
router.get('/users', isAdminAuthenticated, async (req, res) => {   
  try {     
    const { page = 1, limit = 10, search, registrationStatus } = req.query;     
    const offset = (page - 1) * limit;      

    // Updated stats query to correctly count total and registered users
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM llc_registrations) as registered_users,
        COUNT(DISTINCT id) as new_users
      FROM users 
      WHERE is_new_user = true
    `;

    let query = `
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.created_at,
        u.is_new_user,
        COALESCE(llc.registration_count, 0) as registration_count,
        MAX(r.created_at) as last_registration_at
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as registration_count 
        FROM llc_registrations
        GROUP BY user_id
      ) llc ON u.id = llc.user_id
      LEFT JOIN llc_registrations r ON u.id = r.user_id
      WHERE 1=1
    `;      

    const queryParams = [];
    let paramIndex = 1;      

    // Add search filter     
    if (search) {       
      query += ` AND (
        u.full_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`;       
      queryParams.push(`%${search}%`);       
      paramIndex++;     
    }      

    // Add registration status filter     
    if (registrationStatus === 'registered') {       
      query += ` AND llc.registration_count > 0`;     
    } else if (registrationStatus === 'unregistered') {       
      query += ` AND (llc.registration_count IS NULL OR llc.registration_count = 0)`;     
    }      

    // Group to ensure unique users     
    query += `
      GROUP BY 
        u.id, u.full_name, u.email, u.created_at, u.is_new_user, llc.registration_count
      ORDER BY last_registration_at DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;     
    queryParams.push(limit, offset);      

    // Get total count query with similar filtering     
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as registration_count 
        FROM llc_registrations
        GROUP BY user_id
      ) llc ON u.id = llc.user_id
      WHERE 1=1
      ${search ? `AND (
        u.full_name ILIKE $1 OR 
        u.email ILIKE $1
      )` : ''}
      ${registrationStatus === 'registered' ? ` AND llc.registration_count > 0` : ''}
      ${registrationStatus === 'unregistered' ? ` AND (llc.registration_count IS NULL OR llc.registration_count = 0)` : ''}
    `;      

    const [usersResult, countResult, statsResult] = await Promise.all([       
      pool.query(query, queryParams),
      pool.query(countQuery, search ? [queryParams[0]] : []),
      pool.query(statsQuery)
    ]);      

    res.status(200).json({       
      users: usersResult.rows,
      totalUsers: parseInt(countResult.rows[0].total),
      stats: statsResult.rows[0],
      page: parseInt(page),
      limit: parseInt(limit)
    });   
  } catch (error) {     
    console.error('Error fetching users:', error);     
    res.status(500).json({ error: 'Internal server error' });   
  } 
});

// Updated route to get admin-specific notifications
router.get('/admin-notifications', isAdminAuthenticated, async (req, res) => {
 try {
    const query = `
      SELECT 
        an.id, 
        an.user_id, 
        an.registration_id, 
        an.type, 
        an.message, 
        an.is_read, 
        an.created_at,
        u.full_name,
        r.company_name
      FROM admin_notifications an
      JOIN users u ON an.user_id = u.id
      LEFT JOIN llc_registrations r ON an.registration_id = r.id
      ORDER BY an.created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query);

    res.status(200).json({
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark admin notification as read
router.patch('/admin-notifications/:id/read', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE admin_notifications 
      SET is_read = true 
      WHERE id = $1
    `;
    await pool.query(query, [id]);
    res.status(200).json({ message: 'Admin notification marked as read' });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's registrations
router.get('/users/:userId/registrations', isAdminAuthenticated, async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        r.id, 
        r.company_name, 
        r.company_type, 
        r.state, 
        r.status, 
        r.created_at,
        r.payment_status,
        bc.name as category
      FROM llc_registrations r
      LEFT JOIN business_categories bc ON r.category_id = bc.id
      WHERE r.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    // Add status filter
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Add pagination
    query += ` 
      ORDER BY r.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // Get total count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM llc_registrations r
      WHERE r.user_id = $1
      ${status ? ` AND r.status = $2` : ''}
    `;

    const [registrationsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, status ? [userId, status] : [userId])
    ]);

    res.status(200).json({
      registrations: registrationsResult.rows,
      totalRegistrations: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific registration details with separated documents
router.get('/registrations/:id/details', isAdminAuthenticated, async (req, res) => {
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

    // Get ID documents
    const idDocumentResult = await pool.query(
      `SELECT 
        id_type as "idType", 
        file_name as "idFileName", 
        file_path as "idFilePath"
      FROM identification_documents
      WHERE registration_id = $1 AND document_type = 'id_proof'`,
      [id]
    );

    // Get additional documents
    const additionalDocsResult = await pool.query(
      `SELECT 
        file_name as "fileName", 
        file_path as "filePath"
      FROM identification_documents
      WHERE registration_id = $1 AND document_type = 'additional'`,
      [id]
    );

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

    res.status(200).json({
      registration,
      idDocuments: idDocumentResult.rows,
      additionalDocuments: additionalDocsResult.rows,
      owners: ownersResult.rows,
      address: addressResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete registration
router.delete('/registrations/:id', isAdminAuthenticated, async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete related records first
    await client.query('DELETE FROM llc_owners WHERE registration_id = $1', [id]);
    await client.query('DELETE FROM llc_addresses WHERE registration_id = $1', [id]);
    await client.query('DELETE FROM identification_documents WHERE registration_id = $1', [id]);
    await pool.query('DELETE FROM payments WHERE registration_id = $1',[id]);

    // Then delete the registration
    const result = await client.query(
      'DELETE FROM llc_registrations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Registration not found' });
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Registration deleted successfully',
      registration: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
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
      // Total users query
      totalUsers: `SELECT COUNT(*) as count FROM users`,
      
      // New users query
      newUsers: `SELECT COUNT(*) as count FROM users WHERE is_new_user = true`,
      
      // Registered users query (distinct users with registrations)
      registeredUsers: `SELECT COUNT(DISTINCT user_id) as count FROM llc_registrations`,
      
      // Existing queries remain the same
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

// Get user details by ID
router.get('/users/:userId', isAdminAuthenticated, async (req, res) => {
  const { userId } = req.params;

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

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get(
  '/registrations/:registrationId/notifications', 
  isAdminAuthenticated,
  async (req, res) => {
    try {
      const { registrationId } = req.params;

      // Validate registration exists and belongs to the user
      const registrationQuery = await pool.query(
        'SELECT * FROM llc_registrations WHERE id = $1', 
        [registrationId]
      );

      if (registrationQuery.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Registration not found' 
        });
      }

      // Fetch notifications for the registration
      const notificationsQuery = await pool.query(
        `SELECT 
          id, 
          message, 
          message_type, 
          is_read, 
          created_at 
        FROM registration_notifications 
        WHERE registration_id = $1 
        ORDER BY created_at DESC`,
        [registrationId]
      );

      res.status(200).json({
        notifications: notificationsQuery.rows
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }
);

// Create a new notification for a registration
router.post(
  '/registrations/:registrationId/notifications', 
  isAdminAuthenticated,
  async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { message, messageType } = req.body;

      // Input validation
      if (!message || !messageType) {
        return res.status(400).json({ 
          error: 'Message and message type are required' 
        });
      }

      // Validate registration exists
      const registrationCheck = await pool.query(
        'SELECT user_id FROM llc_registrations WHERE id = $1',
        [registrationId]
      );

      if (registrationCheck.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Registration not found' 
        });
      }

      // Get the user ID associated with the registration
      const userId = registrationCheck.rows[0].user_id;

      // Insert notification
      const insertQuery = `
        INSERT INTO registration_notifications 
        (registration_id, user_id, message, message_type) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, message, message_type, is_read, created_at
      `;

      const result = await pool.query(insertQuery, [
        registrationId, 
        userId, 
        message, 
        messageType
      ]);

      res.status(201).json({
        notification: result.rows[0],
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ 
        error: 'Failed to create notification',
        details: error.message 
      });
    }
  }
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read', 
  isAdminAuthenticated,
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      // Update notification read status
      const updateQuery = `
        UPDATE registration_notifications 
        SET is_read = true 
        WHERE id = $1 
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [notificationId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Notification not found' 
        });
      }

      res.status(200).json({
        notification: result.rows[0],
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ 
        error: 'Failed to update notification',
        details: error.message 
      });
    }
  }
);

// Get all notifications for a user
router.get(
  '/users/:userId/notifications', 
  isAdminAuthenticated,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      // Base query to fetch notifications
      let query = `
        SELECT 
          n.id, 
          n.message, 
          n.message_type, 
          n.is_read, 
          n.created_at,
          r.company_name
        FROM registration_notifications n
        JOIN llc_registrations r ON n.registration_id = r.id
        WHERE n.user_id = $1
      `;

      const queryParams = [userId];

      // Add filter for read/unread status
      if (status === 'read') {
        query += ' AND n.is_read = true';
      } else if (status === 'unread') {
        query += ' AND n.is_read = false';
      }

      // Order by most recent first
      query += ' ORDER BY n.created_at DESC';

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        notifications: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve notifications',
        details: error.message 
      });
    }
  }
);

router.get("/registrations/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;
  const tokenFromQuery = req.query.token;
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  const agencyName = "Legal Formation Services"; // You can change this
  const tempDir = path.join(__dirname, '../temp'); // Temp directory for downloaded images

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Add validation
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Get token from query or header
  let token;
  if (tokenFromQuery) {
    token = tokenFromQuery;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Verify admin token
  try {
    // Verify admin is authenticated - using JWT verification
    let adminId;
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      adminId = decoded.id;
      
      // Verify admin exists
      const adminResult = await pool.query(
        "SELECT * FROM admins WHERE id = $1",
        [adminId]
      );
      
      if (adminResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Function to download image from URL
    const downloadImage = async (url, localPath) => {
      try {
        console.log(`Downloading image from: ${url}`);
        
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream',
          timeout: 15000 // 15 second timeout
        });
        
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(localPath);
          response.data.pipe(writer);
          
          writer.on('finish', () => {
            console.log(`Successfully downloaded image to: ${localPath}`);
            resolve(localPath);
          });
          
          writer.on('error', (err) => {
            console.error(`Error writing image to file: ${err.message}`);
            reject(err);
          });
        });
      } catch (error) {
        console.error(`Error downloading image from ${url}:`, error.message);
        throw error;
      }
    };

    // Clean up temp files when done
    const cleanupTempFiles = (filePaths) => {
      filePaths.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Error deleting temp file ${filePath}:`, err);
        }
      });
    };

    const tempFiles = []; // Track temp files for cleanup

    // Get the registration information
    const registrationResult = await pool.query(
      "SELECT * FROM llc_registrations WHERE id = $1",
      [id]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    const registration = registrationResult.rows[0];

    // Fetch address information
    const addressResult = await pool.query(
      "SELECT * FROM llc_addresses WHERE registration_id = $1",
      [id]
    );
    
    const address = addressResult.rows.length > 0 ? addressResult.rows[0] : null;
    
    // Fetch owners information
    const ownersResult = await pool.query(
      "SELECT * FROM llc_owners WHERE registration_id = $1 ORDER BY ownership_percentage DESC",
      [id]
    );
    
    const owners = ownersResult.rows;
    
    // Fetch identification documents
    const documentsResult = await pool.query(
      "SELECT * FROM identification_documents WHERE registration_id = $1 AND document_type = 'id_proof'",
      [id]
    );
    
    const idDocuments = documentsResult.rows;

    // Create a PDF document
    const doc = new PDFDocument({
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      info: {
        Title: `LLC Registration Summary - ${registration.company_name}`,
        Author: agencyName,
        Subject: 'LLC Registration Documents'
      }
    });
    
    // Set headers for file download - optimized for mobile and desktop
    const safeFileName = registration.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Different headers for mobile vs desktop browsers
    if (isMobile) {
      // For mobile browsers - inline content helps with iOS Safari
      res.setHeader("Content-Disposition", `inline; filename=LLC_Summary_${safeFileName}_${id}.pdf`);
    } else {
      // For desktop browsers - attachment works better
      res.setHeader("Content-Disposition", `attachment; filename=LLC_Summary_${safeFileName}_${id}.pdf`);
    }
    
    res.setHeader("Content-Type", "application/pdf");
    // Add cache control to prevent caching issues on mobile
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Pipe the document to the response
    doc.pipe(res);

    // Agency Logo and Header
    const logoPath = './public/assets/logo.png'; // Adjust with your actual logo path
    try {
      doc.image(logoPath, 50, 50, { width: 60, height: 60 });
    } catch (err) {
      // If logo fails to load, just use text
      doc.fontSize(24).text(agencyName, 50, 50, { align: "left" });
    }
    
    // Add Agency Name with strong styling
    doc.fontSize(24).text(agencyName, 160, 50, { align: "left" });
    doc.fontSize(12).text("LLC Registration Services", 160, 80, { align: "left" });
    
    // Add current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.fontSize(10).text(`Generated on: ${currentDate}`, 50, 100, { align: "right" });
    
    // Add horizontal line
    doc.moveTo(50, 120).lineTo(550, 120).stroke();
    
    doc.moveDown(2);

    // PDF Content - Title
    doc.fontSize(22).text("LLC Registration Summary", { align: "center" });
    doc.moveDown();

    // Company details section
    doc.fontSize(16).text("Company Details", 50, 170);
    doc.moveDown(0.5);
    
    // Info table styling
    const drawInfoRow = (label, value, yPos) => {
      doc.fontSize(11).font('Helvetica-Bold').text(label, 70, yPos);
      doc.fontSize(11).font('Helvetica').text(value || "N/A", 250, yPos);
    };
    
    let yPos = 195;
    
    drawInfoRow("Company Name:", registration.company_name, yPos);
    yPos += 20;
    drawInfoRow("Company Type:", registration.company_type || "LLC", yPos);
    yPos += 20;
    drawInfoRow("Registration State:", registration.state, yPos);
    yPos += 20;
    drawInfoRow("Payment Status:", registration.payment_status || "Unpaid", yPos);
    yPos += 20;
    drawInfoRow("Registration Date:", new Date(registration.created_at).toLocaleDateString(), yPos);
    yPos += 20;
    drawInfoRow("User ID:", registration.user_id, yPos);
    
    yPos += 40;
    
    // Address section
    doc.fontSize(16).text("Address", 50, yPos);
    yPos += 25;
    
    if (address) {
      doc.fontSize(11).text(`${address.street}`, 70, yPos);
      yPos += 20;
      doc.fontSize(11).text(`${address.city}, ${address.state_province} ${address.postal_code}`, 70, yPos);
      yPos += 20;
      doc.fontSize(11).text(`${address.country}`, 70, yPos);
    } else {
      doc.fontSize(11).text("No address information available", 70, yPos);
    }
    
    yPos += 40;
    
    // Owners section
    doc.fontSize(16).text("Company Owners", 50, yPos);
    yPos += 25;
    
    if (owners.length > 0) {
      // Table header
      doc.fontSize(11).font('Helvetica-Bold').text("Name", 70, yPos);
      doc.fontSize(11).font('Helvetica-Bold').text("Ownership %", 350, yPos);
      yPos += 20;
      
      // Add horizontal line
      doc.moveTo(70, yPos).lineTo(500, yPos).stroke();
      yPos += 10;
      
      // Owner rows
      owners.forEach(owner => {
        doc.fontSize(11).font('Helvetica').text(owner.full_name, 70, yPos);
        doc.fontSize(11).font('Helvetica').text(`${owner.ownership_percentage}%`, 350, yPos);
        yPos += 20;
      });
    } else {
      doc.fontSize(11).text("No owner information available", 70, yPos);
      yPos += 20;
    }
    
    // Check if we need a new page for ID documents
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    } else {
      yPos += 40;
    }
    
    // ID Documents section
    doc.fontSize(16).text("Identification Documents", 50, yPos);
    yPos += 25;
    
    if (idDocuments.length > 0) {
      for (const document of idDocuments) {
        doc.fontSize(11).font('Helvetica-Bold').text(`Document Type: ${document.id_type || 'ID Proof'}`, 70, yPos);
        yPos += 20;
        
        // Try to include the image from Cloudinary URL
        if (document.file_path) {
          // Check if it's a PDF
          if (document.file_name.toLowerCase().endsWith('.pdf')) {
            // Create a clickable link for PDF
            doc.fontSize(11)
               .fillColor('blue')
               .text(`PDF Document: ${document.file_name}`, 70, yPos, {
                 link: document.file_path,
                 underline: true
               });
            yPos += 20;
            
            // Add the full URL as text for reference
            doc.fontSize(10)
               .fillColor('black')
               .text(`URL: ${document.file_path}`, 70, yPos);
            yPos += 20;
          } 
          // Handle image documents
          else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(document.file_name)) {
            try {
              // Add a note about the file
              doc.fontSize(10).text(`File: ${document.file_name}`, 70, yPos);
              yPos += 15;
              
              // If image doesn't fit on current page, add a new page
              if (yPos + 200 > 750) {
                doc.addPage();
                yPos = 50;
              }
              
              // Download the image to a temporary file
              const tempFilePath = path.join(tempDir, `${uuidv4()}_${document.file_name}`);
              tempFiles.push(tempFilePath); // Track for cleanup
              
              console.log(`Attempting to download image: ${document.file_path}`);
              console.log(`Temporary file path: ${tempFilePath}`);
              
              // Now download and embed the image
              try {
                await downloadImage(document.file_path, tempFilePath);
                
                // Verify the file was downloaded and has content
                const fileStats = fs.statSync(tempFilePath);
                console.log(`Downloaded file size: ${fileStats.size} bytes`);
                
                if (fileStats.size > 0) {
                  // Calculate image dimensions to fit nicely on the page
                  const imgWidth = 300;
                  const imgHeight = 200;
                  
                  // Add the image to the PDF
                  doc.image(tempFilePath, 70, yPos, {
                    fit: [imgWidth, imgHeight],
                    align: 'center',
                    valign: 'center'
                  });
                  
                  yPos += imgHeight + 30;
                } else {
                  throw new Error("Downloaded file is empty");
                }
              } catch (imageError) {
                console.error("Error processing image:", imageError);
                doc.fontSize(10).text(`Unable to display image. URL: ${document.file_path}`, 70, yPos);
                doc.rect(70, yPos + 15, 300, 100).stroke();
                doc.fontSize(10).text("Image could not be processed", 70 + 150 - 60, yPos + 50);
                yPos += 130;
              }
            } catch (imgErr) {
              console.error("Error handling image:", imgErr);
              doc.fontSize(10).text(`Unable to display image. URL: ${document.file_path}`, 70, yPos);
              yPos += 20;
            }
          }
        }
      }
    } else {
      doc.fontSize(11).text("No identification documents available", 70, yPos);
    }
    
    // Add footer
    const totalPages = doc.bufferedPageRange().count;
    if (totalPages > 1) {  // Ensure we have more than one page
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        
        // Add footer line
        doc.moveTo(50, 760).lineTo(550, 760).stroke();
        
        // Add page number and website
        doc.fontSize(10).text(
          `Page ${i + 1} of ${totalPages}`,
          50, 770,
          { align: 'right' }
        );
        
        doc.fontSize(10).text(
          `${agencyName} - Confidential LLC Registration Document`,
          50, 770,
          { align: 'left' }
        );
      }
    }

    // Finalize PDF
    doc.end();
    
    // Event handler for when the PDF is completely written
    doc.on('end', () => {
      // Clean up temp files after PDF is sent
      cleanupTempFiles(tempFiles);
    });
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Clean up temp files in case of error
    cleanupTempFiles(tempFiles);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;