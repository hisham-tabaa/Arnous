// Test script to verify company info API
const axios = require('axios');

async function testCompanyAPI() {
  try {
    console.log('🧪 Testing Company Info API...\n');
    
    const response = await axios.get('https://arnous-production.up.railway.app/api/company/info', {
      timeout: 10000
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📋 Company Info Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ API Test Failed:');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
  }
}

testCompanyAPI();
