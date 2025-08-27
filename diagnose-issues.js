// Diagnostic script to check all issues
require('dotenv').config({ path: './server/.env' });

const axios = require('axios');

async function diagnoseIssues() {
  console.log('🔍 Diagnosing Railway deployment issues...\n');
  
  const baseURL = 'https://arnous-production.up.railway.app';
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 10000 });
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('📊 Database status:', healthResponse.data.database?.readyState === 1 ? 'Connected' : 'Disconnected');
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  try {
    // Test 2: Currencies API
    console.log('\n2️⃣ Testing currencies endpoint...');
    const currenciesResponse = await axios.get(`${baseURL}/api/currencies`, { timeout: 10000 });
    const currencies = currenciesResponse.data.currencies;
    
    if (currencies && Object.keys(currencies).length > 0) {
      console.log('✅ Currencies API working');
      console.log('📋 Available currencies:', Object.keys(currencies).join(', '));
      console.log('💰 Sample rates:', Object.entries(currencies).slice(0, 2).map(([code, data]) => 
        `${code}: ${data.buyRate}/${data.sellRate}`).join(', '));
    } else {
      console.log('❌ Currencies API returned empty data');
    }
  } catch (error) {
    console.log('❌ Currencies API failed:', error.message);
    if (error.response) {
      console.log('📄 Response status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  try {
    // Test 3: Admin Login
    console.log('\n3️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { timeout: 10000 });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login working');
      console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.message);
    if (error.response) {
      console.log('📄 Response status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  try {
    // Test 4: User Page
    console.log('\n4️⃣ Testing user page...');
    const pageResponse = await axios.get(`${baseURL}/rates`, { timeout: 10000 });
    console.log('✅ User page accessible');
    console.log('📄 Page size:', pageResponse.data.length, 'characters');
  } catch (error) {
    console.log('❌ User page failed:', error.message);
  }
  
  console.log('\n🏁 Diagnosis complete!');
  console.log('\n💡 Recommendations:');
  console.log('1. Check Railway logs for detailed error messages');
  console.log('2. Verify all environment variables are set correctly');
  console.log('3. Ensure MongoDB connection is stable');
  console.log('4. Check browser console for client-side errors');
}

diagnoseIssues().catch(console.error);