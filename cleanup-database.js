// Script to clean up database issues
require('dotenv').config({ path: './server/.env' });

const { connectDB, Currency, User, ActivityLog } = require('./server/config/database');

async function cleanupDatabase() {
  try {
    console.log('🧹 Cleaning up database issues...');
    
    // Connect to database
    await connectDB();
    
    // 1. Clean up invalid activity logs
    console.log('\n1️⃣ Cleaning up invalid activity logs...');
    const invalidLogs = await ActivityLog.find({ user: 'anonymous' });
    console.log(`Found ${invalidLogs.length} invalid activity logs`);
    
    if (invalidLogs.length > 0) {
      await ActivityLog.deleteMany({ user: 'anonymous' });
      console.log('✅ Removed invalid activity logs');
    }
    
    // 2. Check currencies for validation issues
    console.log('\n2️⃣ Checking currency validation...');
    const currencies = await Currency.find({});
    console.log(`Found ${currencies.length} currencies`);
    
    for (const currency of currencies) {
      if (currency.buyRate >= currency.sellRate) {
        console.log(`⚠️  Invalid rates for ${currency.code}: Buy ${currency.buyRate} >= Sell ${currency.sellRate}`);
        
        // Fix by adjusting sell rate to be higher than buy rate
        const newSellRate = currency.buyRate + (currency.buyRate * 0.01); // Add 1% spread
        currency.sellRate = newSellRate;
        await currency.save();
        console.log(`✅ Fixed ${currency.code}: Buy ${currency.buyRate}, Sell ${newSellRate}`);
      } else {
        console.log(`✅ ${currency.code}: Buy ${currency.buyRate}, Sell ${currency.sellRate} (OK)`);
      }
    }
    
    // 3. Verify admin user
    console.log('\n3️⃣ Verifying admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('✅ Admin user exists:', adminUser.username);
      
      // Test password
      const testPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const isPasswordValid = await adminUser.comparePassword(testPassword);
      console.log(`🔑 Password "${testPassword}" is ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      
      if (!isPasswordValid) {
        console.log('🔄 Updating admin password...');
        adminUser.password = testPassword;
        await adminUser.save();
        console.log('✅ Admin password updated');
      }
    } else {
      console.log('❌ No admin user found, creating one...');
      const adminData = {
        username: process.env.ADMIN_USERNAME || 'admin',
        email: 'admin@arnous.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      };
      
      const newAdmin = await User.createAdmin(adminData);
      console.log('✅ Admin user created:', newAdmin.username);
    }
    
    // 4. Test activity logging
    console.log('\n4️⃣ Testing activity logging...');
    try {
      await ActivityLog.logActivity({
        user: null,
        action: 'login',
        resource: 'auth',
        details: {
          test: true,
          isAnonymous: true
        },
        status: 'success'
      });
      console.log('✅ Activity logging works with null user');
    } catch (error) {
      console.log('❌ Activity logging failed:', error.message);
    }
    
    // 5. Summary
    console.log('\n📊 Database Summary:');
    const currencyCount = await Currency.countDocuments();
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const logCount = await ActivityLog.countDocuments();
    
    console.log(`- Currencies: ${currencyCount}`);
    console.log(`- Users: ${userCount} (${adminCount} admins)`);
    console.log(`- Activity Logs: ${logCount}`);
    
    console.log('\n✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

cleanupDatabase().catch(console.error);