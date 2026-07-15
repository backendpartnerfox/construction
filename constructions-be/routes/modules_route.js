const express = require('express');
const router = express.Router();

// GET all vendors (for dropdown)
router.get('/vendors', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT vendor_id, vendor_name FROM vendors ORDER BY vendor_name'
    );
    console.log('🏢 Found', result.rows.length, 'vendors');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('❌ Error fetching vendors:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET all modules (supports project_id filter)
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;
  
  try {
    let query = `
      SELECT 
        module_id,
        project_id,
        module_code,
        module_name,
        module_type,
        order_type,
        vendor_id,
        total_quantity,
        unit_of_measure,
        order_value,
        tax_amount,
        total_amount,
        payment_terms,
        advance_percentage,
        expected_delivery_date,
        delivery_location,
        status,
        created_at,
        created_by
      FROM modules
    `;
    
    const values = [];
    if (project_id) {
      query += ' WHERE project_id = $1';
      values.push(project_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    console.log('🔍 Executing query:', query);
    console.log('📊 With values:', values);
    
    const result = await db.query(query, values);
    
    console.log('✅ Query successful, found', result.rows.length, 'modules');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('❌ Database query error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET specific module by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT * FROM modules WHERE module_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('❌ Error fetching module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST - Create new module
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id,
    module_name,
    module_code,
    module_type,
    order_type,
    vendor_id,
    total_quantity,
    unit_of_measure,
    order_value,
    tax_amount,
    payment_terms,
    advance_percentage,
    expected_delivery_date,
    delivery_location,
    status
  } = req.body;

  console.log('📝 Creating module with data:', req.body);

  // Validate required fields
  if (!project_id || !module_name) {
    return res.status(400).json({ 
      success: false,
      error: 'Required fields missing: project_id, module_name' 
    });
  }

  try {
    // Validate vendor_id if provided
    if (vendor_id && vendor_id !== '') {
      const vendorCheck = await db.query('SELECT vendor_id FROM vendors WHERE vendor_id = $1', [vendor_id]);
      if (vendorCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid vendor_id: ${vendor_id}. Vendor does not exist.`
        });
      }
      console.log('✅ Vendor validation passed for vendor_id:', vendor_id);
    }

    // Auto-generate module_code if not provided
    let finalModuleCode = module_code;
    if (!finalModuleCode) {
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM modules WHERE project_id = $1',
        [project_id]
      );
      const nextNumber = parseInt(countResult.rows[0].count) + 1;
      finalModuleCode = `MOD-${String(nextNumber).padStart(3, '0')}`;
      console.log('🔄 Auto-generated module_code:', finalModuleCode);
    }

    // Calculate total_amount
    const orderVal = parseFloat(order_value) || 0;
    const taxVal = parseFloat(tax_amount) || 0;
    const totalAmount = orderVal + taxVal;

    // Prepare vendor_id - set to null if empty or invalid
    const finalVendorId = (vendor_id && vendor_id !== '' && !isNaN(vendor_id)) ? parseInt(vendor_id) : null;

    const insertQuery = `
      INSERT INTO modules (
        project_id,
        module_name,
        module_code,
        module_type,
        order_type,
        vendor_id,
        total_quantity,
        unit_of_measure,
        order_value,
        tax_amount,
        total_amount,
        payment_terms,
        advance_percentage,
        expected_delivery_date,
        delivery_location,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const insertValues = [
      project_id,
      module_name,
      finalModuleCode,
      module_type || 'Standard',
      order_type || 'Purchase Order',
      finalVendorId, // This will be null if vendor_id is empty/invalid
      total_quantity || null,
      unit_of_measure || 'nos',
      orderVal || null,
      taxVal || null,
      totalAmount || null,
      payment_terms || null,
      advance_percentage || null,
      expected_delivery_date || null,
      delivery_location || null,
      status || 'Draft'
    ];

    console.log('🚀 Executing INSERT with values:', insertValues);

    const result = await db.query(insertQuery, insertValues);

    console.log('✅ Module created successfully:', result.rows[0].module_id);
    res.status(201).json({ 
      success: true,
      data: result.rows[0],
      message: 'Module created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating module:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === '23503' && error.constraint === 'modules_vendor_id_fkey') {
      errorMessage = 'Invalid vendor selected. Please choose a valid vendor or leave empty.';
    } else if (error.code === '23503' && error.constraint === 'modules_project_id_fkey') {
      errorMessage = 'Invalid project ID. Project does not exist.';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.detail
    });
  }
});

// PUT - Update module
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updateData = req.body;

  console.log('📝 Updating module', id, 'with data:', updateData);

  try {
    // Check if module exists
    const existingResult = await db.query('SELECT * FROM modules WHERE module_id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }

    // Calculate total_amount if order_value or tax_amount changed
    const orderVal = parseFloat(updateData.order_value) || 0;
    const taxVal = parseFloat(updateData.tax_amount) || 0;
    const totalAmount = orderVal + taxVal;

    const updateQuery = `
      UPDATE modules 
      SET 
        module_name = $2,
        module_code = $3,
        module_type = $4,
        order_type = $5,
        vendor_id = $6,
        total_quantity = $7,
        unit_of_measure = $8,
        order_value = $9,
        tax_amount = $10,
        total_amount = $11,
        payment_terms = $12,
        advance_percentage = $13,
        expected_delivery_date = $14,
        delivery_location = $15,
        status = $16
      WHERE module_id = $1
      RETURNING *
    `;

    const updateValues = [
      id,
      updateData.module_name,
      updateData.module_code,
      updateData.module_type,
      updateData.order_type,
      updateData.vendor_id || null,
      updateData.total_quantity || null,
      updateData.unit_of_measure,
      orderVal || null,
      taxVal || null,
      totalAmount || null,
      updateData.payment_terms || null,
      updateData.advance_percentage || null,
      updateData.expected_delivery_date || null,
      updateData.delivery_location || null,
      updateData.status
    ];

    const result = await db.query(updateQuery, updateValues);

    console.log('✅ Module updated successfully');
    res.json({ 
      success: true,
      data: result.rows[0],
      message: 'Module updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE - Delete module
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('🗑️ Deleting module:', id);

  try {
    const result = await db.query('DELETE FROM modules WHERE module_id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }
    
    console.log('✅ Module deleted successfully');
    res.json({ 
      success: true,
      message: 'Module deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
