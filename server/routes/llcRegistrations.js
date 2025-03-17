const express = require('express');
const router = express.Router();
const {pool} = require('../config/db');
const upload = require('../middleware/fileUpload');
const jwt = require("jsonwebtoken");
const PDFDocument = require('pdfkit');

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
      // ✅ Create new registration with auto-generated ID
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
      
      // Check if document already exists
      const docResult = await client.query(
        'SELECT id FROM identification_documents WHERE registration_id = $1 AND document_type = $2',
        [newRegistrationId, 'id_proof']
      );
      
      if (docResult.rows.length > 0) {
        // Update existing document
        await client.query(
          `UPDATE identification_documents 
           SET file_path = $1, file_name = $2, id_type = $3, updated_at = CURRENT_TIMESTAMP
           WHERE registration_id = $4 AND document_type = $5`,
          [idDocument.path, idDocument.filename, idType, newRegistrationId, 'id_proof']
        );
      } else {
        // Insert new document
        await client.query(
          `INSERT INTO identification_documents 
           (registration_id, document_type, file_path, file_name, id_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [newRegistrationId, 'id_proof', idDocument.path, idDocument.filename, idType]
        );
      }
    }
    
    // Handle additional documents
    const additionalDocKeys = Object.keys(req.files || {}).filter(key => key.startsWith('additionalDocument_'));
    
    if (additionalDocKeys.length > 0) {
      // If updating, remove old additional documents from the DB (but keep the files)
      if (registrationId) {
        await client.query(
          'DELETE FROM identification_documents WHERE registration_id = $1 AND document_type = $2',
          [newRegistrationId, 'additional']
        );
      }
      
      // Insert each additional document
      for (const key of additionalDocKeys) {
        const additionalDoc = req.files[key][0];
        
        await client.query(
          `INSERT INTO identification_documents 
           (registration_id, document_type, file_path, file_name)
           VALUES ($1, $2, $3, $4)`,
          [newRegistrationId, 'additional', additionalDoc.path, additionalDoc.filename]
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

router.get('/llc-applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    
    // Query for applications from the new table instead
    const applicationsResult = await pool.query(
      `SELECT id, company_name as business_name, 
              state as business_address, 
              company_type as industry_type, 
              status, payment_status as payment_status, 
              created_at, updated_at
       FROM llc_registrations
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.status(200).json(applicationsResult.rows);
  } catch (error) {
    console.error('Error fetching legacy applications:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
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


// Backend - Add this route to your API routes file
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

    // Delete additional documents
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

  // Add validation
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Verify the user has access to this registration
    const verifyResult = await pool.query(
      "SELECT * FROM llc_registrations WHERE id = $1 AND user_id = $2",
      [id, parseInt(userId, 10)] // Ensure userId is converted to integer
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const registration = verifyResult.rows[0];

    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", `attachment; filename=LLC_Summary_${id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe the document to the response
    doc.pipe(res);

    // PDF Content
    doc.fontSize(18).text("LLC Registration Summary", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Company Name: ${registration.company_name || "N/A"}`);
    doc.text(`Company Type: ${registration.company_type || "LLC"}`);
    doc.text(`State: ${registration.state || "N/A"}`);
    doc.text(`Owners: ${registration.owners || "N/A"}`);
    doc.text(`Address: ${registration.address || "N/A"}`);
    doc.text(`Payment Status: ${registration.payment_status || "Unpaid"}`);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;