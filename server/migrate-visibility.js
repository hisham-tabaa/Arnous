const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Currency = require('./models/Currency');

async function migrateVisibility() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('🏢 Database:', mongoose.connection.db.databaseName);
    
    // Find all currencies that don't have isVisible field
    const currenciesWithoutVisibility = await Currency.find({ 
      isVisible: { $exists: false } 
    });
    
    console.log(`📊 Found ${currenciesWithoutVisibility.length} currencies without visibility field`);
    
    if (currenciesWithoutVisibility.length > 0) {
      // Update all currencies to have isVisible: true by default
      const result = await Currency.updateMany(
        { isVisible: { $exists: false } },
        { $set: { isVisible: true } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} currencies with isVisible: true`);
    } else {
      console.log('✅ All currencies already have visibility field');
    }
    
    // Verify the update
    const allCurrencies = await Currency.find({});
    console.log('\n📋 Current currencies with visibility:');
    allCurrencies.forEach(currency => {
      console.log(`  ${currency.code}: isVisible=${currency.isVisible}, isActive=${currency.isActive}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateVisibility();