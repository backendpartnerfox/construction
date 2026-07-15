-- SAMPLE DATA FOR ITEMS AND VENDORS
-- Run this if your dropdowns are still empty after the fix

-- =============================================
-- INSERT SAMPLE ITEMS
-- =============================================

-- Check if items exist
SELECT COUNT(*) as item_count FROM items;

-- If count is 0, insert sample items:
INSERT INTO items (item_name, item_description, item_unit, item_category, is_active) VALUES
('TMT Bars', 'Thermo-Mechanically Treated steel bars for construction', 'kg', 'Structural', true),
('Cement', 'Portland Pozzolana Cement (PPC)', 'bags', 'Structural', true),
('Sand', 'River sand for construction', 'ton', 'Structural', true),
('Aggregate', '20mm crushed stone aggregate', 'ton', 'Structural', true),
('RMC', 'Ready Mix Concrete', 'cum', 'Structural', true),
('Bricks', 'Red clay bricks', 'nos', 'Walls', true),
('Paint', 'Interior emulsion paint', 'ltr', 'Painting', true),
('Tiles', 'Vitrified floor tiles', 'sqft', 'Flooring', true),
('PVC Pipes', 'PVC plumbing pipes', 'm', 'Plumbing', true),
('Electrical Wire', 'Copper electrical wiring', 'm', 'Electrical', true),
('Door Frame', 'Teak wood door frame', 'nos', 'Doors', true),
('Window Frame', 'UPVC window frame', 'nos', 'Windows', true);

-- =============================================
-- INSERT SAMPLE VENDORS
-- =============================================

-- Check if vendors exist
SELECT COUNT(*) as vendor_count FROM vendors;

-- First, check if vendor_type table exists and has data
SELECT * FROM vendor_type LIMIT 5;

-- If vendor_type is empty, insert types first:
INSERT INTO vendor_type (vendor_type) VALUES
('Product'),
('Service'),
('Product & Service'),
('Lumpsum'),
('Vendor Specific'),
('Executive Partner')
ON CONFLICT DO NOTHING;

-- Now insert sample vendors:
INSERT INTO vendors (
    vendor_name, 
    contact_person, 
    contact_number, 
    email, 
    address,
    vendor_type_id,
    is_active
) VALUES
('TATA Steel', 'Rajesh Kumar', '9876543210', 'rajesh@tatasteel.com', 'Mumbai, Maharashtra', 1, true),
('UltraTech Cement', 'Suresh Sharma', '9876543211', 'suresh@ultratech.com', 'Mumbai, Maharashtra', 1, true),
('JSW Steel', 'Amit Patel', '9876543212', 'amit@jswsteel.com', 'Mumbai, Maharashtra', 1, true),
('Birla Cement', 'Vikram Singh', '9876543213', 'vikram@birla.com', 'Delhi, India', 1, true),
('Local Sand Supplier', 'Ravi Verma', '9876543214', 'ravi@localsand.com', 'Hyderabad, Telangana', 1, true),
('ABC Suppliers', 'Mohan Das', '9876543215', 'mohan@abc.com', 'Hyderabad, Telangana', 3, true),
('XYZ Traders', 'Prakash Reddy', '9876543216', 'prakash@xyz.com', 'Hyderabad, Telangana', 3, true),
('Prime Hardware', 'Sanjay Kumar', '9876543217', 'sanjay@prime.com', 'Hyderabad, Telangana', 1, true),
('Modern Electricals', 'Deepak Joshi', '9876543218', 'deepak@modern.com', 'Hyderabad, Telangana', 1, true),
('Best Plumbing Co', 'Anand Rao', '9876543219', 'anand@bestplumbing.com', 'Hyderabad, Telangana', 2, true);

-- =============================================
-- VERIFY DATA
-- =============================================

-- Check items
SELECT item_id, item_name, item_category, is_active FROM items ORDER BY item_id;

-- Check vendors  
SELECT vendor_id, vendor_name, contact_person, is_active FROM vendors ORDER BY vendor_id;

-- =============================================
-- ALTERNATIVE: IF vendor_type_id CONSTRAINT FAILS
-- =============================================

-- If you get foreign key error, insert without vendor_type_id:
INSERT INTO vendors (
    vendor_name, 
    contact_person, 
    contact_number, 
    email, 
    address,
    is_active
) VALUES
('TATA Steel', 'Rajesh Kumar', '9876543210', 'rajesh@tatasteel.com', 'Mumbai, Maharashtra', true),
('UltraTech Cement', 'Suresh Sharma', '9876543211', 'suresh@ultratech.com', 'Mumbai, Maharashtra', true),
('JSW Steel', 'Amit Patel', '9876543212', 'amit@jswsteel.com', 'Mumbai, Maharashtra', true),
('ABC Suppliers', 'Mohan Das', '9876543215', 'mohan@abc.com', 'Hyderabad, Telangana', true),
('XYZ Traders', 'Prakash Reddy', '9876543216', 'prakash@xyz.com', 'Hyderabad, Telangana', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- EXPECTED RESULT
-- =============================================

-- After running this script, you should have:
-- - 12 items in items table
-- - 10 vendors in vendors table
-- - Both dropdowns in Add Material Modal should now populate

-- =============================================
-- CLEANUP (if you want to start fresh)
-- =============================================

-- CAUTION: This deletes all data!
-- DELETE FROM items WHERE item_id > 0;
-- DELETE FROM vendors WHERE vendor_id > 0;
-- Then run the INSERT statements again
