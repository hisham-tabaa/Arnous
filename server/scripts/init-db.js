#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes the MongoDB database with default data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Currency, User, ActivityLog } = require('../config/database');

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
};

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(mongoURI, mongoOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize database with default data
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Check if currencies exist
    const currencyCount = await Currency.countDocuments();
    
    if (currencyCount === 0) {
      console.log('📊 Initializing currencies...');
      
      const defaultCurrencies = [
        {
          code: 'USD',
          name: 'US Dollar',
          buyRate: 15000,
          sellRate: 15100,
          createdBy: 'system'
        },
        {
          code: 'EUR',
          name: 'Euro',
          buyRate: 16500,
          sellRate: 16600,
          createdBy: 'system'
        },
        {
          code: 'GBP',
          name: 'British Pound',
          buyRate: 19000,
          sellRate: 19100,
          createdBy: 'system'
        },
        {
          code: 'TRY',
          name: 'Turkish Lira',
          buyRate: 500,
          sellRate: 510,
          createdBy: 'system'
        }
      ];
      
      await Currency.insertMany(defaultCurrencies);
      console.log('✅ Default currencies created successfully');
    } else {
      console.log(`📊 Found ${currencyCount} existing currencies`);
    }
    
    // Check if admin user exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount === 0) {
      console.log('👤 Creating default admin user...');
      
      const adminUser = await User.createAdmin({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: 'admin@arnous.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      
      console.log(`✅ Default admin user created: ${adminUser.username}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    } else {
      console.log(`👤 Found ${adminCount} existing admin users`);
    }
    
    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    // Currency indexes
    await Currency.collection.createIndex({ code: 1 }, { unique: true });
    await Currency.collection.createIndex({ isActive: 1 });
    await Currency.collection.createIndex({ lastUpdated: -1 });
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    
    // ActivityLog indexes
    await ActivityLog.collection.createIndex({ user: 1, createdAt: -1 });
    await ActivityLog.collection.createIndex({ action: 1, createdAt: -1 });
    await ActivityLog.collection.createIndex({ resource: 1, createdAt: -1 });
    await ActivityLog.collection.createIndex({ status: 1, createdAt: -1 });
    
    console.log('✅ Database indexes created successfully');
    
    // Display database statistics
    const stats = await getDatabaseStats();
    console.log('\n📈 Database Statistics:');
    console.log(`   Currencies: ${stats.currencies}`);
    console.log(`   Users: ${stats.users}`);
    console.log(`   Activity Logs: ${stats.activityLogs}`);
    
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Get database statistics
async function getDatabaseStats() {
  try {
    const [currencies, users, activityLogs] = await Promise.all([
      Currency.countDocuments(),
      User.countDocuments(),
      ActivityLog.countDocuments()
    ]);
    
    return { currencies, users, activityLogs };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { currencies: 0, users: 0, activityLogs: 0 };
  }
}

// Reset database (dangerous operation)
async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('   Are you sure you want to continue? (y/N)');
    
    // In a real script, you would read from stdin
    // For now, we'll just log the warning
    console.log('   Database reset cancelled for safety');
    console.log('   To reset the database, manually delete collections or use MongoDB commands');
    
  } catch (error) {
    console.error('❌ Database reset error:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'reset') {
      await connectDB();
      await resetDatabase();
    } else {
      await connectDB();
      await initializeDatabase();
    }
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  connectDB,
  initializeDatabase,
  resetDatabase,
  getDatabaseStats
};
