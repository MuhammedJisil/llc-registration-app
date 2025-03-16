const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const idDocumentsDir = path.join(uploadsDir, 'id_documents');
const additionalDocsDir = path.join(uploadsDir, 'additional_documents');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(idDocumentsDir)) fs.mkdirSync(idDocumentsDir);
if (!fs.existsSync(additionalDocsDir)) fs.mkdirSync(additionalDocsDir);

// Configure file storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine directory based on field name
    if (file.fieldname === 'idDocument') {
      cb(null, idDocumentsDir);
    } else if (file.fieldname.startsWith('additionalDocument_')) {
      cb(null, additionalDocsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Set up multer for file uploads with size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpeg, .jpg, .png and .pdf formats are allowed'));
  }
});

module.exports = upload;