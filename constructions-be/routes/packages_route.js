const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: API for managing construction packages
 */

// Middleware: Log all requests
router.use((req, res, next) => {
  console.log(`[Packages] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// GET ALL PACKAGES
// ============================================================
router.get('/', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.package_name,
        p.total_price_per_sqft,
        p.stilt_price_per_sqft,
        p.stilt_cost_ratio,
        p.gst_percentage,
        p.base_price_per_sqft,
        p.gst_amount_per_sqft,
        p.description,
        p.tagline,
        p.is_popular,
        p.sort_order,
        p.created_at,
        p.updated_at,
        ROUND(COALESCE(mep.mep_cost_per_sqft, 0)::numeric, 2) AS mep_cost_per_sqft,
        ROUND((p.total_price_per_sqft - COALESCE(mep.mep_cost_per_sqft, 0))::numeric, 2) AS margin_per_sqft,
        ROUND((COALESCE(mep.mep_cost_per_sqft, 0) * COALESCE(p.stilt_cost_ratio, 0.65))::numeric, 2) AS stilt_cost_per_sqft,
        ROUND((p.stilt_price_per_sqft - COALESCE(mep.mep_cost_per_sqft, 0) * COALESCE(p.stilt_cost_ratio, 0.65))::numeric, 2) AS stilt_margin_per_sqft
      FROM packages p
      LEFT JOIN (
        SELECT package_id, SUM(cost_per_sqft) AS mep_cost_per_sqft
        FROM v_package_cost_per_sqft
        GROUP BY package_id
      ) mep ON mep.package_id = p.id
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);
    
    console.log(`[Packages] Found ${result.rows.length} packages`);
    
    res.json(result.rows);
  } catch (err) {
    console.error('[Packages] Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch packages',
      message: err.message 
    });
  }
});

// ============================================================
// SEARCH PACKAGES
// ============================================================
router.get('/search', async (req, res) => {
  const db = req.db;
  const { q: searchTerm } = req.query;
  
  if (!searchTerm || !searchTerm.trim()) {
    return res.status(400).json({ 
      success: false,
      error: 'Search term is required' 
    });
  }
  
  try {
    const result = await db.query(`
      SELECT 
        id,
        package_name,
        total_price_per_sqft,
        gst_percentage,
        base_price_per_sqft,
        gst_amount_per_sqft,
        created_at,
        updated_at
      FROM packages
      WHERE package_name ILIKE $1
      ORDER BY package_name ASC
    `, [`%${searchTerm}%`]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Packages] Search error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Search failed',
      message: err.message 
    });
  }
});

// ============================================================
// CREATE PACKAGE
// ============================================================
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    package_name,
    total_price_per_sqft,
    gst_percentage = 18.00,
    description,
    tagline,
    is_popular = false,
    sort_order = 0
  } = req.body;

  // Validation
  if (!package_name || !package_name.trim()) {
    return res.status(400).json({ 
      success: false,
      error: "Package name is required" 
    });
  }

  // ✅ Validate total_price_per_sqft
  if (!total_price_per_sqft || parseFloat(total_price_per_sqft) <= 0) {
    return res.status(400).json({ 
      success: false,
      error: "Valid total price per sqft is required" 
    });
  }

  const gstPercent = parseFloat(gst_percentage);
  if (isNaN(gstPercent) || gstPercent < 0 || gstPercent > 50) {
    return res.status(400).json({ 
      success: false,
      error: "GST percentage must be between 0 and 50" 
    });
  }

  try {
    const totalPrice = parseFloat(total_price_per_sqft);

    // ✅ Only insert non-generated columns
    // The database will automatically calculate base_price_per_sqft and gst_amount_per_sqft
    const result = await db.query(
      `INSERT INTO packages (
        package_name,
        total_price_per_sqft,
        gst_percentage,
        description,
        tagline,
        is_popular,
        sort_order,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [
        package_name.trim(),
        totalPrice,
        gstPercent,
        description || null,
        tagline || null,
        is_popular || false,
        sort_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Package created successfully'
    });
  } catch (err) {
    console.error('[Packages] Create error:', err.message);
    
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: 'Package with this name already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create package',
      message: err.message 
    });
  }
});

// ============================================================
// COST BREAKDOWN PER SFT (static path — must come before /:id)
// GET /api/packages/cost-breakdown?sft=1500&stilt=400
// Returns per-package MEP cost/SFT, breakdown by category, and totals scaled by SFT.
// ============================================================
router.get('/cost-breakdown', async (req, res) => {
  const db = req.db;
  const sft = Math.max(0, parseFloat(req.query.sft) || 0);
  const stilt = Math.max(0, parseFloat(req.query.stilt) || 0);

  try {
    const catRows = await db.query(`
      SELECT package_id, package_name, sort_order, item_category,
             COUNT(*)::int AS items,
             ROUND(SUM(cost_per_sqft)::numeric, 2) AS mep_cost_per_sqft
      FROM v_package_cost_per_sqft
      GROUP BY package_id, sort_order, package_name, item_category
      ORDER BY sort_order, item_category
    `);

    const pkgRows = await db.query(`
      SELECT id, package_name, sort_order,
             total_price_per_sqft::numeric AS sales_rate,
             stilt_price_per_sqft::numeric AS stilt_rate
      FROM packages
      ORDER BY sort_order
    `);

    const catByPkg = new Map();
    for (const r of catRows.rows) {
      if (!catByPkg.has(r.package_id)) catByPkg.set(r.package_id, []);
      catByPkg.get(r.package_id).push({
        category: r.item_category,
        items: r.items,
        mep_cost_per_sqft: Number(r.mep_cost_per_sqft),
      });
    }

    const packages = pkgRows.rows.map(p => {
      const cats = catByPkg.get(p.id) || [];
      const mepPerSft = cats.reduce((s, c) => s + c.mep_cost_per_sqft, 0);
      const salesRate = Number(p.sales_rate) || 0;
      const stiltRate = Number(p.stilt_rate) || 0;
      const buildUpTotal = sft * salesRate;
      const stiltTotal = stilt * stiltRate;
      const revenue = buildUpTotal + stiltTotal;
      const mepCostTotal = sft * mepPerSft;
      return {
        id: p.id,
        package_name: p.package_name,
        sort_order: p.sort_order,
        sales_rate_per_sqft: salesRate,
        stilt_rate_per_sqft: stiltRate,
        mep_cost_per_sqft: +mepPerSft.toFixed(2),
        categories: cats,
        mep_share_pct: salesRate ? +((mepPerSft / salesRate) * 100).toFixed(2) : null,
        built_up_total: +buildUpTotal.toFixed(2),
        stilt_total: +stiltTotal.toFixed(2),
        revenue_total: +revenue.toFixed(2),
        mep_cost_total: +mepCostTotal.toFixed(2),
      };
    });

    res.json({ input: { sft, stilt }, packages });
  } catch (err) {
    console.error('[Packages] cost-breakdown error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET PACKAGE BY ID
// ============================================================
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  const packageId = parseInt(id);
  if (isNaN(packageId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid package ID'
    });
  }
  
  try {
    const result = await db.query(`
      SELECT 
        id,
        package_name,
        total_price_per_sqft,
        gst_percentage,
        base_price_per_sqft,
        gst_amount_per_sqft,
        description,
        tagline,
        is_popular,
        sort_order,
        created_at,
        updated_at
      FROM packages 
      WHERE id = $1
    `, [packageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[Packages] Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch package',
      message: err.message 
    });
  }
});

// ============================================================
// GET PACKAGE ITEMS
// ============================================================
router.get('/:id/items', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if package exists
    const packageCheck = await db.query(
      'SELECT id FROM packages WHERE id = $1',
      [id]
    );
    
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Package not found' 
      });
    }
    
    const result = await db.query(`
      SELECT 
        pim.id,
        pim.package_id,
        pim.item_id,
        pim.item_choice_id,
        pim.created_at,
        i.item_name,
        i.item_category,
        i.item_unit,
        ic.display_name as choice_name,
        ic.brand,
        ic.series,
        ic.sub_series
      FROM package_items_mapping pim
      JOIN items i ON pim.item_id = i.item_id
      LEFT JOIN item_choices ic ON pim.item_choice_id = ic.choice_option_id
      WHERE pim.package_id = $1
      ORDER BY i.item_category, i.item_name
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Packages] Error fetching items:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch package items',
      message: err.message 
    });
  }
});

// ============================================================
// UPDATE PACKAGE
// ============================================================
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    package_name,
    total_price_per_sqft,
    gst_percentage,
    description,
    tagline,
    is_popular,
    sort_order
  } = req.body;

  // Validation
  if (!package_name || !package_name.trim()) {
    return res.status(400).json({ 
      success: false,
      error: "Package name is required" 
    });
  }

  if (!total_price_per_sqft || parseFloat(total_price_per_sqft) <= 0) {
    return res.status(400).json({ 
      success: false,
      error: "Valid total price per sqft is required" 
    });
  }

  const gstPercent = parseFloat(gst_percentage);
  if (isNaN(gstPercent) || gstPercent < 0 || gstPercent > 50) {
    return res.status(400).json({ 
      success: false,
      error: "GST percentage must be between 0 and 50" 
    });
  }

  try {
    const totalPrice = parseFloat(total_price_per_sqft);

    // ✅ Only update non-generated columns
    const result = await db.query(
      `UPDATE packages 
       SET package_name = $1,
           total_price_per_sqft = $2,
           gst_percentage = $3,
           description = $4,
           tagline = $5,
           is_popular = $6,
           sort_order = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [package_name.trim(), totalPrice, gstPercent, description || null, tagline || null, is_popular || false, sort_order || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Package not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Package updated successfully'
    });
  } catch (err) {
    console.error('[Packages] Update error:', err.message);
    
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: 'Package with this name already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update package',
      message: err.message 
    });
  }
});

// ============================================================
// DELETE PACKAGE
// ============================================================
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  const packageId = parseInt(id);
  if (isNaN(packageId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid package ID' 
    });
  }

  try {
    // Check if package exists
    const packageCheck = await db.query(
      'SELECT id, package_name FROM packages WHERE id = $1',
      [packageId]
    );
    
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Package not found"
      });
    }

    // Check if package is being used
    const usageCheck = await db.query(`
      SELECT EXISTS(
        SELECT 1 FROM enquiry_selection_package WHERE selected_package_id = $1
        UNION
        SELECT 1 FROM lead_selection_package WHERE selected_package_id = $1
      ) as in_use
    `, [packageId]);
    
    if (usageCheck.rows[0] && usageCheck.rows[0].in_use) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete package as it is being used in enquiries or leads'
      });
    }

    const result = await db.query(
      'DELETE FROM packages WHERE id = $1 RETURNING package_name',
      [packageId]
    );
    
    res.json({ 
      success: true,
      message: `Package "${result.rows[0].package_name}" deleted successfully` 
    });
  } catch (err) {
    console.error('[Packages] Delete error:', err.message);
    
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false,
        error: "Cannot delete package with active references"
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete package',
      message: err.message 
    });
  }
});

// ============================================================
// ADD ITEM TO PACKAGE
// ============================================================
router.post('/:id/items', async (req, res) => {
  const db = req.db;
  const { id: packageId } = req.params;
  const {
    item_id,
    item_choice_id
  } = req.body;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      error: 'Item ID is required'
    });
  }

  if (!item_choice_id) {
    return res.status(400).json({
      success: false,
      error: 'Item choice ID is required'
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO package_items_mapping (
        package_id, item_id, item_choice_id, created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *`,
      [packageId, item_id, item_choice_id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Item added to package successfully'
    });
  } catch (err) {
    console.error('[Packages] Add item error:', err.message);
    
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'This item is already in the package'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add item to package',
      message: err.message
    });
  }
});

// ============================================================
// REMOVE ITEM FROM PACKAGE
// ============================================================
router.delete('/:id/items/:itemId', async (req, res) => {
  const db = req.db;
  const { id: packageId, itemId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM package_items_mapping WHERE package_id = $1 AND id = $2 RETURNING *',
      [packageId, itemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item mapping not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from package successfully'
    });
  } catch (err) {
    console.error('[Packages] Remove item error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from package',
      message: err.message
    });
  }
});

module.exports = router;
