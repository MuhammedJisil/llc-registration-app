const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { db } = require('../config/db'); 
const authController = require('../controllers/authController');



// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '1d' }
    );
    
    // Extract user profile information
    const userName = req.user.full_name || '';
    const userEmail = req.user.email || '';
    
    // Get profile picture from Google profile if available
    let userPicture = '';
    if (req.user.google_profile_picture) {
      userPicture = req.user.google_profile_picture;
    }
    
    // Fix the URL format - ensure there's no double slash
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/auth-callback', frontendUrl).toString();
    
    // Redirect to frontend with token and user profile data
    res.redirect(
      `${redirectUrl}?token=${token}&name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}&picture=${encodeURIComponent(userPicture)}`
    );
  }
);

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = await db.query(
      'INSERT INTO users (full_name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, full_name, email, created_at',
      [fullName, email, hashedPassword]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '1d' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        fullName: user.rows[0].full_name,
        email: user.rows[0].email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-reset-token/:token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;