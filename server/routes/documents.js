const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Get the uploads directory
const uploadsDir = path.join(__dirname, '../uploads');

// Add endpoint to download files
router.get('/documents/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(uploadsDir, fileName);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  } else {
    return res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;