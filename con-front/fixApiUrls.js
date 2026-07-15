// Script to fix API URLs in all master data components
// Run: node fixApiUrls.js

const fs = require('fs');
const path = require('path');

const masterDataDir = path.join(__dirname, 'src', 'pages', 'admin', 'masterdata');

const files = [
  'EnquirySourcesManagement.js',
  'EnquiryStatusManagement.js',
  'PaymentMethodsManagement.js',
  'PaymentTypesManagement.js',
  'VendorTypesManagement.js',
  'VendorsManagement.js',
  'WindowDimensionsManagement.js'
];

files.forEach(file => {
  const filePath = path.join(masterDataDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace API_BASE_URL definition
    content = content.replace(
      /const API_BASE_URL = process\.env\.REACT_APP_API_URL \|\| 'http:\/\/localhost:9001\/admin';/g,
      "const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';"
    );
    
    // Replace all fetch calls to add /api prefix
    content = content.replace(/\$\{API_BASE_URL\}\//g, '${API_BASE_URL}/api/');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`❌ Not found: ${file}`);
  }
});

console.log('\n✅ All master data components API URLs fixed!');
