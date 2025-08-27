const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Currency = require('./models/Currency');
const User = require('./models/User');

async function testCurrencyFix() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check existing currencies
    console.log('\n🔍 Checking existing currencies...');
    const currencies = await Currency.find({});
    console.log(`Found ${currencies.length} currencies:`);
    
    currencies.forEach(currency => {
      console.log(`  ${currency.code}: Buy=${currency.buyRate}, Sell=${currency.sellRate}, Active=${currency.isActive}`);
    });
    
    // Check admin user
    console.log('\n👤 Checking admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log(`Admin user found: ${adminUser.username}`);
      console.log(`Permissions: ${adminUser.permissions.join(', ')}`);
    } else {
      console.log('❌ No admin user found');
    }
    
    // Test currency validation
    console.log('\n🧪 Testing currency validation...');
    
    try {
      // Test valid update
      const testCurrency = await Currency.findOne({ code: 'USD' });
      if (testCurrency) {
        testCurrency.buyRate = 15000;
        testCurrency.sellRate = 15100;
        await testCurrency.save();
        console.log('✅ Valid currency update test passed');
      }
      
      // Test invalid update (sell rate <= buy rate)
      try {
        const testCurrency2 = await Currency.findOne({ code: 'EUR' });
        if (testCurrency2) {
          testCurrency2.buyRate = 16600;
          testCurrency2.sellRate = 16500; // Invalid: sell < buy
          await testCurrency2.save();
          console.log('❌ Invalid currency update should have failed but passed');
        }
      } catch (validationError) {
        console.log('✅ Invalid currency update correctly rejected:', validationError.message);
      }
      
    } catch (error) {
      console.log('❌ Currency validation test failed:', error.message);
    }
    
    // Test updateMultiple method
    console.log('\n🧪 Testing updateMultiple method...');
    try {
      const testUpdates = {
        USD: { buyRate: 15000, sellRate: 15100 },
        EUR: { buyRate: 16500, sellRate: 16600 }
      };
      
      const results = await Currency.updateMultiple(testUpdates, 'test-admin');
      console.log('✅ updateMultiple test passed');
      console.log(`Updated ${results.length} currencies`);
      
    } catch (error) {
      console.log('❌ updateMultiple test failed:', error.message);
    }
    
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testCurrencyFix();