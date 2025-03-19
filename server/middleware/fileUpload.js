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

// Function to delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return { success: false, message: 'No public ID provided' };
    
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok', message: result.result };
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return { success: false, message: error.message };
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // URL format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.ext
    // Extract the part after the last '/' and before the file extension
    const splitUrl = url.split('/');
    const fileWithExtension = splitUrl[splitUrl.length - 1];
    const fileWithoutExtension = fileWithExtension.split('.')[0];
    
    // Get the folder path (excluding the version segment)
    const versionSegmentIndex = splitUrl.findIndex(segment => segment.startsWith('v') && /^v\d+$/.test(segment));
    const folderPath = splitUrl.slice(versionSegmentIndex + 1, -1).join('/');
    
    // Combine folder path and filename without extension
    return folderPath ? `${folderPath}/${fileWithoutExtension}` : fileWithoutExtension;
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