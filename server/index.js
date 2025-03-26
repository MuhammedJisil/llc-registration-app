const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require("body-parser");
const {pool} = require('./config/db'); // Your database connection
const bcrypt = require('bcrypt');


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

async function initializeAdmins() {
  try {
    const checkResult = await pool.query('SELECT COUNT(*) FROM admins');
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Admin accounts already exist. Skipping initialization.');
      return;
    }
    
    const adminCredentials = [
      {
        username: process.env.ADMIN1_USERNAME,
        password: process.env.ADMIN1_PASSWORD,
        full_name: process.env.ADMIN1_FULLNAME || 'Super Admin'
      },
      {
        username: process.env.ADMIN2_USERNAME,
        password: process.env.ADMIN2_PASSWORD,
        full_name: process.env.ADMIN2_FULLNAME || 'Admin Manager'
      },
      {
        username: process.env.ADMIN3_USERNAME,
        password: process.env.ADMIN3_PASSWORD,
        full_name: process.env.ADMIN3_FULLNAME || 'Support Admin'
      }
    ];
    
    console.log('Starting admin initialization...');
    
    await pool.query('BEGIN');
    
    for (const admin of adminCredentials) {
      if (!admin.username || !admin.password) {
        console.warn(`Skipping admin creation for ${admin.username || 'undefined'} due to missing credentials`);
        continue;
      }
      
      console.log(`Creating admin account for ${admin.username}...`);
      
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      
      await pool.query(
        'INSERT INTO admins (username, password, full_name) VALUES ($1, $2, $3)',
        [admin.username, hashedPassword, admin.full_name]
      );
    }
    
    await pool.query('COMMIT');
    console.log('Admin accounts initialized successfully!');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error initializing admin accounts:', error);
  }
}


// Run the initialization
initializeAdmins().catch(console.error);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Serve uploaded files
app.use(bodyParser.json());


// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport
require('./config/passport')();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/user'));
app.use('/api',  require('./routes/states'));
app.use('/api',  require('./routes/categories'));
app.use('/api',  require('./routes/llcRegistrations'));
app.use('/api', require('./routes/documents'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

