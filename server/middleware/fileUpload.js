const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      // Determine folder based on field name
      if (file.fieldname === 'idDocument') {
        return 'id_documents';
      } else if (file.fieldname === 'additionalDocuments') {
        return 'additional_documents';
      } else {
        return 'uploads';
      }
    },
    // Use the original filename as part of the public_id
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = path.parse(file.originalname).name;
      return `${filename}-${uniqueSuffix}`;
    },
    // Set allowed formats
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    // Set resource type to auto to handle different file types
    resource_type: 'auto',
    // Transform for images (optional)
    transformation: [{ width: 1000, crop: "limit" }]
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

const deleteFile = async (publicId, resourceType) => {
  try {
    if (!publicId) return { success: false, message: 'No public ID provided' };

    console.log('Deleting file:', { publicId, resourceType });

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return { 
      success: result.result === 'ok' || result.result === 'not found', 
      message: result.result 
    };
  } catch (error) {
    console.error(`Error deleting file from Cloudinary:`, error);
    return { success: false, message: error.message };
  }
};


const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Parse the URL
    const urlParts = new URL(url);
    
    // Split the path
    const pathSegments = urlParts.pathname.split('/');
    
    // Find the index after 'upload'
    const uploadIndex = pathSegments.indexOf('upload');
    
    if (uploadIndex === -1) return null;

    // Get segments after version (skip version segment)
    const pathWithoutVersion = pathSegments.slice(uploadIndex + 2);
    
    // Join the remaining segments and decode
    const publicId = pathWithoutVersion.join('/')
      .replace(/\.(pdf|png|jpg|jpeg)$/, '');  // Remove file extension

    // Decode URL-encoded characters
    return decodeURIComponent(publicId);
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

module.exports = {
  upload,
  deleteFile,
  getPublicIdFromUrl,
  cloudinary
};