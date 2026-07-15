const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all vendor product pricing
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                vpp.*,
                v.vendor_name,
                i.item_name,
                ic.display_name as choice_name
            FROM vendor_product_pricing vpp
            LEFT JOIN vendors v ON vpp.vendor_id = v.vendor_id
            LEFT JOIN items i ON vpp.item_id = i.item_id
            LEFT JOIN item_choices ic ON vpp.choice_option_id = ic.choice_option_id
            ORDER BY vpp.vendor_id, vpp.item_id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor product pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pricing by vendor
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const query = `
            SELECT 
                vpp.*,
                i.item_name,
                ic.display_name as choice_name
            FROM vendor_product_pricing vpp
            LEFT JOIN items i ON vpp.item_id = i.item_id
            LEFT JOIN item_choices ic ON vpp.choice_option_id = ic.choice_option_id
            WHERE vpp.vendor_id = $1 AND vpp.is_active = true
            ORDER BY vpp.item_id
        `;
        const result = await pool.query(query, [vendorId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pricing by item
router.get('/item/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const query = `
            SELECT 
                vpp.*,
                v.vendor_name,
                v.contact_person,
                v.contact_number,
                ic.display_name as choice_name
            FROM vendor_product_pricing vpp
            LEFT JOIN vendors v ON vpp.vendor_id = v.vendor_id
            LEFT JOIN item_choices ic ON vpp.choice_option_id = ic.choice_option_id
            WHERE vpp.item_id = $1 AND vpp.is_active = true
            ORDER BY vpp.total_amount ASC
        `;
        const result = await pool.query(query, [itemId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching item pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get best price for item and choice
router.get('/best-price/:itemId/:choiceOptionId', async (req, res) => {
    try {
        const { itemId, choiceOptionId } = req.params;
        const query = `
            SELECT 
                vpp.*,
                v.vendor_name,
                v.contact_person,
                v.contact_number,
                ic.display_name as choice_name
            FROM vendor_product_pricing vpp
            LEFT JOIN vendors v ON vpp.vendor_id = v.vendor_id
            LEFT JOIN item_choices ic ON vpp.choice_option_id = ic.choice_option_id
            WHERE vpp.item_id = $1 
            AND vpp.choice_option_id = $2 
            AND vpp.is_active = true
            AND vpp.price_validity_end >= CURRENT_DATE
            ORDER BY vpp.total_amount ASC
            LIMIT 3
        `;
        const result = await pool.query(query, [itemId, choiceOptionId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching best prices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new pricing
router.post('/', async (req, res) => {
    try {
        const {
            vendor_id,
            item_id,
            choice_option_id,
            unit_price,
            unit,
            gst_percentage,
            min_order_quantity,
            is_including_tax,
            discount_percentage,
            price_validity_start,
            price_validity_end,
            quotation_reference,
            is_approved,
            is_active
        } = req.body;

        const query = `
            INSERT INTO vendor_product_pricing (
                vendor_id, item_id, choice_option_id, unit_price, unit,
                gst_percentage, min_order_quantity, is_including_tax,
                discount_percentage, price_validity_start, price_validity_end,
                quotation_reference, is_approved, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        
        const values = [
            vendor_id, item_id, choice_option_id, unit_price, unit,
            gst_percentage || 18.00, min_order_quantity || 1, is_including_tax || false,
            discount_percentage || 0, price_validity_start, price_validity_end,
            quotation_reference, is_approved || false, is_active || true
        ];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating vendor product pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update pricing
router.put('/:pricingId', async (req, res) => {
    try {
        const { pricingId } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const setClause = [];
        const values = [];
        let paramCount = 1;
        
        Object.keys(updates).forEach(key => {
            if (key !== 'product_pricing_id') {
                setClause.push(`${key} = $${paramCount}`);
                values.push(updates[key]);
                paramCount++;
            }
        });
        
        if (setClause.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        values.push(pricingId);
        
        const query = `
            UPDATE vendor_product_pricing
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE product_pricing_id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product pricing not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete pricing (soft delete)
router.delete('/:pricingId', async (req, res) => {
    try {
        const { pricingId } = req.params;
        
        const query = `
            UPDATE vendor_product_pricing
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE product_pricing_id = $1
            RETURNING *
        `;
        
        const result = await pool.query(query, [pricingId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product pricing not found' });
        }
        
        res.json({ message: 'Product pricing deactivated successfully' });
    } catch (error) {
        console.error('Error deleting product pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Compare prices across vendors
router.get('/compare/:itemId/:choiceOptionId', async (req, res) => {
    try {
        const { itemId, choiceOptionId } = req.params;
        const query = `
            SELECT 
                vpp.*,
                v.vendor_name,
                v.vendor_type_id,
                vt.vendor_type,
                v.contact_person,
                v.contact_number,
                v.email,
                ic.display_name as choice_name,
                ic.brand,
                ic.series,
                ic.sub_series
            FROM vendor_product_pricing vpp
            LEFT JOIN vendors v ON vpp.vendor_id = v.vendor_id
            LEFT JOIN vendor_type vt ON v.vendor_type_id = vt.vendor_type_id
            LEFT JOIN item_choices ic ON vpp.choice_option_id = ic.choice_option_id
            WHERE vpp.item_id = $1 
            AND vpp.choice_option_id = $2
            AND vpp.is_active = true
            AND vpp.price_validity_end >= CURRENT_DATE
            ORDER BY vpp.total_amount ASC
        `;
        const result = await pool.query(query, [itemId, choiceOptionId]);
        
        // Calculate price statistics
        if (result.rows.length > 0) {
            const prices = result.rows.map(row => parseFloat(row.total_amount));
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            res.json({
                pricing_data: result.rows,
                statistics: {
                    average_price: avgPrice.toFixed(2),
                    min_price: minPrice.toFixed(2),
                    max_price: maxPrice.toFixed(2),
                    price_range: (maxPrice - minPrice).toFixed(2),
                    vendor_count: result.rows.length
                }
            });
        } else {
            res.json({ pricing_data: [], statistics: null });
        }
    } catch (error) {
        console.error('Error comparing prices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update prices by percentage
router.post('/bulk-update/:vendorId', async (req, res) => {
    const client = await pool.connect();
    try {
        const { vendorId } = req.params;
        const { percentage_change, item_ids, reason } = req.body;
        
        await client.query('BEGIN');
        
        // Build the update query
        let query;
        let values;
        
        if (item_ids && item_ids.length > 0) {
            query = `
                UPDATE vendor_product_pricing
                SET unit_price = unit_price * (1 + $1/100),
                    updated_at = CURRENT_TIMESTAMP
                WHERE vendor_id = $2 
                AND item_id = ANY($3::int[])
                AND is_active = true
                RETURNING *
            `;
            values = [percentage_change, vendorId, item_ids];
        } else {
            query = `
                UPDATE vendor_product_pricing
                SET unit_price = unit_price * (1 + $1/100),
                    updated_at = CURRENT_TIMESTAMP
                WHERE vendor_id = $2 
                AND is_active = true
                RETURNING *
            `;
            values = [percentage_change, vendorId];
        }
        
        const result = await client.query(query, values);
        
        // Log the bulk update
        const logQuery = `
            INSERT INTO pricing_update_log (
                vendor_id, percentage_change, affected_items, 
                reason, updated_by, update_date
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `;
        
        // Note: You'll need to create pricing_update_log table to track bulk updates
        // For now, we'll skip this step
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Bulk price update successful',
            affected_items: result.rows.length,
            updated_pricing: result.rows
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in bulk price update:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
