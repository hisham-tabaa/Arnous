const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Import Social Media APIs
const FacebookAPI = require('./socialMedia/facebook');
const InstagramAPI = require('./socialMedia/instagram');
const TelegramAPI = require('./socialMedia/telegram');
const WhatsAppAPI = require('./socialMedia/whatsapp');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data', 'currencies.json');
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// In-memory storage for admin sessions
let activeSessions = new Map();

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

// Initialize data files
async function initializeData() {
  try {
    await fs.ensureDir(path.dirname(DATA_FILE));
    await fs.ensureDir(path.dirname(SESSIONS_FILE));
    
    if (!await fs.pathExists(DATA_FILE)) {
      const defaultCurrencies = [
        {
          code: 'USD',
          name: 'US Dollar',
          buyRate: 15000,
          sellRate: 15100,
          lastUpdated: new Date().toISOString(),
          lastPublished: null
        },
        {
          code: 'EUR',
          name: 'Euro',
          buyRate: 16500,
          sellRate: 16600,
          lastUpdated: new Date().toISOString(),
          lastPublished: null
        },
        {
          code: 'GBP',
          name: 'British Pound',
          buyRate: 19000,
          sellRate: 19100,
          lastUpdated: new Date().toISOString(),
          lastPublished: null
        },
        {
          code: 'TRY',
          name: 'Turkish Lira',
          buyRate: 500,
          sellRate: 510,
          lastUpdated: new Date().toISOString(),
          lastPublished: null
        }
      ];
      
      await fs.writeJson(DATA_FILE, defaultCurrencies, { spaces: 2 });
      console.log('✅ Default currency data initialized');
    }
    
    if (!await fs.pathExists(SESSIONS_FILE)) {
      await fs.writeJson(SESSIONS_FILE, {}, { spaces: 2 });
    }
    
    await loadSessions();
    
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

// Load sessions from file
async function loadSessions() {
  try {
    if (await fs.pathExists(SESSIONS_FILE)) {
      const sessionsData = await fs.readJson(SESSIONS_FILE);
      activeSessions = new Map(Object.entries(sessionsData));
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

// Save sessions to file
async function saveSessions() {
  try {
    const sessionsObj = Object.fromEntries(activeSessions);
    await fs.writeJson(SESSIONS_FILE, sessionsObj, { spaces: 2 });
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

// Read currency data
async function readCurrencyData() {
  try {
    return await fs.readJson(DATA_FILE);
  } catch (error) {
    console.error('Error reading currency data:', error);
    return [];
  }
}

// Write currency data
async function writeCurrencyData(data) {
  try {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (error) {
    console.error('Error writing currency data:', error);
    throw error;
  }
}

// Generate token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify admin authentication
function verifyAdminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const session = activeSessions.get(token);
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    saveSessions();
    return res.status(401).json({ message: 'Token expired' });
  }
  
  req.adminSession = session;
  next();
}

// Socket.io authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (Date.now() <= session.expiresAt) {
      socket.userId = session.userId;
      socket.isAdmin = true;
      return next();
    }
  }
  
  // Allow non-authenticated connections for public data
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const token = generateToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      activeSessions.set(token, {
        userId: 'admin',
        username: username,
        role: 'admin',
        loginTime: new Date().toISOString(),
        expiresAt: expiresAt
      });
      
      await saveSessions();
      
      res.json({
        message: 'Login successful',
        token: token,
        user: {
          username: username,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/verify', verifyAdminAuth, (req, res) => {
  res.json({
    message: 'Token valid',
    user: {
      username: req.adminSession.username,
      role: req.adminSession.role
    }
  });
});

app.post('/api/admin/logout', verifyAdminAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      activeSessions.delete(token);
      await saveSessions();
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Currency Routes
// Helper to convert array -> keyed object
function currenciesArrayToMap(currenciesArray) {
  return currenciesArray.reduce((acc, item) => {
    acc[item.code] = {
      buyRate: item.buyRate,
      sellRate: item.sellRate,
      lastUpdated: item.lastUpdated || null,
      lastPublished: item.lastPublished || null,
      name: item.name
    };
    return acc;
  }, {});
}

// Helper to apply updates from keyed object onto array by code
function applyCurrencyUpdates(currentArray, updatesMap) {
  const nowIso = new Date().toISOString();
  const codeToIndex = new Map(currentArray.map((c, idx) => [c.code, idx]));

  Object.entries(updatesMap).forEach(([code, data]) => {
    if (!data) return;
    const idx = codeToIndex.get(code);
    if (idx !== undefined) {
      currentArray[idx] = {
        ...currentArray[idx],
        buyRate: Number(data.buyRate),
        sellRate: Number(data.sellRate),
        lastUpdated: nowIso
      };
    }
  });

  return currentArray;
}

app.get('/api/currencies', async (req, res) => {
  try {
    const currenciesArr = await readCurrencyData();
    const currencies = currenciesArrayToMap(currenciesArr);
    res.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/currencies', verifyAdminAuth, async (req, res) => {
  try {
    const body = req.body;

    // Normalize incoming payload to a keyed map { USD: { buyRate, sellRate }, ... }
    let updatesMap = {};
    if (body && body.currencies && typeof body.currencies === 'object' && !Array.isArray(body.currencies)) {
      updatesMap = body.currencies;
    } else if (Array.isArray(body)) {
      // Accept legacy array format as full replacement
      updatesMap = body.reduce((acc, item) => {
        acc[item.code] = { buyRate: item.buyRate, sellRate: item.sellRate };
        return acc;
      }, {});
    } else if (Array.isArray(body?.currencies)) {
      updatesMap = body.currencies.reduce((acc, item) => {
        acc[item.code] = { buyRate: item.buyRate, sellRate: item.sellRate };
        return acc;
      }, {});
    } else {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Load current data, apply updates, and persist
    const current = await readCurrencyData();
    const updatedArray = applyCurrencyUpdates(current, updatesMap);
    await writeCurrencyData(updatedArray);

    // Prepare response and realtime payload in keyed-object shape
    const responseMap = currenciesArrayToMap(updatedArray);

    // Emit real-time update to all connected clients
    io.emit('currencyUpdate', responseMap);
    
    res.json({ 
      message: 'Currencies updated successfully',
      currencies: responseMap
    });
  } catch (error) {
    console.error('Error updating currencies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Social Media Publishing Routes
app.post('/api/publish/facebook', verifyAdminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    // Create FacebookAPI instance
    const facebookAPI = new FacebookAPI(
      process.env.FACEBOOK_ACCESS_TOKEN,
      process.env.FACEBOOK_PAGE_ID
    );
    const result = await facebookAPI.publishPost(message);
    res.json(result);
  } catch (error) {
    console.error('Facebook publish error:', error);
    res.status(500).json({ message: 'Failed to publish to Facebook' });
  }
});

app.post('/api/publish/instagram', verifyAdminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    // Create InstagramAPI instance
    const instagramAPI = new InstagramAPI(
      process.env.FACEBOOK_ACCESS_TOKEN,
      process.env.INSTAGRAM_ACCOUNT_ID
    );
    const result = await instagramAPI.publishPost(message);
    res.json(result);
  } catch (error) {
    console.error('Instagram publish error:', error);
    res.status(500).json({ message: 'Failed to publish to Instagram' });
  }
});

app.post('/api/publish/telegram', verifyAdminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    // Create TelegramAPI instance
    const telegramAPI = new TelegramAPI(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHANNEL_ID
    );
    const result = await telegramAPI.publishPost(message);
    res.json(result);
  } catch (error) {
    console.error('Telegram publish error:', error);
    res.status(500).json({ message: 'Failed to publish to Telegram' });
  }
});

app.post('/api/publish/whatsapp', verifyAdminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    // Create WhatsAppAPI instance
    const whatsappAPI = new WhatsAppAPI(
      process.env.WHATSAPP_ACCESS_TOKEN,
      process.env.WHATSAPP_PHONE_NUMBER_ID,
      process.env.WHATSAPP_BROADCAST_LIST_ID
    );
    const result = await whatsappAPI.publishToStatus(message);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp publish error:', error);
    res.status(500).json({ message: 'Failed to publish to WhatsApp' });
  }
});

// Generate social media message
app.post('/api/generate-message', verifyAdminAuth, async (req, res) => {
  try {
    const currenciesArray = await readCurrencyData();
    const { template = 'professional', platform = 'general' } = req.body;
    
    console.log(`Generating message with template: ${template}, platform: ${platform}`);
    
    const message = generateSocialMediaMessage(currenciesArray, template);
    res.json({ message });
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({ message: 'Failed to generate message' });
  }
});

// Generate social media message
function generateSocialMediaMessage(currencies, template = 'professional') {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Ensure currencies is an array
  if (!Array.isArray(currencies)) {
    console.error('Currencies is not an array:', currencies);
    return `❌ Error: Unable to load currency data`;
  }
  
  let message = '';
  
  switch(template) {
    case 'professional':
      message = `💰 Arnous Exchange - Currency Rates\n📅 ${formattedDate}\n\n`;
      currencies.forEach(currency => {
        const buyRate = Number(currency.buyRate).toLocaleString('en-US');
        const sellRate = Number(currency.sellRate).toLocaleString('en-US');
        message += `💵 ${currency.code} - ${currency.name}\n`;
        message += `   📈 Buy: ${buyRate} SYP\n`;
        message += `   📉 Sell: ${sellRate} SYP\n\n`;
      });
      message += `🏢 Arnous Exchange\n📞 Contact us for the best rates!`;
      break;
      
    case 'casual':
      message = `🔥 Fresh Currency Rates! 🔥\n⏰ Updated: ${formattedDate}\n\n`;
      currencies.forEach(currency => {
        const buyRate = Number(currency.buyRate).toLocaleString('en-US');
        const sellRate = Number(currency.sellRate).toLocaleString('en-US');
        message += `${currency.code === 'USD' ? '🇺🇸' : currency.code === 'EUR' ? '🇪🇺' : currency.code === 'GBP' ? '🇬🇧' : '🇹🇷'} ${currency.code}: Buy ${buyRate} | Sell ${sellRate} SYP\n`;
      });
      message += `\n💸 Arnous Exchange - Your trusted partner!\n🚀 Best rates in town!`;
      break;
      
    case 'minimal':
      message = `Arnous Exchange Rates - ${formattedDate}\n\n`;
      currencies.forEach(currency => {
        const buyRate = Number(currency.buyRate).toLocaleString('en-US');
        const sellRate = Number(currency.sellRate).toLocaleString('en-US');
        message += `${currency.code}: ${buyRate} / ${sellRate} SYP\n`;
      });
      message += `\nArnous Exchange`;
      break;
      
    case 'detailed':
      message = `📊 ARNOUS EXCHANGE - DAILY RATES 📊\n`;
      message += `📅 ${formattedDate}\n`;
      message += `${'='.repeat(35)}\n\n`;
      currencies.forEach(currency => {
        const buyRate = Number(currency.buyRate).toLocaleString('en-US');
        const sellRate = Number(currency.sellRate).toLocaleString('en-US');
        message += `💰 ${currency.name} (${currency.code})\n`;
        message += `   🟢 BUY:  ${buyRate} SYP\n`;
        message += `   🔴 SELL: ${sellRate} SYP\n`;
        message += `   💹 Spread: ${(currency.sellRate - currency.buyRate).toLocaleString('en-US')} SYP\n\n`;
      });
      message += `🏦 ARNOUS EXCHANGE\n`;
      message += `📞 Call us for live rates\n`;
      message += `⚡ Fast & Reliable Service`;
      break;
      
    default:
      // Fallback to professional
      message = `💰 Arnous Exchange - Currency Rates\n📅 ${formattedDate}\n\n`;
      currencies.forEach(currency => {
        const buyRate = Number(currency.buyRate).toLocaleString('en-US');
        const sellRate = Number(currency.sellRate).toLocaleString('en-US');
        message += `💵 ${currency.code} - ${currency.name}\n`;
        message += `   📈 Buy: ${buyRate} SYP\n`;
        message += `   📉 Sell: ${sellRate} SYP\n\n`;
      });
      message += `🏢 Arnous Exchange\n📞 Contact us for the best rates!`;
  }
  
  return message;
}

// Serve React app
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, '../client/build', 'index.html');
  
  // Check if build file exists
  if (require('fs').existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    // If build doesn't exist, serve a simple message
    res.send(`
      <html>
        <head><title>Arnous Exchange</title></head>
        <body>
          <h1>🏦 Arnous Exchange Server</h1>
          <p>Server is running on port ${PORT}</p>
          <p>Please build the client application first:</p>
          <pre>cd client && npm run build</pre>
          <br>
          <p><a href="/api/currencies">View Currency API</a></p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await initializeData();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // Detect Railway environment and construct proper URL
      let baseUrl;
      
      // Check for Railway environment variables
      if (process.env.RAILWAY_STATIC_URL) {
        baseUrl = process.env.RAILWAY_STATIC_URL;
      } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else if (process.env.CLIENT_URL) {
        baseUrl = process.env.CLIENT_URL;
      } else if (process.env.NODE_ENV === 'production') {
        // Production environment but no Railway URL set
        baseUrl = `https://your-app-name.up.railway.app`;
        console.log('⚠️  WARNING: Running in production but no Railway URL configured!');
        console.log('🔧 Please set CLIENT_URL environment variable in Railway dashboard');
      } else {
        baseUrl = `http://localhost:${PORT}`;
      }
      
      const adminUrl = `${baseUrl}/admin`;
      const apiUrl = `${baseUrl}/api/currencies`;
      
      console.log(`📊 Admin Panel: ${adminUrl}`);
      console.log(`💰 Currency API: ${apiUrl}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      
      // Show environment info for debugging
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.RAILWAY_STATIC_URL) {
        console.log(`🚄 Railway Static URL: ${process.env.RAILWAY_STATIC_URL}`);
      }
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`🚄 Railway Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await saveSessions();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await saveSessions();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();
