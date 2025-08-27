// Test MongoDB connection with Railway variables
require('dotenv').config({ path: './server/.env' });

const mongoose = require('mongoose');

// Test connection function
async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('Environment variables:');
  console.log('- MONGOHOST:', process.env.MONGOHOST || 'NOT SET');
  console.log('- MONGOUSER:', process.env.MONGOUSER || 'NOT SET');
  console.log('- MONGOPASSWORD:', process.env.MONGOPASSWORD ? 'SET' : 'NOT SET');
  console.log('- MONGOPORT:', process.env.MONGOPORT || 'NOT SET');
  console.log('- MONGO_INITDB_DATABASE:', process.env.MONGO_INITDB_DATABASE || 'NOT SET');
  console.log('- MONGO_URL:', process.env.MONGO_URL || 'NOT SET');
  console.log('- MONGO_PUBLIC_URL:', process.env.MONGO_PUBLIC_URL || 'NOT SET');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET');
  
  // Build connection string like the updated database.js
  let mongoURI;
  
  if (process.env.MONGOHOST && process.env.MONGOUSER && process.env.MONGOPASSWORD) {
    const host = process.env.MONGOHOST;
    const port = process.env.MONGOPORT || '27017';
    const username = process.env.MONGOUSER;
    const password = process.env.MONGOPASSWORD;
    const database = process.env.MONGO_INITDB_DATABASE || 'arnous_exchange';
    
    mongoURI = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
    console.log('\n✅ Using Railway MongoDB service variables');
  }
  else if (process.env.MONGO_URL) {
    mongoURI = process.env.MONGO_URL;
    console.log('\n✅ Using MONGO_URL');
  }
  else if (process.env.MONGO_PUBLIC_URL) {
    mongoURI = process.env.MONGO_PUBLIC_URL;
    console.log('\n✅ Using MONGO_PUBLIC_URL');
  }
  else if (process.env.MONGODB_URI) {
    mongoURI = process.env.MONGODB_URI;
    console.log('\n✅ Using MONGODB_URI (fallback)');
  }
  
  if (!mongoURI) {
    console.error('\n❌ No MongoDB URI could be constructed');
    return;
  }
  
  console.log('Connection URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  try {
    console.log('\n🔄 Attempting to connect...');
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Connected to:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testConnection().catch(console.error);