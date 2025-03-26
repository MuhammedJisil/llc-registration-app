const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {pool} = require('../config/db');

// Get user registration notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT 
        rn.id, 
        rn.registration_id, 
        rn.message, 
        rn.message_type, 
        rn.is_read, 
        rn.created_at,
        lr.company_name
      FROM registration_notifications rn
      JOIN llc_registrations lr ON rn.registration_id = lr.id
      WHERE rn.user_id = $1
      ORDER BY rn.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json({
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a specific notification as read
router.patch('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const query = `
      UPDATE registration_notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      UPDATE registration_notifications
      SET is_read = true
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    res.json({
      updatedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;