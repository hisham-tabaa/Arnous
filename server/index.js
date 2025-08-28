const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Import Database Configuration
const { connectDB, Currency, User, ActivityLog, Advice, getDbStatus, mongoose } = require('./config/database');

// Import Services
const AuthService = require('./services/authService');
const CurrencyService = require('./services/currencyService');
const AdviceService = require('./services/adviceService');

// Import Middleware
const { 
  verifyToken, 
  requireAdmin, 
  requirePermission, 
  logActivity, 
  addRequestTime,
  rateLimit 
} = require('./middleware/auth');

// Import Social Media APIs
const FacebookAPI = require('./socialMedia/facebook');
const InstagramAPI = require('./socialMedia/instagram');
const TelegramAPI = require('./socialMedia/telegram');
const WhatsAppAPI = require('./socialMedia/whatsapp');

// Import Social Media Configuration
const { getAllSocialMedia, validateSocialMediaUrls } = require('./config/socialMedia');

// Initialize Social Media APIs with environment variables
const facebookAPI = new FacebookAPI(
  process.env.FACEBOOK_ACCESS_TOKEN,
  process.env.FACEBOOK_PAGE_ID
);

const instagramAPI = new InstagramAPI(
  process.env.FACEBOOK_ACCESS_TOKEN, // Instagram uses the same Facebook token
  process.env.INSTAGRAM_ACCOUNT_ID
);

const telegramAPI = new TelegramAPI(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_CHANNEL_ID
);

const whatsappAPI = new WhatsAppAPI(
  process.env.WHATSAPP_ACCESS_TOKEN,
  process.env.WHATSAPP_PHONE_NUMBER_ID
);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://arnous-production.up.railway.app", process.env.CLIENT_URL].filter(Boolean)
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(addRequestTime);

// Rate limiting
app.use('/api/', rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Connect to MongoDB
connectDB().then(() => {
  console.log('Database connected successfully');
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Socket.io authentication middleware (optional for public connections)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    // If no token provided, allow connection as anonymous user
    if (!token) {
      socket.userId = null;
      socket.user = null;
      socket.isAnonymous = true;
      return next();
    }

    // If token provided, validate it
    const validation = await AuthService.validateToken(token);
    if (!validation.valid) {
      // If token is invalid, still allow connection as anonymous
      socket.userId = null;
      socket.user = null;
      socket.isAnonymous = true;
      return next();
    }

    socket.userId = validation.user.id;
    socket.user = validation.user;
    socket.isAnonymous = false;
    next();
  } catch (error) {
    // On any error, allow connection as anonymous
    socket.userId = null;
    socket.user = null;
    socket.isAnonymous = true;
    next();
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const userInfo = socket.isAnonymous ? 'Anonymous User' : socket.user?.username || 'Unknown User';
  console.log(`🔌 WebSocket connected: ${userInfo} (ID: ${socket.id})`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket disconnected: ${userInfo} (ID: ${socket.id})`);
  });
});

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: {
      readyState: db.readyState, // 1 means connected
      host: db.host,
      name: db.name
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database verification endpoint (admin only)
app.get('/api/admin/database/verify', 
  verifyToken, 
  requireAdmin,
  async (req, res) => {
    try {
      console.log('🔍 Admin database verification requested by:', req.user?.username);
      console.log('🔗 Database connection state:', mongoose.connection.readyState);
      console.log('🏢 Database name:', mongoose.connection.db?.databaseName);
      
      // Get collection information
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name));
      
      const collectionInfo = {};
      
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        collectionInfo[collection.name] = {
          name: collection.name,
          documentCount: count
        };
        console.log(`  📁 ${collection.name}: ${count} documents`);
      }
      
      // Get specific model counts
      const currencies = await Currency.countDocuments();
      const users = await User.countDocuments();
      const activityLogs = await ActivityLog.countDocuments();
      const advice = await Advice.countDocuments();
      
      console.log(`📊 Model counts - Currencies: ${currencies}, Users: ${users}, ActivityLogs: ${activityLogs}, Advice: ${advice}`);
      
      // Get sample data
      const sampleCurrencies = await Currency.find({}).limit(5);
      const sampleUsers = await User.find({}).select('username role isActive').limit(5);
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        database: {
          name: mongoose.connection.db.databaseName,
          host: mongoose.connection.host,
          readyState: mongoose.connection.readyState,
          readyStateText: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
        },
        collections: collectionInfo,
        summary: {
          currencies,
          users,
          activityLogs,
          advice,
          totalCollections: collections.length
        },
        samples: {
          currencies: sampleCurrencies.map(c => ({
            code: c.code,
            name: c.name,
            buyRate: c.buyRate,
            sellRate: c.sellRate,
            isActive: c.isActive,
            isVisible: c.isVisible
          })),
          users: sampleUsers.map(u => ({
            username: u.username,
            role: u.role,
            isActive: u.isActive
          }))
        }
      };
      
      console.log('✅ Database verification completed successfully');
      res.json(response);
    } catch (error) {
      console.error('❌ Database verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Database verification failed',
        code: 'VERIFICATION_FAILED',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Authentication routes
app.post('/api/auth/login', logActivity('login', 'auth'), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const result = await AuthService.login(
      username, 
      password, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json(result);
  } catch (error) {
    res.status(401).json({ 
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }
});

app.post('/api/auth/logout', verifyToken, logActivity('logout', 'auth'), async (req, res) => {
  try {
    const result = await AuthService.logout(
      req.user.id, 
      req.ip, 
      req.get('User-Agent')
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

app.post('/api/auth/refresh', verifyToken, async (req, res) => {
  try {
    const result = await AuthService.refreshToken(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(401).json({ 
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

app.post('/api/auth/change-password', verifyToken, logActivity('password_change', 'user'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    const result = await AuthService.changePassword(
      req.user.id, 
      currentPassword, 
      newPassword
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      code: 'PASSWORD_CHANGE_FAILED'
    });
  }
});

// Currency routes
app.get('/api/currencies', async (req, res) => {
  try {
    console.log('🌐 API: /api/currencies requested (public - visible only)');
    const currencies = await CurrencyService.getVisibleCurrencies();
    console.log('✅ API: Visible currencies fetched successfully, sending response');
    res.json({ currencies });
  } catch (error) {
    console.error('❌ API: Error fetching visible currencies:', error);
    res.status(500).json({
      error: 'Failed to fetch currencies',
      code: 'FETCH_FAILED'
    });
  }
});

// Admin route to get all currencies (including hidden ones)
app.get('/api/admin/currencies', 
  verifyToken, 
  requireAdmin,
  async (req, res) => {
    try {
      console.log('🌐 API: /api/admin/currencies requested (admin - all currencies)');
      const currencies = await CurrencyService.getAllCurrencies();
      console.log('✅ API: All currencies fetched successfully for admin, sending response');
      res.json({ currencies });
    } catch (error) {
      console.error('❌ API: Error fetching all currencies for admin:', error);
      res.status(500).json({
        error: 'Failed to fetch currencies',
        code: 'FETCH_FAILED'
      });
    }
  }
);

app.get('/api/currencies/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const currency = await CurrencyService.getCurrencyByCode(code);
    
    if (!currency) {
      return res.status(404).json({ 
        error: 'Currency not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({ currency });
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({ 
      error: 'Failed to fetch currency',
      code: 'FETCH_FAILED'
    });
  }
});

app.post('/api/currencies', 
  verifyToken, 
  requirePermission('write_currencies'),
  logActivity('currency_update', 'currency'),
  async (req, res) => {
    try {
      const { currencies } = req.body;
      
      if (!currencies || Object.keys(currencies).length === 0) {
        return res.status(400).json({ 
          error: 'Currency data is required',
          code: 'MISSING_DATA'
        });
      }

      const updatedCurrencies = await CurrencyService.updateCurrencies(
        currencies, 
        req.user.id
      );

      // Emit real-time update to all connected clients
      console.log(`📡 Broadcasting currency update to ${io.engine.clientsCount} connected clients`);
      console.log('📊 Updated currencies:', Object.keys(updatedCurrencies).join(', '));
      io.emit('currencyUpdate', updatedCurrencies);
      
      res.json({ 
        success: true, 
        currencies: updatedCurrencies,
        message: 'Currency rates updated successfully'
      });
    } catch (error) {
      console.error('❌ API: Error updating currencies:', error);
      
      // Check for different types of errors
      if (error.message.includes('Validation failed') || 
          error.message.includes('must be greater than') ||
          error.message.includes('must be a valid number') ||
          error.message.includes('must be positive')) {
        return res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR',
          details: 'Please check that buy rates are less than sell rates and all values are positive numbers.'
        });
      }
      
      // Handle MongoDB validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Validation failed: ' + validationErrors.join(', '),
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }
      
      res.status(400).json({
        error: error.message || 'Failed to update currencies',
        code: 'UPDATE_FAILED'
      });
    }
  }
);

app.post('/api/currencies/create', 
  verifyToken, 
  requireAdmin,
  logActivity('currency_create', 'currency'),
  async (req, res) => {
    try {
      const currencyData = req.body;
      
      if (!currencyData.code || !currencyData.name || !currencyData.buyRate || !currencyData.sellRate) {
        return res.status(400).json({ 
          error: 'All currency fields are required',
          code: 'MISSING_FIELDS'
        });
      }

      const newCurrency = await CurrencyService.createCurrency(
        currencyData, 
        req.user.id
      );

      // Emit real-time update
      io.emit('currencyUpdate', [newCurrency]);
      
      res.json({ 
        success: true, 
        currency: newCurrency,
        message: 'Currency created successfully'
      });
    } catch (error) {
      console.error('Error creating currency:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'CREATION_FAILED'
      });
    }
  }
);

app.delete('/api/currencies/:code', 
  verifyToken, 
  requireAdmin,
  logActivity('currency_delete', 'currency'),
  async (req, res) => {
    try {
      const { code } = req.params;
      const result = await CurrencyService.deleteCurrency(code, req.user.id);
      
      // Emit real-time update
      io.emit('currencyUpdate', { deleted: code });
      
      res.json(result);
    } catch (error) {
      console.error('Error deleting currency:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'DELETION_FAILED'
      });
    }
  }
);

// Toggle currency visibility
app.patch('/api/currencies/:code/visibility', 
  verifyToken, 
  requireAdmin,
  logActivity('currency_visibility_toggle', 'currency'),
  async (req, res) => {
    try {
      const { code } = req.params;
      const result = await CurrencyService.toggleCurrencyVisibility(code, req.user.id);
      
      // Emit real-time update to all connected clients
      // For visibility changes, we need to send updated visible currencies to public users
      const visibleCurrencies = await CurrencyService.getVisibleCurrencies();
      const allCurrencies = await CurrencyService.getAllCurrencies();
      
      console.log(`📡 Broadcasting visibility change for ${code} to ${io.engine.clientsCount} connected clients`);
      
      // Send different data to different user types
      io.emit('currencyUpdate', visibleCurrencies); // Public users get visible currencies
      io.emit('adminCurrencyUpdate', allCurrencies); // Admin users get all currencies
      
      res.json(result);
    } catch (error) {
      console.error('Error toggling currency visibility:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'VISIBILITY_TOGGLE_FAILED'
      });
    }
  }
);

app.get('/api/currencies/:code/history', async (req, res) => {
  try {
    const { code } = req.params;
    const { limit } = req.query;
    
    const history = await CurrencyService.getCurrencyHistory(code, parseInt(limit) || 10);
    
    if (!history) {
      return res.status(404).json({ 
        error: 'Currency not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({ history });
  } catch (error) {
    console.error('Error fetching currency history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch currency history',
      code: 'FETCH_FAILED'
    });
  }
});

app.get('/api/currencies/stats/overview', async (req, res) => {
  try {
    const stats = await CurrencyService.getCurrencyStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching currency stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch currency statistics',
      code: 'FETCH_FAILED'
    });
  }
});

// Search currencies
app.get('/api/currencies/search', async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;
    const results = await CurrencyService.searchCurrencies(query, filters);
    res.json({ results });
  } catch (error) {
    console.error('Error searching currencies:', error);
    res.status(500).json({ 
      error: 'Failed to search currencies',
      code: 'SEARCH_FAILED'
    });
  }
});

// Social media message generation
app.post('/api/generate-message', 
  verifyToken, 
  requirePermission('publish_social'),
  async (req, res) => {
    try {
      const { template, platform } = req.body;
      
      // Get current currency data
      const currencies = await CurrencyService.getAllCurrencies();
      
      // Generate message based on template and platform
      const message = generateSocialMediaMessage(currencies, template, platform);
      
      res.json({ message });
    } catch (error) {
      console.error('Error generating message:', error);
      res.status(500).json({ 
        error: 'Failed to generate message',
        code: 'GENERATION_FAILED'
      });
    }
  }
);

// Social media publishing routes
app.post('/api/publish/facebook', 
  verifyToken, 
  requirePermission('publish_social'),
  logActivity('social_publish', 'social_media'),
  async (req, res) => {
    try {
      const { message } = req.body;
      const result = await facebookAPI.publishPost(message);
      
      // Log successful publication
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'facebook',
          message: message.substring(0, 100) + '...',
          result
        },
        status: 'success'
      });
      
      // Emit update to connected clients
      io.emit('publishUpdate', { platform: 'facebook', success: true });
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error publishing to Facebook:', error);
      
      // Log failed publication
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'facebook',
          message: req.body.message?.substring(0, 100) + '...',
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        error: 'Failed to publish to Facebook',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

app.post('/api/publish/instagram', 
  verifyToken, 
  requirePermission('publish_social'),
  logActivity('social_publish', 'social_media'),
  async (req, res) => {
    try {
      const { message } = req.body;
      const result = await instagramAPI.publishPost(message);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'instagram',
          message: message.substring(0, 100) + '...',
          result
        },
        status: 'success'
      });
      
      io.emit('publishUpdate', { platform: 'instagram', success: true });
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error publishing to Instagram:', error);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'instagram',
          message: req.body.message?.substring(0, 100) + '...',
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        error: 'Failed to publish to Instagram',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

app.post('/api/publish/telegram', 
  verifyToken, 
  requirePermission('publish_social'),
  logActivity('social_publish', 'social_media'),
  async (req, res) => {
    try {
      const { message } = req.body;
      const result = await telegramAPI.publishPost(message);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'telegram',
          message: message.substring(0, 100) + '...',
          result
        },
        status: 'success'
      });
      
      io.emit('publishUpdate', { platform: 'telegram', success: true });
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error publishing to Telegram:', error);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'telegram',
          message: req.body.message?.substring(0, 100) + '...',
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        error: 'Failed to publish to Telegram',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

app.post('/api/publish/whatsapp', 
  verifyToken, 
  requirePermission('publish_social'),
  logActivity('social_publish', 'social_media'),
  async (req, res) => {
    try {
      const { message } = req.body;
      const result = await whatsappAPI.publishToStatus(message);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'whatsapp',
          message: message.substring(0, 100) + '...',
          result
        },
        status: 'success'
      });
      
      io.emit('publishUpdate', { platform: 'whatsapp', success: true });
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error publishing to WhatsApp:', error);
      
      await ActivityLog.logActivity({
        user: req.user.id,
        action: 'social_publish',
        resource: 'social_media',
        details: {
          platform: 'whatsapp',
          message: req.body.message?.substring(0, 100) + '...',
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        error: 'Failed to publish to WhatsApp',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

// Activity logging routes
app.get('/api/activity/logs', 
  verifyToken, 
  requirePermission('view_analytics'),
  async (req, res) => {
    try {
      const { action, resource, status, startDate, endDate, limit } = req.query;
      
      const filters = {};
      if (action) filters.action = action;
      if (resource) filters.resource = resource;
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      
      const logs = await ActivityLog.getSystemActivity(filters, parseInt(limit) || 100);
      res.json({ logs });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ 
        error: 'Failed to fetch activity logs',
        code: 'FETCH_FAILED'
      });
    }
  }
);

app.get('/api/activity/stats', 
  verifyToken, 
  requirePermission('view_analytics'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await ActivityLog.getActivityStats(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );
      
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch activity statistics',
        code: 'FETCH_FAILED'
      });
    }
  }
);

// Company information route
app.get('/api/company/info', async (req, res) => {
  try {
    const companyInfo = AdviceService.getCompanyInfo();
    res.json({ companyInfo });
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company information',
      code: 'FETCH_FAILED'
    });
  }
});

// Advice routes
app.get('/api/advice', async (req, res) => {
  try {
    const { limit, type, featured } = req.query;
    const options = {
      limit: parseInt(limit) || 10,
      type: type || null,
      featured: featured === 'true'
    };
    
    const advice = await AdviceService.getPublicAdvice(options);
    res.json({ advice: advice || [] });
  } catch (error) {
    console.error('Error fetching advice:', error);
    // Return empty array instead of error to prevent frontend crashes
    res.json({ advice: [] });
  }
});

app.get('/api/advice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const advice = await AdviceService.getAdviceById(id);
    
    // Increment view count
    await AdviceService.incrementViewCount(id);
    
    res.json({ advice });
  } catch (error) {
    console.error('Error fetching advice:', error);
    res.status(404).json({ 
      error: 'Advice not found',
      code: 'NOT_FOUND'
    });
  }
});

app.post('/api/advice', 
  logActivity('advice_create', 'advice'),
  async (req, res) => {
    try {
      const adviceData = req.body;
      
      if (!adviceData.title || !adviceData.content) {
        return res.status(400).json({ 
          error: 'Title and content are required',
          code: 'MISSING_DATA'
        });
      }

      // Create advice with system user ID (valid ObjectId)
      const systemUserId = new mongoose.Types.ObjectId();
      const advice = await AdviceService.createAdvice(adviceData, systemUserId);
      
      // Emit real-time update to all connected clients
      io.emit('adviceUpdate', { action: 'create', advice });
      
      res.json({ 
        success: true, 
        advice,
        message: 'Advice created successfully'
      });
    } catch (error) {
      console.error('Error creating advice:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'CREATION_FAILED'
      });
    }
  }
);

app.put('/api/advice/:id', 
  logActivity('advice_update', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const advice = await AdviceService.updateAdvice(id, updateData, 'system');
      
      // Emit real-time update
      io.emit('adviceUpdate', { action: 'update', advice });
      
      res.json({ 
        success: true, 
        advice,
        message: 'Advice updated successfully'
      });
    } catch (error) {
      console.error('Error updating advice:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'UPDATE_FAILED'
      });
    }
  }
);

app.delete('/api/advice/:id', 
  logActivity('advice_delete', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await AdviceService.deleteAdvice(id, 'system');
      
      // Emit real-time update
      io.emit('adviceUpdate', { action: 'delete', adviceId: id });
      
      res.json(result);
    } catch (error) {
      console.error('Error deleting advice:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'DELETION_FAILED'
      });
    }
  }
);

app.patch('/api/advice/:id/toggle-status', 
  logActivity('advice_status_toggle', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const advice = await AdviceService.toggleAdviceStatus(id, 'system');
      
      // Emit real-time update
      io.emit('adviceUpdate', { action: 'status_toggle', advice });
      
      res.json({ 
        success: true, 
        advice,
        message: 'Advice status updated successfully'
      });
    } catch (error) {
      console.error('Error toggling advice status:', error);
      res.status(400).json({ 
        error: error.message,
        code: 'STATUS_TOGGLE_FAILED'
      });
    }
  }
);

app.get('/api/admin/advice', 
  async (req, res) => {
    try {
      const { page, limit, type, isActive, sortBy, sortOrder } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        type: type || null,
        isActive: isActive !== undefined ? isActive === 'true' : null,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder === 'asc' ? 1 : -1
      };
      
      const result = await AdviceService.getAllAdvice(options);
      res.json(result);
    } catch (error) {
      console.error('Error fetching admin advice:', error);
      // Return empty result instead of error to prevent crashes
      res.json({ 
        advice: [], 
        pagination: { page: 1, limit: 20, total: 0, pages: 0 } 
      });
    }
  }
);

app.get('/api/advice/search', async (req, res) => {
  try {
    const { q: searchTerm, limit, type } = req.query;
    const options = {
      limit: parseInt(limit) || 10,
      type: type || null
    };
    
    const advice = await AdviceService.searchAdvice(searchTerm, options);
    res.json({ advice });
  } catch (error) {
    console.error('Error searching advice:', error);
    res.status(500).json({ 
      error: 'Failed to search advice',
      code: 'SEARCH_FAILED'
    });
  }
});

app.get('/api/advice/stats/overview', 
  verifyToken, 
  requirePermission('view_analytics'),
  async (req, res) => {
    try {
      const stats = await AdviceService.getAdviceStats();
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching advice stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch advice statistics',
        code: 'FETCH_FAILED'
      });
    }
  }
);

// User management routes
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      code: 'FETCH_FAILED'
    });
  }
});

app.put('/api/users/profile', 
  verifyToken, 
  logActivity('profile_update', 'user'),
  async (req, res) => {
    try {
      const { firstName, lastName, phone } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Update profile fields
      if (firstName !== undefined) user.profile.firstName = firstName;
      if (lastName !== undefined) user.profile.lastName = lastName;
      if (phone !== undefined) user.profile.phone = phone;
      
      await user.save();
      
      res.json({ 
        success: true, 
        user: user.getPublicProfile(),
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ 
        error: 'Failed to update profile',
        code: 'UPDATE_FAILED'
      });
    }
  }
);

// Social Media Information Endpoints
app.get('/api/social/links', async (req, res) => {
  try {
    const socialMedia = getAllSocialMedia();
    res.json({
      success: true,
      data: socialMedia
    });
  } catch (error) {
    console.error('Error fetching social media links:', error);
    res.status(500).json({ error: 'Failed to fetch social media links' });
  }
});

app.get('/api/social/validate', async (req, res) => {
  try {
    const validation = validateSocialMediaUrls();
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating social media URLs:', error);
    res.status(500).json({ error: 'Failed to validate social media URLs' });
  }
});

// Social Media Posting Endpoints
app.post('/api/social/facebook', verifyToken, requirePermission('social:post'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await facebookAPI.publishPost(message);
    
    // Log the activity
    await logActivity(req.user.id, 'social_post', {
      platform: 'facebook',
      message: message,
      result: result
    });

    res.json(result);
  } catch (error) {
    console.error('Facebook posting error:', error);
    res.status(500).json({ error: 'Failed to post to Facebook' });
  }
});

app.post('/api/social/instagram', verifyToken, requirePermission('social:post'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await instagramAPI.publishPost(message);
    
    await logActivity(req.user.id, 'social_post', {
      platform: 'instagram',
      message: message,
      result: result
    });

    res.json(result);
  } catch (error) {
    console.error('Instagram posting error:', error);
    res.status(500).json({ error: 'Failed to post to Instagram' });
  }
});

app.post('/api/social/telegram', verifyToken, requirePermission('social:post'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await telegramAPI.publishPost(message);
    
    await logActivity(req.user.id, 'social_post', {
      platform: 'telegram',
      message: message,
      result: result
    });

    res.json(result);
  } catch (error) {
    console.error('Telegram posting error:', error);
    res.status(500).json({ error: 'Failed to post to Telegram' });
  }
});

app.post('/api/social/whatsapp', verifyToken, requirePermission('social:post'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await whatsappAPI.publishToStatus(message);
    
    await logActivity(req.user.id, 'social_post', {
      platform: 'whatsapp',
      message: message,
      result: result
    });

    res.json(result);
  } catch (error) {
    console.error('WhatsApp posting error:', error);
    res.status(500).json({ error: 'Failed to post to WhatsApp' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Social media message generation function (keep existing implementation)
function generateSocialMediaMessage(currencies, template = 'professional', platform = 'general') {
  const currentTime = new Date();
  const timeString = currentTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  const baseMessage = `🏦 نشرة أسعار الصرف الرسمية
📅 ${dayName} - ${timeString}
\n━━━━━━━━━━━━━━━━━━━━━━━\n`;

  let currencySection = '';
  
  // Only show USD and TRY currencies
  const allowedCurrencies = ['USD', 'TRY'];
  
  Object.entries(currencies)
    .filter(([code]) => allowedCurrencies.includes(code))
    .sort(([a], [b]) => {
      // USD first, then TRY
      if (a === 'USD') return -1;
      if (b === 'USD') return 1;
      return 0;
    })
    .forEach(([code, data]) => {
      const flag = {
        'USD': '🇺🇸',
        'TRY': '🇹🇷'
      }[code] || '💱';

      const name = {
        'USD': 'الدولار الأمريكي',
        'TRY': 'الليرة التركية'
      }[code] || code;

      currencySection += `${flag} ${name}
💰 شراء: ${data.buyRate.toLocaleString('en-US')} ليرة سورية
💸 بيع: ${data.sellRate.toLocaleString('en-US')} ليرة سورية\n\n`;
    });

  const footer = `━━━━━━━━━━━━━━━━━━━━━━━
⚡ تحديث فوري ودقيق
📊 أسعار معتمدة وموثقة
🔄 يتم التحديث بشكل دوري

#أسعار_الصرف #سوريا #دولار #ليرة_تركية #اقتصاد #مال_وأعمال #تحديث_يومي`;

  return baseMessage + currencySection + footer;
}