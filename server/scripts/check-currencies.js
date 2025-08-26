const mongoose = require('mongoose');
const Currency = require('../models/Currency');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arnous_exchange', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkCurrencies() {
  try {
    console.log('🔍 Checking currencies in database...');
    
    // Get all currencies
    const allCurrencies = await Currency.find({});
    console.log(`\n📊 Total currencies in database: ${allCurrencies.length}`);
    
    if (allCurrencies.length === 0) {
      console.log('❌ No currencies found in database!');
      return;
    }
    
    console.log('\n📋 All currencies:');
    allCurrencies.forEach(currency => {
      console.log(`   ${currency.code}: ${currency.name} (Buy: ${currency.buyRate}, Sell: ${currency.sellRate}, Active: ${currency.isActive})`);
    });
    
    // Check for specific new currencies
    const newCurrencyCodes = ['JPY', 'SAR', 'JOD', 'KWD'];
    console.log('\n🔍 Checking for new currencies:');
    
    for (const code of newCurrencyCodes) {
      const currency = await Currency.findOne({ code });
      if (currency) {
        console.log(`   ✅ ${code}: Found - Active: ${currency.isActive}, Buy: ${currency.buyRate}, Sell: ${currency.sellRate}`);
      } else {
        console.log(`   ❌ ${code}: Not found in database`);
      }
    }
    
    // Check active currencies
    const activeCurrencies = await Currency.find({ isActive: true });
    console.log(`\n🟢 Active currencies: ${activeCurrencies.length}`);
    activeCurrencies.forEach(currency => {
      console.log(`   ${currency.code}: ${currency.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking currencies:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkCurrencies();
