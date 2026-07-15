const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all TMT bar pricing with vendor and item details
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.*,
                v.vendor_name,
                i.item_name,
                ic.display_name as choice_name,
                ts.dia,
                ts.length,
                ts.weight_per_meter,
                ts.weight_of_full_bar
            FROM sourcing_item_tmt_bar_pricing s
            LEFT JOIN vendors v ON s.vendor_id = v.vendor_id
            LEFT JOIN items i ON s.item_id = i.item_id
            LEFT JOIN item_choices ic ON s.choice_option_id = ic.choice_option_id
            LEFT JOIN item_tmt_standards ts ON s.tmt_standard_id = ts.tmt_standard_id
            ORDER BY s.vendor_id, s.choice_option_id, ts.dia
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching TMT bar pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get TMT bar pricing by vendor
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const query = `
            SELECT 
                s.*,
                v.vendor_name,
                i.item_name,
                ic.display_name as choice_name,
                ts.dia,
                ts.length,
                ts.weight_per_meter,
                ts.weight_of_full_bar
            FROM sourcing_item_tmt_bar_pricing s
            LEFT JOIN vendors v ON s.vendor_id = v.vendor_id
            LEFT JOIN items i ON s.item_id = i.item_id
            LEFT JOIN item_choices ic ON s.choice_option_id = ic.choice_option_id
            LEFT JOIN item_tmt_standards ts ON s.tmt_standard_id = ts.tmt_standard_id
            WHERE s.vendor_id = $1
            ORDER BY s.choice_option_id, ts.dia
        `;
        const result = await pool.query(query, [vendorId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor TMT bar pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get best prices for specific TMT specification
router.get('/best-price/:choiceOptionId/:tmtStandardId', async (req, res) => {
    try {
        const { choiceOptionId, tmtStandardId } = req.params;
        const query = `
            SELECT 
                s.*,
                v.vendor_name,
                ic.display_name as choice_name,
                ts.dia,
                ts.length
            FROM sourcing_item_tmt_bar_pricing s
            LEFT JOIN vendors v ON s.vendor_id = v.vendor_id
            LEFT JOIN item_choices ic ON s.choice_option_id = ic.choice_option_id
            LEFT JOIN item_tmt_standards ts ON s.tmt_standard_id = ts.tmt_standard_id
            WHERE s.choice_option_id = $1 
            AND s.tmt_standard_id = $2
            AND s.is_active = true
            ORDER BY s.total_amount_after_discount ASC
            LIMIT 3
        `;
        const result = await pool.query(query, [choiceOptionId, tmtStandardId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching best TMT bar prices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new TMT bar pricing
router.post('/', async (req, res) => {
    try {
        const {
            vendor_id,
            item_id,
            choice_option_id,
            tmt_standard_id,
            unit_price,
            gst_percentage,
            discount_percentage,
            min_order_quantity,
            price_validity_start,
            price_validity_end,
            quotation_reference,
            is_approved,
            is_active
        } = req.body;

        const query = `
            INSERT INTO sourcing_item_tmt_bar_pricing (
                vendor_id, item_id, choice_option_id, tmt_standard_id,
                unit_price, gst_percentage, discount_percentage,
                min_order_quantity, price_validity_start, price_validity_end,
                quotation_reference, is_approved, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        
        const values = [
            vendor_id, item_id, choice_option_id, tmt_standard_id,
            unit_price, gst_percentage || 18.00, discount_percentage || 0,
            min_order_quantity || 1, price_validity_start, price_validity_end,
            quotation_reference, is_approved || false, is_active || true
        ];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating TMT bar pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update TMT bar pricing
router.put('/:pricingId', async (req, res) => {
    try {
        const { pricingId } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const setClause = [];
        const values = [];
        let paramCount = 1;
        
        Object.keys(updates).forEach(key => {
            if (key !== 'sourcing_item_tmt_bar_pricing_id') {
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
            UPDATE sourcing_item_tmt_bar_pricing
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE sourcing_item_tmt_bar_pricing_id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'TMT bar pricing not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating TMT bar pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete TMT bar pricing (soft delete by setting is_active = false)
router.delete('/:pricingId', async (req, res) => {
    try {
        const { pricingId } = req.params;
        
        const query = `
            UPDATE sourcing_item_tmt_bar_pricing
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE sourcing_item_tmt_bar_pricing_id = $1
            RETURNING *
        `;
        
        const result = await pool.query(query, [pricingId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'TMT bar pricing not found' });
        }
        
        res.json({ message: 'TMT bar pricing deactivated successfully' });
    } catch (error) {
        console.error('Error deleting TMT bar pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Compare prices across vendors for a specific TMT specification
router.get('/compare/:choiceOptionId/:tmtStandardId', async (req, res) => {
    try {
        const { choiceOptionId, tmtStandardId } = req.params;
        const query = `
            SELECT 
                s.*,
                v.vendor_name,
                v.contact_person,
                v.contact_number,
                ic.display_name as choice_name,
                ts.dia,
                ts.length,
                ts.weight_of_full_bar
            FROM sourcing_item_tmt_bar_pricing s
            LEFT JOIN vendors v ON s.vendor_id = v.vendor_id
            LEFT JOIN item_choices ic ON s.choice_option_id = ic.choice_option_id
            LEFT JOIN item_tmt_standards ts ON s.tmt_standard_id = ts.tmt_standard_id
            WHERE s.choice_option_id = $1 
            AND s.tmt_standard_id = $2
            AND s.is_active = true
            AND s.price_validity_end >= CURRENT_DATE
            ORDER BY s.total_amount_after_discount ASC
        `;
        const result = await pool.query(query, [choiceOptionId, tmtStandardId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error comparing TMT bar prices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
