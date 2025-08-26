// Simple script to add new currencies to database
const mongoose = require('mongoose');

// Use your Railway MongoDB connection string
const MONGODB_URI = "mongodb://mongo:cDrUTnfhFwEaLVIofirehWpnLwbfIMUE@mongodb.railway.internal:27017/arnous_exchange";

// Currency schema (simplified)
const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  buyRate: { type: Number, required: true },
  sellRate: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
});

const Currency = mongoose.model('Currency', currencySchema);

async function addNewCurrencies() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const newCurrencies = [
      { code: 'JPY', name: 'Japanese Yen', buyRate: 0.0067, sellRate: 0.0070 },
      { code: 'SAR', name: 'Saudi Riyal', buyRate: 1600, sellRate: 1650 },
      { code: 'JOD', name: 'Jordanian Dinar', buyRate: 8400, sellRate: 8500 },
      { code: 'KWD', name: 'Kuwaiti Dinar', buyRate: 19500, sellRate: 19800 }
    ];

    for (const curr of newCurrencies) {
      try {
        const existing = await Currency.findOne({ code: curr.code });
        if (!existing) {
          await Currency.create(curr);
          console.log(`✅ Added ${curr.code} - ${curr.name}`);
        } else {
          console.log(`⚠️ ${curr.code} already exists`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${curr.code}: ${error.message}`);
      }
    }

    console.log('\n🎉 Done! New currencies added to database.');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

addNewCurrencies();
