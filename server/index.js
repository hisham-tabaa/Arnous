const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Import Database Configuration
const { connectDB, Currency, User, ActivityLog, Advice } = require('./config/database');

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
      ? process.env.CLIENT_URL || "http://localhost:3000"
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
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

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const validation = await AuthService.validateToken(token);
    if (!validation.valid) {
      return next(new Error('Invalid token'));
    }

    socket.userId = validation.user.id;
    socket.user = validation.user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user?.username || 'Anonymous'}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user?.username || 'Anonymous'}`);
  });
});

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

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
    const currencies = await CurrencyService.getAllCurrencies();
    res.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch currencies',
      code: 'FETCH_FAILED'
    });
  }
});

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
      io.emit('currencyUpdate', updatedCurrencies);
      
      res.json({ 
        success: true, 
        currencies: updatedCurrencies,
        message: 'Currency rates updated successfully'
      });
    } catch (error) {
      console.error('Error updating currencies:', error);
      res.status(400).json({ 
        error: error.message,
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
  verifyToken, 
  requirePermission('write_currencies'),
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

      const advice = await AdviceService.createAdvice(adviceData, req.user.id);
      
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
  verifyToken, 
  requirePermission('write_currencies'),
  logActivity('advice_update', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const advice = await AdviceService.updateAdvice(id, updateData, req.user.id);
      
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
  verifyToken, 
  requirePermission('write_currencies'),
  logActivity('advice_delete', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await AdviceService.deleteAdvice(id, req.user.id);
      
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
  verifyToken, 
  requirePermission('write_currencies'),
  logActivity('advice_status_toggle', 'advice'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const advice = await AdviceService.toggleAdviceStatus(id, req.user.id);
      
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
  verifyToken, 
  requirePermission('view_analytics'),
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
  Object.entries(currencies).forEach(([code, data]) => {
    const flag = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'TRY': '🇹🇷'
    }[code] || '💱';

    const name = {
      'USD': 'الدولار الأمريكي',
      'EUR': 'اليورو الأوروبي',
      'GBP': 'الجنيه الإسترليني',
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

#أسعار_الصرف #سوريا #دولار #يورو #اقتصاد #مال_وأعمال #تحديث_يومي`;

  return baseMessage + currencySection + footer;
}