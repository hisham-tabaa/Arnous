// Deployment Health Check Script
const axios = require('axios');

const BASE_URL = 'https://arnous-production.up.railway.app';

async function checkDeployment() {
  console.log('🔍 Checking Railway Deployment Health...\n');

  // Test 1: Health Check
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Company Info API
  try {
    console.log('\n2. Testing company info API...');
    const companyResponse = await axios.get(`${BASE_URL}/api/company/info`, { timeout: 10000 });
    console.log('✅ Company info API working:', !!companyResponse.data.companyInfo);
  } catch (error) {
    console.log('❌ Company info API failed:', error.message);
  }

  // Test 3: Advice API
  try {
    console.log('\n3. Testing advice API...');
    const adviceResponse = await axios.get(`${BASE_URL}/api/advice`, { timeout: 10000 });
    console.log('✅ Advice API working. Found', adviceResponse.data.advice?.length || 0, 'advice items');
  } catch (error) {
    console.log('❌ Advice API failed:', error.message);
  }

  // Test 4: Currency API
  try {
    console.log('\n4. Testing currency API...');
    const currencyResponse = await axios.get(`${BASE_URL}/api/currencies`, { timeout: 10000 });
    const currencies = currencyResponse.data.currencies;
    console.log('✅ Currency API working. Found currencies:', Object.keys(currencies || {}));
  } catch (error) {
    console.log('❌ Currency API failed:', error.message);
  }

  // Test 5: Frontend Loading
  try {
    console.log('\n5. Testing frontend loading...');
    const frontendResponse = await axios.get(`${BASE_URL}/rates`, { timeout: 10000 });
    const isLoading = frontendResponse.data.includes('Loading Currency Dashboard');
    if (isLoading) {
      console.log('⚠️ Frontend is stuck on loading screen - this indicates an API error');
    } else {
      console.log('✅ Frontend loaded successfully');
    }
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
  }

  console.log('\n🔧 Deployment Check Complete!');
}

checkDeployment().catch(console.error);
