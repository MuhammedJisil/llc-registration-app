const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../config/db');

module.exports = function() {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const name = profile.displayName || '';
        
        // Get profile picture
        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
        
        // First check if user exists by Google ID
        const existingUserByGoogleId = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );
        
        if (existingUserByGoogleId.rows.length > 0) {
          // User already exists with this Google ID, update profile picture if available
          if (profilePicture) {
            await pool.query(
              'UPDATE users SET google_profile_picture = $1 WHERE google_id = $2',
              [profilePicture, profile.id]
            );
            
            // Get the updated user record
            const updatedUser = await pool.query(
              'SELECT * FROM users WHERE google_id = $1',
              [profile.id]
            );
            
            return done(null, updatedUser.rows[0]);
          }
          
          // If no profile picture, just return the existing user
          return done(null, existingUserByGoogleId.rows[0]);
        }
        
        // If no user with this Google ID, check if email exists
        const existingUserByEmail = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        
        if (existingUserByEmail.rows.length > 0) {
          // User with this email exists, update with Google ID and profile picture
          const updatedUser = await pool.query(
            'UPDATE users SET google_id = $1, google_profile_picture = $2 WHERE email = $3 RETURNING *',
            [profile.id, profilePicture, email]
          );
          
          return done(null, updatedUser.rows[0]);
        }
        
        // No user with this Google ID or email exists, create new user
        const newUser = await pool.query(
          'INSERT INTO users (full_name, email, google_id, google_profile_picture, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
          [name, email, profile.id, profilePicture]
        );
        
        return done(null, newUser.rows[0]);
      } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, false);
      }
    }
  ));

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });
};