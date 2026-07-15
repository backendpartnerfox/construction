const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test suite for Enquiry Management System
async function testEnquirySystem() {
  console.log('🧪 Testing Enquiry Management System...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Get Packages
    console.log('\n2. Testing packages endpoint...');
    const packagesResponse = await axios.get(`${BASE_URL}/packages`);
    console.log('✅ Packages loaded:', packagesResponse.data.data?.length || 0, 'packages found');

    // Test 3: Get Enquiries
    console.log('\n3. Testing enquiries endpoint...');
    const enquiriesResponse = await axios.get(`${BASE_URL}/enquiries`);
    console.log('✅ Enquiries loaded:', enquiriesResponse.data.data?.length || 0, 'enquiries found');

    // Test 4: Create Sample Enquiry
    console.log('\n4. Testing enquiry creation...');
    const sampleEnquiry = {
      contact_person_name: 'Test Customer',
      contact_surname: 'API Test',
      primary_phone: '9876543210',
      email: 'test@apitest.com',
      city: 'Hyderabad',
      state: 'Telangana',
      project_type: 'Residential',
      construction_type: 'New Construction',
      approximate_area: 2000,
      area_unit: 'sqft',
      budget_range: '1-2 Crores',
      package_id: packagesResponse.data.data?.[0]?.id || null,
      enquiry_notes: 'API Test enquiry'
    };

    const createResponse = await axios.post(`${BASE_URL}/enquiries`, sampleEnquiry);
    const newEnquiryId = createResponse.data.data.enquiry_id;
    console.log('✅ Enquiry created successfully with ID:', newEnquiryId);

    // Test 5: Get Specific Enquiry
    console.log('\n5. Testing get specific enquiry...');
    const specificEnquiry = await axios.get(`${BASE_URL}/enquiries/${newEnquiryId}`);
    console.log('✅ Specific enquiry loaded:', specificEnquiry.data.data.contact_person_name);

    // Test 6: Update Enquiry
    console.log('\n6. Testing enquiry update...');
    const updateData = {
      ...sampleEnquiry,
      contact_person_name: 'Updated Test Customer',
      status: 'Called',
      crm_classification: 'Hot'
    };
    const updateResponse = await axios.put(`${BASE_URL}/enquiries/${newEnquiryId}`, updateData);
    console.log('✅ Enquiry updated successfully');

    // Test 7: Delete Enquiry (cleanup)
    console.log('\n7. Cleaning up test enquiry...');
    await axios.delete(`${BASE_URL}/enquiries/${newEnquiryId}`);
    console.log('✅ Test enquiry deleted successfully');

    console.log('\n🎉 All tests passed! Enquiry CRUD system is working correctly.\n');

    // Summary
    console.log('📋 System Summary:');
    console.log(`- Backend running on: http://localhost:3000`);
    console.log(`- API documentation: http://localhost:3000/api-docs`);
    console.log(`- Packages available: ${packagesResponse.data.data?.length || 0}`);
    console.log(`- Enquiries in system: ${enquiriesResponse.data.data?.length || 0}`);
    console.log('- All CRUD operations: ✅ Working');
    console.log('- Package integration: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running: npm start in constructions-be folder');
    console.log('2. Check database connection in .env file');
    console.log('3. Verify PostgreSQL is running and accessible');
    console.log('4. Run the database verification script: verify_enquiry_system.sql');
  }
}

// Run the test
testEnquirySystem();
