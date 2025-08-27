const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
const Currency = require('./models/Currency');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const Advice = require('./models/Advice');

async function verifyDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 MongoDB URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
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
    console.log('🌐 Host:', mongoose.connection.host);
    
    // List all collections
    console.log('\n📋 Listing all collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  📁 ${collection.name}: ${count} documents`);
    }
    
    // Verify specific collections and their contents
    console.log('\n🔍 Verifying collection contents...');
    
    // Check currencies
    const currencies = await Currency.find({});
    console.log(`\n💱 Currencies Collection (${currencies.length} documents):`);
    currencies.forEach(currency => {
      console.log(`  ${currency.code}: Buy=${currency.buyRate}, Sell=${currency.sellRate}, Active=${currency.isActive}`);
    });
    
    // Check users
    const users = await User.find({});
    console.log(`\n👥 Users Collection (${users.length} documents):`);
    users.forEach(user => {
      console.log(`  ${user.username}: Role=${user.role}, Active=${user.isActive}, Permissions=[${user.permissions.join(', ')}]`);
    });
    
    // Check activity logs (last 5)
    const activityLogs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`\n📊 Activity Logs Collection (showing last 5 of ${await ActivityLog.countDocuments()} total):`);
    activityLogs.forEach(log => {
      console.log(`  ${log.createdAt.toISOString()}: ${log.action} on ${log.resource} by ${log.user || 'anonymous'} - ${log.status}`);
    });
    
    // Check advice
    const advice = await Advice.find({});
    console.log(`\n💡 Advice Collection (${advice.length} documents):`);
    advice.forEach(item => {
      console.log(`  "${item.title}": Type=${item.type}, Priority=${item.priority}, Active=${item.isActive}`);
    });
    
    // Create indexes if they don't exist
    console.log('\n🔧 Ensuring indexes exist...');
    
    // Currency indexes
    await Currency.collection.createIndex({ code: 1 }, { unique: true });
    await Currency.collection.createIndex({ isActive: 1 });
    await Currency.collection.createIndex({ lastUpdated: -1 });
    console.log('✅ Currency indexes created/verified');
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    console.log('✅ User indexes created/verified');
    
    // Activity log indexes
    await ActivityLog.collection.createIndex({ user: 1 });
    await ActivityLog.collection.createIndex({ action: 1 });
    await ActivityLog.collection.createIndex({ createdAt: -1 });
    console.log('✅ Activity log indexes created/verified');
    
    // Advice indexes
    await Advice.collection.createIndex({ type: 1 });
    await Advice.collection.createIndex({ isActive: 1 });
    await Advice.collection.createIndex({ createdAt: -1 });
    console.log('✅ Advice indexes created/verified');
    
    console.log('\n✅ Database verification completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`  - Database: ${mongoose.connection.db.databaseName}`);
    console.log(`  - Collections: ${collections.length}`);
    console.log(`  - Currencies: ${currencies.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Activity Logs: ${await ActivityLog.countDocuments()}`);
    console.log(`  - Advice: ${advice.length}`);
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the verification
verifyDatabase();