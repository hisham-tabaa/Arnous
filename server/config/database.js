const mongoose = require('mongoose');
const Currency = require('../models/Currency');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

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
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(mongoURI, mongoOptions);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize database with default data
    await initializeDatabase();
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize database with default data
const initializeDatabase = async () => {
  try {
    // Check if currencies exist
    const currencyCount = await Currency.countDocuments();
    
    if (currencyCount === 0) {
      console.log('Initializing currencies...');
      
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
      console.log('Default currencies created successfully');
    }
    
    // Check if admin user exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount === 0) {
      console.log('Creating default admin user...');
      
      const adminUser = await User.createAdmin({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: 'admin@arnous.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      
      console.log(`Default admin user created: ${adminUser.username}`);
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

// Export models and connection function
module.exports = {
  connectDB,
  Currency,
  User,
  ActivityLog,
  mongoose
};
