const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(__dirname, 'routes', 'enquiries_route.js');
let content = fs.readFileSync(filePath, 'utf8');

// The old employee validation code (simplified pattern matching)
const oldPattern = `    // Validate that assigned employees exist
    const employeeChecks = [];
    if (assigned_sales_person) {
      employeeChecks.push(assigned_sales_person);
    }
    if (assigned_architect) {
      employeeChecks.push(assigned_architect);
    }
    if (assigned_engineer) {
      employeeChecks.push(assigned_engineer);
    }
    if (converted_by) {
      employeeChecks.push(converted_by);
    }

    if (employeeChecks.length > 0) {
      const employeeCheckQuery = \`
        SELECT employee_id FROM employees 
        WHERE employee_id = ANY($1) AND status = 'Active'
      \`;
      const employeeResult = await db.query(employeeCheckQuery, [employeeChecks]);
      
      if (employeeResult.rows.length !== employeeChecks.length) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'One or more assigned employees not found or inactive'
        });
      }
    }`;

// The new fixed code
const newPattern = `    // Validate that assigned employees exist - FIXED
    const employeeChecks = [];
    
    // Only add non-null values and convert to integers
    if (assigned_sales_person && assigned_sales_person !== null && !isNaN(assigned_sales_person)) {
      employeeChecks.push(parseInt(assigned_sales_person));
    }
    if (assigned_architect && assigned_architect !== null && !isNaN(assigned_architect)) {
      employeeChecks.push(parseInt(assigned_architect));
    }
    if (assigned_engineer && assigned_engineer !== null && !isNaN(assigned_engineer)) {
      employeeChecks.push(parseInt(assigned_engineer));
    }
    if (converted_by && converted_by !== null && !isNaN(converted_by)) {
      employeeChecks.push(parseInt(converted_by));
    }

    // Remove duplicates
    const uniqueEmployeeChecks = [...new Set(employeeChecks)];
    
    console.log('[Convert To Lead] Validating employee IDs:', uniqueEmployeeChecks);

    if (uniqueEmployeeChecks.length > 0) {
      const employeeCheckQuery = \`
        SELECT employee_id FROM employees 
        WHERE employee_id = ANY($1::integer[]) AND status = 'Active'
      \`;
      
      try {
        const employeeResult = await db.query(employeeCheckQuery, [uniqueEmployeeChecks]);
        
        const foundEmployeeIds = employeeResult.rows.map(r => r.employee_id);
        console.log('[Convert To Lead] Found active employees:', foundEmployeeIds);
        
        if (employeeResult.rows.length !== uniqueEmployeeChecks.length) {
          await db.query('ROLLBACK');
          const missingIds = uniqueEmployeeChecks.filter(id => !foundEmployeeIds.includes(id));
          console.error('[Convert To Lead] Missing employee IDs:', missingIds);
          return res.status(400).json({
            success: false,
            message: 'One or more assigned employees not found or inactive',
            details: {
              requested: uniqueEmployeeChecks,
              found: foundEmployeeIds,
              missing: missingIds
            }
          });
        }
        
        console.log('[Convert To Lead] Employee validation passed');
      } catch (employeeCheckError) {
        await db.query('ROLLBACK');
        console.error('[Convert To Lead] Employee validation error:', employeeCheckError);
        return res.status(500).json({
          success: false,
          message: 'Error validating employees: ' + employeeCheckError.message
        });
      }
    }`;

// Replace the old pattern with the new one
const updatedContent = content.replace(oldPattern, newPattern);

// Check if replacement was successful
if (updatedContent === content) {
  console.log('❌ No changes made - pattern not found. You may need to manually apply the fix.');
  console.log('See FIX_CONVERT_TO_LEAD.js for the correct code to use.');
} else {
  // Create backup
  const backupPath = path.join(__dirname, 'routes', 'enquiries_route.js.backup');
  fs.writeFileSync(backupPath, content);
  console.log('✅ Backup created:', backupPath);
  
  // Write the fixed version
  fs.writeFileSync(filePath, updatedContent);
  console.log('✅ File updated successfully:', filePath);
  console.log('\n📋 Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Try converting an enquiry to lead again');
  console.log('\nIf issues persist, check the server console for detailed error logs.');
}
