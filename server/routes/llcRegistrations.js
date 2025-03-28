const express = require('express');
const router = express.Router();
const {pool} = require('../config/db');
const jwt = require("jsonwebtoken");
const PDFDocument = require('pdfkit');
const { upload, deleteFile, getPublicIdFromUrl, cloudinary } = require('../middleware/fileUpload');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const { authenticateToken } = require('../middleware/auth');

// Create or update LLC registration
router.post('/llc-registrations', authenticateToken, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 10 } // Allow up to 10 additional documents
]), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Parse JSON data from the form
    const formData = JSON.parse(req.body.data);
    
    // Make ABSOLUTELY sure we have a valid number for stateAmount
    let stateAmount;
    if (formData.stateAmount === null || formData.stateAmount === undefined || formData.stateAmount === '') {
      stateAmount = 0; // Default value
    } else {
      stateAmount = parseFloat(formData.stateAmount);
      if (isNaN(stateAmount)) {
        stateAmount = 0; // Handle parsing failures
      }
    }
    const { 
      userId, 
      state,  
      companyName, 
      companyType, 
      category, 
      owners, 
      address, 
      status, 
      step,
      paymentStatus
    } = formData;
    
    // Find category ID if a category is provided
    let categoryId = null;
    if (category) {
      const categoryResult = await client.query(
        'SELECT id FROM business_categories WHERE name = $1',
        [category]
      );
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      }
    }
    
    // Check if there's an existing registration ID in the request
    const registrationId = formData.id;
    let result;
    let newRegistrationId;

    if (registrationId) {
      // Only update if explicitly requested to update
      if (formData.updateExisting) {
        // First check if the registration exists
        const checkResult = await client.query(
          'SELECT id FROM llc_registrations WHERE id = $1 AND user_id = $2',
          [registrationId, userId]
        );
        
        if (checkResult.rows.length > 0) {
          // Update existing registration
          result = await client.query(
            `UPDATE llc_registrations 
             SET company_name = $1, company_type = $2, category_id = $3, 
                 state = $4, filing_fee = $5, status = $6, current_step = $7, 
                 payment_status = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND user_id = $10
             RETURNING id`,
            [companyName, companyType, categoryId, state, stateAmount, status, step, paymentStatus, registrationId, userId]
          );
          newRegistrationId = registrationId;
        } else {
          // Registration ID provided but doesn't exist in database
          // Create new registration with the provided ID
          result = await client.query(
            `INSERT INTO llc_registrations 
             (id, user_id, company_name, company_type, category_id, state, filing_fee, status, current_step, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [registrationId, userId, companyName, companyType, categoryId, state, stateAmount, status, step, paymentStatus]
          );
          newRegistrationId = result.rows[0].id;
        }
      } else {
        // Create new registration even though ID was provided
        result = await client.query(
          `INSERT INTO llc_registrations 
           (user_id, company_name, company_type, category_id, state, filing_fee, status, current_step, payment_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [userId, companyName, companyType, categoryId, state, stateAmount, status, step, paymentStatus]
        );
        newRegistrationId = result.rows[0].id;
      }
    } else {
      // Create new registration with auto-generated ID
      result = await client.query(
        `INSERT INTO llc_registrations 
         (user_id, company_name, company_type, category_id, state, filing_fee, status, current_step, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [userId, companyName, companyType, categoryId, state, stateAmount, status, step, paymentStatus]
      );
      newRegistrationId = result.rows[0].id;
    }
    
    // Handle owners if provided
    if (owners && owners.length > 0) {
      // Delete existing owners for this registration
      if (registrationId) {
        await client.query('DELETE FROM llc_owners WHERE registration_id = $1', [newRegistrationId]);
      }
      
      // Insert new owners
      for (const owner of owners) {
        // Convert empty ownership percentage to 0
        const ownershipPercentage = owner.ownershipPercentage === '' ? 0 : parseFloat(owner.ownershipPercentage);
        
        await client.query(
          `INSERT INTO llc_owners (registration_id, full_name, ownership_percentage)
           VALUES ($1, $2, $3)`,
          [newRegistrationId, owner.fullName, ownershipPercentage]
        );
      }
    }
    
    // Handle address if provided
    if (address && address.street) {
      // Check if address already exists
      const addressResult = await client.query(
        'SELECT id FROM llc_addresses WHERE registration_id = $1',
        [newRegistrationId]
      );
      
      if (addressResult.rows.length > 0) {
        // Update existing address
        await client.query(
          `UPDATE llc_addresses 
           SET street = $1, city = $2, state_province = $3, postal_code = $4, country = $5, 
               updated_at = CURRENT_TIMESTAMP
           WHERE registration_id = $6`,
          [address.street, address.city, address.state, address.postalCode, address.country, newRegistrationId]
        );
      } else {
        // Insert new address
        await client.query(
          `INSERT INTO llc_addresses 
           (registration_id, street, city, state_province, postal_code, country)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newRegistrationId, address.street, address.city, address.state, address.postalCode, address.country]
        );
      }
    }
    
    // Handle ID document file upload
    if (req.files && req.files.idDocument && req.files.idDocument.length > 0) {
      const idDocument = req.files.idDocument[0];
      const idType = req.body.idType || 'passport'; // Default to passport if not specified
      
      // Get the Cloudinary URL from the file object
      const idDocumentUrl = idDocument.path;
      
      // Check if document already exists
      const docResult = await client.query(
        'SELECT id, file_path FROM identification_documents WHERE registration_id = $1 AND document_type = $2',
        [newRegistrationId, 'id_proof']
      );
      
      if (docResult.rows.length > 0) {
        // Delete the old file from Cloudinary
        const oldFilePath = docResult.rows[0].file_path;
        const publicId = getPublicIdFromUrl(oldFilePath);
        if (publicId) {
          await deleteFile(publicId);
        }
        
        // Update existing document with Cloudinary URL
        await client.query(
          `UPDATE identification_documents 
           SET file_path = $1, file_name = $2, id_type = $3, updated_at = CURRENT_TIMESTAMP
           WHERE registration_id = $4 AND document_type = $5`,
          [idDocumentUrl, idDocument.originalname, idType, newRegistrationId, 'id_proof']
        );
      } else {
        // Insert new document with Cloudinary URL
        await client.query(
          `INSERT INTO identification_documents 
           (registration_id, document_type, file_path, file_name, id_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [newRegistrationId, 'id_proof', idDocumentUrl, idDocument.originalname, idType]
        );
      }
    }
    
    // Handle additional documents
    if (req.files && req.files.additionalDocuments && req.files.additionalDocuments.length > 0) {
      // If updating, delete old additional documents from Cloudinary and DB
      if (registrationId) {
        const oldDocsResult = await client.query(
          'SELECT id, file_path FROM identification_documents WHERE registration_id = $1 AND document_type = $2',
          [newRegistrationId, 'additional']
        );
        
        // Delete each old document from Cloudinary
        for (const oldDoc of oldDocsResult.rows) {
          const publicId = getPublicIdFromUrl(oldDoc.file_path);
          if (publicId) {
            await deleteFile(publicId);
          }
        }
        
        // Delete old documents from DB
        await client.query(
          'DELETE FROM identification_documents WHERE registration_id = $1 AND document_type = $2',
          [newRegistrationId, 'additional']
        );
      }
      
      // Insert each additional document with Cloudinary URL
      for (const additionalDoc of req.files.additionalDocuments) {
        const documentUrl = additionalDoc.path;
        
        await client.query(
          `INSERT INTO identification_documents 
           (registration_id, document_type, file_path, file_name)
           VALUES ($1, $2, $3, $4)`,
          [newRegistrationId, 'additional', documentUrl, additionalDoc.originalname]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      id: newRegistrationId,
      message: registrationId ? 'Registration updated successfully' : 'Registration created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving registration:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    client.release();
  }
});





// Get all LLC registrations for a specific user
router.get('/llc-registrations/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Verify authorization
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    // Verify the token and make sure the user is requesting their own data
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedToken.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized access to this resource' });
    }
    
    // Query for all registrations belonging to this user
    const registrationsResult = await pool.query(
      `SELECT r.id, r.company_name as "companyName", r.company_type as "companyType", 
              bc.name as "category", r.state, r.filing_fee as "stateAmount", 
              r.status, r.current_step as "step", r.payment_status as "paymentStatus",
              r.created_at, r.updated_at as "updatedAt"
       FROM llc_registrations r
       LEFT JOIN business_categories bc ON r.category_id = bc.id
       WHERE r.user_id = $1
       ORDER BY r.updated_at DESC`,
      [userId]
    );
    
    const registrations = registrationsResult.rows;
    
    // For each registration, we could potentially fetch more details if needed
    // such as owners, addresses, etc. but for the dashboard overview, this might
    // be sufficient information
    
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Get a specific LLC registration
router.get('/llc-registrations/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId; // For security, ensure the user has access

  try {
    // Get the registration
    const registrationResult = await pool.query(
      `SELECT r.id, r.company_name, r.company_type, bc.name as category,
              r.state, r.filing_fee as state_amount, r.status, r.current_step, r.payment_status
       FROM llc_registrations r
       LEFT JOIN business_categories bc ON r.category_id = bc.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, userId]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const registration = registrationResult.rows[0];

    // Get owners
    const ownersResult = await pool.query(
      `SELECT full_name as "fullName", ownership_percentage as "ownershipPercentage" 
       FROM llc_owners 
       WHERE registration_id = $1`,
      [id]
    );

    // Get address
    const addressResult = await pool.query(
      `SELECT street, city, state_province as state, postal_code as "postalCode", country 
       FROM llc_addresses 
       WHERE registration_id = $1`,
      [id]
    );

    // Get ID document
    const idDocumentResult = await pool.query(
      `SELECT id_type as "idType", file_name as "idFileName", file_path as "idFilePath"
       FROM identification_documents
       WHERE registration_id = $1 AND document_type = 'id_proof'`,
      [id]
    );

    // Get additional documents
    const additionalDocsResult = await pool.query(
      `SELECT file_name as "fileName", file_path as "filePath"
       FROM identification_documents
       WHERE registration_id = $1 AND document_type = 'additional'`,
      [id]
    );

    // Format the response to match the frontend's data structure
    const formattedResponse = {
      id: registration.id,
      state: registration.state,
      stateAmount: registration.state_amount,
      companyName: registration.company_name,
      companyType: registration.company_type,
      category: registration.category,
      status: registration.status,
      step: registration.current_step,
      paymentStatus: registration.payment_status,
      owners: ownersResult.rows,
      address: addressResult.rows.length > 0 ? addressResult.rows[0] : {},
      identificationDocuments: {
        idType: idDocumentResult.rows.length > 0 ? idDocumentResult.rows[0].idType : 'passport',
        idFileName: idDocumentResult.rows.length > 0 ? idDocumentResult.rows[0].idFileName : '',
        idFilePath: idDocumentResult.rows.length > 0 ? idDocumentResult.rows[0].idFilePath : '',
        additionalDocuments: additionalDocsResult.rows.map(doc => ({
          fileName: doc.fileName,
          filePath: doc.filePath
        }))
      }
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// the delete route to also delete files from Cloudinary
router.delete('/llc-registrations/:id', async (req, res) => {
  const { id } = req.params;
  // Extract user ID from token or query params for security check
  const userId = req.query.userId || req.userId; // Depends on your auth middleware

  try {
    // Start a database transaction to ensure all deletions are atomic
    await pool.query('BEGIN');

    // Verify the user has permission to delete this registration
    const permissionCheck = await pool.query(
      'SELECT id FROM llc_registrations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (permissionCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(403).json({ error: 'You do not have permission to delete this registration' });
    }

    // Get all documents to delete from Cloudinary
    const documentsResult = await pool.query(
      'SELECT id, file_path FROM identification_documents WHERE registration_id = $1',
      [id]
    );

   // In your deletion route
for (const doc of documentsResult.rows) {
  const publicId = getPublicIdFromUrl(doc.file_path);
  if (publicId) {
    // Use the URL path to determine resource type, not file extension
    const resourceType = doc.file_path.includes('/image/upload/') ? 'image' : 'raw';
    
    const deleteResult = await deleteFile(publicId, resourceType);
    
    console.log('Delete result:', {
      originalPath: doc.file_path,
      publicId: publicId,
      resourceType: resourceType,
      success: deleteResult.success,
      message: deleteResult.message
    });
  }
}

    // Delete additional documents from database
    await pool.query(
      'DELETE FROM identification_documents WHERE registration_id = $1',
      [id]
    );

    // Delete address information
    await pool.query(
      'DELETE FROM llc_addresses WHERE registration_id = $1',
      [id]
    );

    // Delete owners information
    await pool.query(
      'DELETE FROM llc_owners WHERE registration_id = $1',
      [id]
    );

    // Delete payment records if they exist
    await pool.query(
      'DELETE FROM payments WHERE registration_id = $1',
      [id]
    );

    // Finally, delete the main registration record
    const deleteResult = await pool.query(
      'DELETE FROM llc_registrations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    // Commit the transaction
    await pool.query('COMMIT');

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found or already deleted' });
    }

    res.status(200).json({ message: 'Registration successfully deleted', id });
  } catch (error) {
    // Roll back the transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Generate PDF summary of LLC registration
router.get("/llc-registrations/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;
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

  // Function to download image from URL
  const downloadImage = async (url, localPath) => {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
      
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        
        writer.on('finish', () => resolve(localPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error);
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

  try {
    // Verify the user has access to this registration
    const verifyResult = await pool.query(
      "SELECT * FROM llc_registrations WHERE id = $1 AND user_id = $2",
      [id, parseInt(userId, 10)]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const registration = verifyResult.rows[0];

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
    
    res.setHeader("Content-Disposition", `attachment; filename=LLC_Summary_${registration.company_name.replace(/\s+/g, '_')}_${id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe the document to the response
    doc.pipe(res);

    // Agency Logo and Header
    // Replace with your logo path or use a placeholder
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
              
              // Now download and embed the image
              try {
                await downloadImage(document.file_path, tempFilePath);
                
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