const mongoose = require('mongoose');
const Currency = require('../models/Currency');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Advice = require('../models/Advice');

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // Increased for Railway
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000, // Added for Railway
  retryWrites: true,
  w: 'majority'
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Build MongoDB URI based on available environment variables
    let mongoURI;
    
    // Check for Railway MongoDB variables first
    if (process.env.MONGOHOST && process.env.MONGOUSER && process.env.MONGOPASSWORD) {
      // Railway MongoDB service variables
      const host = process.env.MONGOHOST;
      const port = process.env.MONGOPORT || '27017';
      const username = process.env.MONGOUSER;
      const password = process.env.MONGOPASSWORD;
      const database = process.env.MONGO_INITDB_DATABASE || 'arnous_exchange';
      
      mongoURI = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
      console.log('Using Railway MongoDB service connection');
    }
    // Check for direct Railway MongoDB URLs
    else if (process.env.MONGO_URL) {
      mongoURI = process.env.MONGO_URL;
      console.log('Using MONGO_URL connection');
    }
    else if (process.env.MONGO_PUBLIC_URL) {
      mongoURI = process.env.MONGO_PUBLIC_URL;
      console.log('Using MONGO_PUBLIC_URL connection');
    }
    // Fall back to standard MongoDB URIs
    else if (process.env.MONGODB_URI_PROD) {
      mongoURI = process.env.MONGODB_URI_PROD;
      console.log('Using MONGODB_URI_PROD connection');
    }
    else if (process.env.MONGODB_URI) {
      mongoURI = process.env.MONGODB_URI;
      console.log('Using MONGODB_URI connection');
    }
    else if (process.env.MONGODB_URL) {
      mongoURI = process.env.MONGODB_URL;
      console.log('Using MONGODB_URL connection');
    }
    
    if (!mongoURI) {
      console.error('Available environment variables:', {
        MONGOHOST: process.env.MONGOHOST ? 'SET' : 'NOT SET',
        MONGOUSER: process.env.MONGOUSER ? 'SET' : 'NOT SET',
        MONGOPASSWORD: process.env.MONGOPASSWORD ? 'SET' : 'NOT SET',
        MONGO_URL: process.env.MONGO_URL ? 'SET' : 'NOT SET',
        MONGO_PUBLIC_URL: process.env.MONGO_PUBLIC_URL ? 'SET' : 'NOT SET',
        MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
      });
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const conn = await mongoose.connect(mongoURI, mongoOptions);
    
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    
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
        },
        {
          code: 'JPY',
          name: 'Japanese Yen',
          buyRate: 100,
          sellRate: 101,
          createdBy: 'system'
        },
        {
          code: 'SAR',
          name: 'Saudi Riyal',
          buyRate: 4000,
          sellRate: 4010,
          createdBy: 'system'
        },
        {
          code: 'JOD',
          name: 'Jordanian Dinar',
          buyRate: 21000,
          sellRate: 21100,
          createdBy: 'system'
        },
        {
          code: 'KWD',
          name: 'Kuwaiti Dinar',
          buyRate: 49000,
          sellRate: 49100,
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
    
    // Initialize advice collection (if needed)
    const adviceCount = await Advice.countDocuments();
    if (adviceCount === 0) {
      console.log('Advice collection is empty - ready for admin input');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't exit on initialization errors to allow graceful degradation
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
  Advice,
  mongoose,
  getDbStatus: () => ({
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  })
};
