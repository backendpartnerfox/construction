-- Purchase Orders Module - Database Schema

-- 1. Purchase Orders Main Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id),
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    
    -- Amounts
    subtotal DECIMAL(15, 2) DEFAULT 0,
    total_discount DECIMAL(15, 2) DEFAULT 0,
    total_gst DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    -- Status values: Draft, Pending Approval, Approved, Sent, Acknowledged, In Transit, Delivered, Partially Delivered, Cancelled, Closed
    
    -- Terms & Conditions
    payment_terms TEXT,
    delivery_terms TEXT,
    notes TEXT,
    terms_and_conditions TEXT,
    
    -- Tracking (without user FK constraints)
    created_by INTEGER,
    approved_by INTEGER,
    approval_date TIMESTAMP,
    sent_date TIMESTAMP,
    acknowledged_date TIMESTAMP,
    delivered_date TIMESTAMP,
    cancelled_date TIMESTAMP,
    cancelled_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_po_status CHECK (status IN (
        'Draft', 'Pending Approval', 'Approved', 'Sent', 
        'Acknowledged', 'In Transit', 'Delivered', 
        'Partially Delivered', 'Cancelled', 'Closed'
    ))
);

-- 2. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    po_item_id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    
    -- Item Details
    item_id INTEGER NOT NULL REFERENCES items(item_id),
    material_costing_id INTEGER REFERENCES project_material_costing(costing_id),
    choice_option_id INTEGER REFERENCES item_choices(choice_option_id),
    
    -- Description
    item_description TEXT,
    specifications TEXT,
    
    -- Quantity & Unit
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) GENERATED ALWAYS AS (
        quantity * unit_price * discount_percentage / 100
    ) STORED,
    
    -- Subtotal after discount
    subtotal DECIMAL(15, 2) GENERATED ALWAYS AS (
        (quantity * unit_price) - (quantity * unit_price * discount_percentage / 100)
    ) STORED,
    
    -- GST
    gst_percentage DECIMAL(5, 2) DEFAULT 18,
    gst_amount DECIMAL(15, 2) GENERATED ALWAYS AS (
        ((quantity * unit_price) - (quantity * unit_price * discount_percentage / 100)) * gst_percentage / 100
    ) STORED,
    
    -- Total
    total_amount DECIMAL(15, 2) GENERATED ALWAYS AS (
        ((quantity * unit_price) - (quantity * unit_price * discount_percentage / 100)) * (1 + gst_percentage / 100)
    ) STORED,
    
    -- Delivery Tracking
    quantity_received DECIMAL(10, 2) DEFAULT 0,
    quantity_pending DECIMAL(10, 2) GENERATED ALWAYS AS (quantity - COALESCE(quantity_received, 0)) STORED,
    
    -- Status
    item_status VARCHAR(20) DEFAULT 'Pending',
    -- Status: Pending, Partially Received, Received, Cancelled
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_po_item_status CHECK (item_status IN (
        'Pending', 'Partially Received', 'Received', 'Cancelled'
    ))
);

-- 3. PO Delivery Tracking Table
CREATE TABLE IF NOT EXISTS po_deliveries (
    delivery_id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id),
    po_item_id INTEGER NOT NULL REFERENCES purchase_order_items(po_item_id),
    
    -- Delivery Details
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity_delivered DECIMAL(10, 2) NOT NULL,
    
    -- Quality Check
    quality_status VARCHAR(20) DEFAULT 'Pending',
    -- Status: Pending, Approved, Rejected, Partial
    quality_notes TEXT,
    inspected_by INTEGER,
    inspection_date DATE,
    
    -- Documents
    delivery_note_number VARCHAR(50),
    invoice_number VARCHAR(50),
    
    -- Metadata
    received_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PO Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS po_status_history (
    history_id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by INTEGER,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 5. PO Documents/Attachments Table
CREATE TABLE IF NOT EXISTS po_documents (
    document_id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id),
    document_type VARCHAR(50) NOT NULL,
    -- Types: PO_PDF, Invoice, Delivery_Note, Quality_Certificate, Other
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_po_project ON purchase_orders(project_id);
CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_date ON purchase_orders(po_date);
CREATE INDEX idx_po_number ON purchase_orders(po_number);

CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX idx_po_items_item ON purchase_order_items(item_id);
CREATE INDEX idx_po_items_material_costing ON purchase_order_items(material_costing_id);

CREATE INDEX idx_po_deliveries_po ON po_deliveries(po_id);
CREATE INDEX idx_po_deliveries_item ON po_deliveries(po_item_id);
CREATE INDEX idx_po_deliveries_date ON po_deliveries(delivery_date);

-- Function to Auto-Generate PO Number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_part VARCHAR(4);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(po_number FROM 'PO-' || year_part || '-([0-9]+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || year_part || '-%';
    
    NEW.po_number := 'PO-' || year_part || '-' || LPAD(next_number::TEXT, 5, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to Auto-Generate PO Number
CREATE TRIGGER trigger_generate_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
WHEN (NEW.po_number IS NULL OR NEW.po_number = '')
EXECUTE FUNCTION generate_po_number();

-- Trigger to Update PO Totals when Items Change
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_orders
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM purchase_order_items
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        total_discount = (
            SELECT COALESCE(SUM(discount_amount), 0)
            FROM purchase_order_items
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        total_gst = (
            SELECT COALESCE(SUM(gst_amount), 0)
            FROM purchase_order_items
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM purchase_order_items
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE po_id = COALESCE(NEW.po_id, OLD.po_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for PO Total Updates
CREATE TRIGGER trigger_update_po_totals_insert
AFTER INSERT ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_update
AFTER UPDATE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_delete
AFTER DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_totals();

-- Comments
COMMENT ON TABLE purchase_orders IS 'Main purchase orders table for managing vendor orders';
COMMENT ON TABLE purchase_order_items IS 'Line items for each purchase order';
COMMENT ON TABLE po_deliveries IS 'Tracks deliveries and receipts for PO items';
COMMENT ON TABLE po_status_history IS 'Audit trail for PO status changes';
COMMENT ON TABLE po_documents IS 'Stores document attachments for POs';

COMMENT ON COLUMN purchase_orders.po_number IS 'Auto-generated unique PO number in format PO-YYYY-XXXXX';
COMMENT ON COLUMN purchase_orders.status IS 'Current status of the purchase order';
COMMENT ON COLUMN purchase_order_items.quantity_received IS 'Total quantity received so far';
COMMENT ON COLUMN purchase_order_items.quantity_pending IS 'Quantity still pending delivery';
