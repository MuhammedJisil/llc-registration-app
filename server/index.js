const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require("body-parser");


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

