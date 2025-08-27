// Script to manually create admin user
require('dotenv').config({ path: './server/.env' });

const { connectDB, User } = require('./server/config/database');

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Connect to database
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      
      // Test password
      const testPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const isPasswordValid = await existingAdmin.comparePassword(testPassword);
      console.log(`🔑 Password "${testPassword}" is ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      
      if (!isPasswordValid) {
        console.log('🔄 Updating admin password...');
        existingAdmin.password = testPassword;
        await existingAdmin.save();
        console.log('✅ Admin password updated successfully');
      }
      
      return;
    }
    
    // Create new admin user
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: 'admin@arnous.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    };
    
    console.log('Creating admin with data:', {
      username: adminData.username,
      email: adminData.email,
      password: '***hidden***'
    });
    
    const adminUser = await User.createAdmin(adminData);
    console.log('✅ Admin user created successfully:', adminUser.username);
    
    // Verify the created user
    const verifyAdmin = await User.findById(adminUser._id);
    console.log('✅ Verification - Admin user details:');
    console.log(`  ID: ${verifyAdmin._id}`);
    console.log(`  Username: ${verifyAdmin.username}`);
    console.log(`  Email: ${verifyAdmin.email}`);
    console.log(`  Role: ${verifyAdmin.role}`);
    console.log(`  Active: ${verifyAdmin.isActive}`);
    console.log(`  Permissions: ${verifyAdmin.permissions.join(', ')}`);
    
    // Test password
    const isPasswordValid = await verifyAdmin.comparePassword(adminData.password);
    console.log(`🔑 Password test: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin().catch(console.error);