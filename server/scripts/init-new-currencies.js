const mongoose = require('mongoose');
const Currency = require('../models/Currency');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arnous_exchange', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const newCurrencies = [
  {
    code: 'JPY',
    name: 'Japanese Yen',
    buyRate: 100,
    sellRate: 102,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    buyRate: 4000,
    sellRate: 4020,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    buyRate: 21000,
    sellRate: 21100,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    buyRate: 49000,
    sellRate: 49100,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function initializeNewCurrencies() {
  try {
    console.log('🔄 Initializing new currencies...');
    
    for (const currencyData of newCurrencies) {
      // Check if currency already exists
      const existingCurrency = await Currency.findOne({ code: currencyData.code });
      
      if (existingCurrency) {
        console.log(`✅ Currency ${currencyData.code} already exists`);
        continue;
      }
      
      // Create new currency
      const newCurrency = new Currency(currencyData);
      await newCurrency.save();
      console.log(`✅ Created currency: ${currencyData.code} - ${currencyData.name}`);
    }
    
    console.log('🎉 New currencies initialization completed!');
    
    // Display all active currencies
    const allCurrencies = await Currency.find({ isActive: true });
    console.log('\n📊 Active currencies in database:');
    allCurrencies.forEach(currency => {
      console.log(`   ${currency.code}: ${currency.name} (Buy: ${currency.buyRate}, Sell: ${currency.sellRate})`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing currencies:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the initialization
initializeNewCurrencies();
