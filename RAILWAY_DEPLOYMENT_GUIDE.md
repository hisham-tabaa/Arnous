# 🚀 Complete Railway Deployment & Social Media Setup Guide

This guide will walk you through setting up your social media accounts, getting API credentials, and deploying your currency exchange dashboard to Railway.

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Social media accounts for integration

## 🔧 Part 1: Social Media Setup

### 1. 📘 Facebook & Instagram Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → Choose "Business" type
3. Fill in app details and create

#### Step 2: Add Pages Product
1. In your app dashboard, click "Add Product"
2. Find "Pages" and click "Set Up"
3. Add required permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_manage_metadata`

#### Step 3: Get Page Access Token
1. Go to Tools → Graph API Explorer
2. Select your app and page
3. Generate token with required permissions
4. Copy the **Page Access Token** (not User Access Token)

#### Step 4: Get Page ID
1. Go to your Facebook page
2. Click "About" → "Page Info"
3. Copy the **Page ID**

#### Step 5: Instagram Business Account
1. Convert your Instagram to Business account
2. Connect it to your Facebook page
3. In Graph API Explorer, get Instagram Business Account ID:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```

**Save these credentials:**
- `FACEBOOK_ACCESS_TOKEN`: Your page access token
- `FACEBOOK_PAGE_ID`: Your page ID
- `INSTAGRAM_ACCOUNT_ID`: Your Instagram business account ID

---

### 2. 📨 Telegram Setup

#### Step 1: Create Telegram Bot
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Choose a name and username for your bot
4. Copy the **Bot Token**

#### Step 2: Create/Get Channel
1. Create a new Telegram channel
2. Add your bot as an administrator
3. Get channel ID using this method:
   - Post a message to your channel
   - Visit: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates`
   - Find your channel ID in the response (starts with -100)

**Save these credentials:**
- `TELEGRAM_BOT_TOKEN`: Your bot token
- `TELEGRAM_CHANNEL_ID`: Your channel ID (e.g., @yourchannel or -1001234567890)

---

### 3. 💬 WhatsApp Business Setup

#### Step 1: WhatsApp Business API Setup
1. Go to [Meta Business](https://business.facebook.com/)
2. Create a business account if you don't have one
3. Go to WhatsApp → API Setup

#### Step 2: Get Phone Number ID
1. In WhatsApp API setup, note your **Phone Number ID**
2. Generate **Access Token** for your WhatsApp Business Account

#### Step 3: Create Broadcast List (Optional)
1. Create a broadcast list for multiple contacts
2. Note the **Broadcast List ID**

**Save these credentials:**
- `WHATSAPP_ACCESS_TOKEN`: Your access token
- `WHATSAPP_PHONE_NUMBER_ID`: Your phone number ID
- `WHATSAPP_BROADCAST_LIST_ID`: Your broadcast list ID (optional)

---

## 🚂 Part 2: Railway Deployment

### Step 1: Prepare Your Repository

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add Railway deployment config and social media integration"
   git push origin main
   ```

### Step 2: Set Up Database (MongoDB Atlas)

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free account and cluster

2. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://...`)
   - Replace `<password>` with your actual password

### Step 3: Deploy to Railway

1. **Connect GitHub:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub account and select your repository

2. **Configure Environment Variables:**
   Click on your deployed app → Variables tab, then add these variables:

   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=5000
   
   # Database (use your MongoDB Atlas connection string)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arnous_exchange?retryWrites=true&w=majority
   
   # JWT Configuration  
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-for-production
   JWT_EXPIRES_IN=24h
   
   # Admin Credentials (CHANGE THESE!)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-admin-password
   
   # Facebook/Instagram
   FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token_here
   FACEBOOK_PAGE_ID=your_facebook_page_id_here  
   INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id_here
   
   # Telegram
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHANNEL_ID=@your_channel_username_or_numeric_id
   
   # WhatsApp
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_BROADCAST_LIST_ID=your_broadcast_list_id_here
   ```

3. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Your app will be available at: `https://your-app-name.up.railway.app`

### Step 4: Update Client URL

1. In Railway dashboard, go to Variables
2. Update `CLIENT_URL` to your Railway app URL:
   ```
   CLIENT_URL=https://your-app-name.up.railway.app
   ```

---

## ✅ Part 3: Testing Your Deployment

### 1. Access Your App
- Go to your Railway app URL
- You should see the currency exchange dashboard

### 2. Test Admin Login
1. Go to `/admin` route
2. Login with your admin credentials
3. Try updating currency rates

### 3. Test Social Media Integration
1. In admin panel, update currency rates
2. Click "Update Message Preview" 
3. Test publishing to each platform:
   - Click "Publish to Facebook"
   - Click "Publish to Instagram"  
   - Click "Publish to Telegram"
   - Click "Publish to WhatsApp"

### 4. Verify Posts
Check each social media platform to confirm posts were published successfully.

---

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to publish" errors:**
   - Double-check all API tokens and IDs
   - Verify permissions for Facebook/Instagram
   - Test tokens using Graph API Explorer

2. **Database connection errors:**
   - Verify MongoDB Atlas connection string
   - Check if IP whitelist includes Railway IPs (use 0.0.0.0/0 for all IPs)

3. **Instagram posting fails:**
   - Instagram requires image/video content for most post types
   - Text-only posts have limited support

4. **Telegram not receiving messages:**
   - Ensure bot is admin of the channel
   - Verify channel ID format (@username or -1001234567890)

5. **WhatsApp errors:**
   - WhatsApp Business API requires approval for production
   - Test in sandbox mode first

### View Logs:
- In Railway dashboard, click on your app
- Go to "Deployments" tab 
- Click on latest deployment to view logs

---

## 🎉 Success!

Your currency exchange dashboard is now:
- ✅ Deployed on Railway
- ✅ Connected to all social media platforms
- ✅ Ready to publish exchange rates automatically
- ✅ Accessible from anywhere on the internet

### Next Steps:
1. Set up custom domain (optional)
2. Enable SSL certificate (Railway provides this automatically)
3. Set up monitoring and alerts
4. Schedule automated currency updates

### Support Links:
- [Railway Documentation](https://docs.railway.app/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)

---

**🚀 Your professional currency exchange platform is now live!**
