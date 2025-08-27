// Debug script to check database state
require('dotenv').config({ path: './server/.env' });

const mongoose = require('mongoose');
const { connectDB, Currency, User } = require('./server/config/database');

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database state...');
    
    // Connect to database
    await connectDB();
    
    // Check currencies
    console.log('\n📊 Checking currencies...');
    const currencies = await Currency.find({});
    console.log(`Found ${currencies.length} currencies:`);
    currencies.forEach(currency => {
      console.log(`- ${currency.code}: Buy ${currency.buyRate}, Sell ${currency.sellRate}`);
    });
    
    // Check users
    console.log('\n👥 Checking users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
    });
    
    // Check admin user specifically
    console.log('\n🔐 Checking admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`  Username: ${adminUser.username}`);
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  Active: ${adminUser.isActive}`);
      console.log(`  Permissions: ${adminUser.permissions.join(', ')}`);
      console.log(`  Created: ${adminUser.createdAt}`);
      
      // Test password comparison
      const testPassword = process.env.ADMIN_PASSWORD || 'admin123';
      console.log(`\n🔑 Testing password "${testPassword}"...`);
      const isPasswordValid = await adminUser.comparePassword(testPassword);
      console.log(`Password valid: ${isPasswordValid}`);
    } else {
      console.log('❌ No admin user found!');
    }
    
    // Check environment variables
    console.log('\n🌍 Environment variables:');
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
    console.log(`ADMIN_USERNAME: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET (using default)'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

debugDatabase().catch(console.error);