# Social Media Integration Guide

This guide shows you how to connect your currency exchange dashboard with real social media platforms to automatically publish exchange rates.

## Table of Contents
1. [Facebook Integration](#facebook-integration)
2. [Instagram Integration](#instagram-integration)
3. [Telegram Integration](#telegram-integration)
4. [WhatsApp Business Integration](#whatsapp-business-integration)
5. [Implementation Steps](#implementation-steps)

## Facebook Integration

### Step 1: Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app for "Business"
3. Add the "Pages" product to your app

### Step 2: Get Required Permissions
You need these permissions:
- `pages_manage_posts`: To publish posts
- `pages_read_engagement`: To read page data
- `pages_manage_metadata`: To manage page settings

### Step 3: Get Access Tokens
```javascript
// Get Page Access Token (permanent)
const pageAccessToken = 'YOUR_PAGE_ACCESS_TOKEN';
const pageId = 'YOUR_PAGE_ID';
```

### Step 4: Implementation Code
```javascript
// server/socialMedia/facebook.js
const axios = require('axios');

class FacebookAPI {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async publishPost(message) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
        {
          message: message,
          access_token: this.accessToken
        }
      );
      
      return {
        success: true,
        postId: response.data.id,
        message: 'Posted successfully to Facebook'
      };
    } catch (error) {
      console.error('Facebook posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Facebook'
      };
    }
  }
}

module.exports = FacebookAPI;
```

---

## Instagram Integration

### Step 1: Instagram Business Account
1. Convert your Instagram account to a Business account
2. Connect it to a Facebook page
3. Use the Facebook app you created above

### Step 2: Get Instagram Business Account ID
```javascript
// Get Instagram Business Account ID from Facebook Graph API
const instagramAccountId = 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID';
```

### Step 3: Implementation Code
```javascript
// server/socialMedia/instagram.js
const axios = require('axios');

class InstagramAPI {
  constructor(accessToken, instagramAccountId) {
    this.accessToken = accessToken;
    this.instagramAccountId = instagramAccountId;
  }

  async publishPost(message) {
    try {
      // Step 1: Create media container
      const mediaResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.instagramAccountId}/media`,
        {
          caption: message,
          media_type: 'TEXT', // For text-only posts
          access_token: this.accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.instagramAccountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        message: 'Posted successfully to Instagram'
      };
    } catch (error) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Instagram'
      };
    }
  }
}

module.exports = InstagramAPI;
```

---

## Telegram Integration

### Step 1: Create a Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Follow instructions to get your bot token

### Step 2: Get Your Channel ID
1. Add your bot to your channel as an admin
2. Use this API call to get channel info:
   `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates`

### Step 3: Implementation Code
```javascript
// server/socialMedia/telegram.js
const axios = require('axios');

class TelegramAPI {
  constructor(botToken, channelId) {
    this.botToken = botToken;
    this.channelId = channelId; // Format: @channel_username or -100XXXXXXXXX
  }

  async publishPost(message) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.channelId,
          text: message,
          parse_mode: 'HTML' // or 'Markdown'
        }
      );

      return {
        success: true,
        messageId: response.data.result.message_id,
        message: 'Posted successfully to Telegram'
      };
    } catch (error) {
      console.error('Telegram posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || 'Failed to post to Telegram'
      };
    }
  }
}

module.exports = TelegramAPI;
```

---

## WhatsApp Business Integration

### Step 1: WhatsApp Business API Setup
1. Create a WhatsApp Business account
2. Get approved for WhatsApp Business API
3. Use a provider like Twilio, 360Dialog, or Facebook's Cloud API

### Step 2: Get Credentials
```javascript
// For WhatsApp Cloud API (Meta)
const phoneNumberId = 'YOUR_PHONE_NUMBER_ID';
const accessToken = 'YOUR_WHATSAPP_ACCESS_TOKEN';
```

### Step 3: Implementation Code
```javascript
// server/socialMedia/whatsapp.js
const axios = require('axios');

class WhatsAppAPI {
  constructor(accessToken, phoneNumberId) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async publishToStatus(message) {
    try {
      // Note: WhatsApp doesn't have public channels like Telegram
      // This is for sending to a broadcast list or status
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: 'broadcast_list_id', // or individual numbers
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Posted successfully to WhatsApp'
      };
    } catch (error) {
      console.error('WhatsApp posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to WhatsApp'
      };
    }
  }
}

module.exports = WhatsAppAPI;
```

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd server
npm install dotenv
```

### Step 2: Update Environment Variables
Create `server/.env` file:
```env
# Facebook/Instagram
FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@your_channel_username

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Step 3: Create Social Media Directory
```bash
mkdir server/socialMedia
```

### Step 4: Update Server Code
Add this to your `server/index.js`:

```javascript
const FacebookAPI = require('./socialMedia/facebook');
const InstagramAPI = require('./socialMedia/instagram');
const TelegramAPI = require('./socialMedia/telegram');
const WhatsAppAPI = require('./socialMedia/whatsapp');

// Initialize social media APIs
const facebookAPI = new FacebookAPI(
  process.env.FACEBOOK_ACCESS_TOKEN,
  process.env.FACEBOOK_PAGE_ID
);

const instagramAPI = new InstagramAPI(
  process.env.FACEBOOK_ACCESS_TOKEN, // Same token as Facebook
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

// Update the publish endpoint
app.post('/api/publish/:platform', async (req, res) => {
  try {
    const platform = req.params.platform;
    const { message } = req.body;
    
    let result;
    
    switch (platform) {
      case 'facebook':
        result = await facebookAPI.publishPost(message);
        break;
      case 'instagram':
        result = await instagramAPI.publishPost(message);
        break;
      case 'telegram':
        result = await telegramAPI.publishPost(message);
        break;
      case 'whatsapp':
        result = await whatsappAPI.publishToStatus(message);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    if (result.success) {
      // Update last published data
      const data = await readCurrencyData();
      data.lastPublished = {
        timestamp: new Date().toISOString(),
        platform: platform,
        message: message,
        postId: result.postId || result.messageId
      };
      await writeCurrencyData(data);
      
      // Emit update to clients
      io.emit('publishUpdate', { 
        platform, 
        message, 
        timestamp: new Date().toISOString(),
        success: true 
      });
      
      res.json({ 
        success: true, 
        message: result.message,
        platform: platform,
        postId: result.postId || result.messageId
      });
    } else {
      res.status(500).json({ 
        error: result.error,
        platform: platform 
      });
    }
  } catch (error) {
    console.error('Error publishing to social media:', error);
    res.status(500).json({ error: `Failed to publish to ${req.params.platform}` });
  }
});
```

### Step 5: Test Your Integration
1. Start your server: `npm run dev`
2. Go to admin panel: `http://localhost:3000/admin`
3. Update currency rates
4. Click publish buttons to test each platform

## Important Notes

### Rate Limits
- **Facebook/Instagram**: 25 posts per hour per page
- **Telegram**: 30 messages per second for bots
- **WhatsApp**: Varies by provider and account type

### Content Guidelines
- Keep messages concise and clear
- Include relevant hashtags
- Follow each platform's community guidelines
- Include disclaimers if required by regulations

### Error Handling
Always implement proper error handling and logging:
```javascript
try {
  const result = await socialAPI.publishPost(message);
  if (!result.success) {
    console.error(`Failed to publish to ${platform}:`, result.error);
    // Handle error appropriately
  }
} catch (error) {
  console.error(`Critical error publishing to ${platform}:`, error);
  // Handle critical errors
}
```

### Security Best Practices
1. **Environment Variables**: Never commit API keys to version control
2. **Token Rotation**: Regularly rotate access tokens
3. **Permissions**: Use minimum required permissions
4. **HTTPS**: Always use HTTPS in production
5. **Validation**: Validate all input before posting

### Testing
1. Use sandbox/test environments when available
2. Test with a small audience first
3. Monitor posting frequency to avoid rate limits
4. Test error scenarios (network issues, invalid tokens, etc.)

## Getting Help
- **Facebook/Instagram**: [Facebook Developers](https://developers.facebook.com/support/)
- **Telegram**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **WhatsApp**: [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

Remember to read each platform's documentation thoroughly and comply with their terms of service.
