/**
 * Test Social Media URLs
 * This script tests if the social media URLs are accessible
 */

const axios = require('axios');

const socialMediaUrls = {
  facebook: 'https://www.facebook.com/arnous.ex/',
  whatsapp: 'https://whatsapp.com/channel/0029Vb6LYzG3GJP3Ait6uc1e',
  instagram: 'https://instagram.com/arnous.exchange',
  telegram: 'https://t.me/arnous_exchange'
};

async function testUrl(url, platform) {
  try {
    console.log(`🔍 Testing ${platform}...`);
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📏 Size: ${response.data.length} characters`);
    
    if (response.status === 200) {
      console.log(`   🎯 ${platform} is accessible!`);
    } else {
      console.log(`   ⚠️  ${platform} returned status ${response.status}`);
    }
    
    return { success: true, status: response.status, platform };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   🔒 ${platform} connection refused - may be blocked or require authentication`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   🌐 ${platform} domain not found`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   ⏰ ${platform} request timed out`);
    }
    return { success: false, error: error.message, platform };
  }
}

async function testAllUrls() {
  console.log('🚀 Testing Social Media URLs for Arnous Exchange\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const [platform, url] of Object.entries(socialMediaUrls)) {
    const result = await testUrl(url, platform);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('=' .repeat(60));
  console.log('📊 Test Results Summary:');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`   ✅ Successful: ${successful}/${total}`);
  console.log(`   ❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All social media URLs are accessible!');
  } else {
    console.log('\n⚠️  Some URLs may need attention. Check the results above.');
  }
  
  console.log('\n🔗 Social Media Links for Users:');
  Object.entries(socialMediaUrls).forEach(([platform, url]) => {
    console.log(`   📘 ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`);
  });
}

// Run the test
testAllUrls().catch(console.error);
