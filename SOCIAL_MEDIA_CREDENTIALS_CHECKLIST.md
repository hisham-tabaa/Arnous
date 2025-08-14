# 📋 Social Media Credentials Checklist

Use this checklist to gather all required credentials for your social media integrations.

## ✅ Credential Collection Checklist

### 📘 Facebook & Instagram
- [ ] **FACEBOOK_ACCESS_TOKEN**: `_____________________`
  - Source: Facebook Graph API Explorer → Your Page → Generate Token
  - Must have `pages_manage_posts` permission
  
- [ ] **FACEBOOK_PAGE_ID**: `_____________________`
  - Source: Facebook Page → About → Page Info
  
- [ ] **INSTAGRAM_ACCOUNT_ID**: `_____________________`  
  - Source: Graph API call to `/{page-id}?fields=instagram_business_account`

### 📨 Telegram
- [ ] **TELEGRAM_BOT_TOKEN**: `_____________________`
  - Source: @BotFather → `/newbot` command
  
- [ ] **TELEGRAM_CHANNEL_ID**: `_____________________`
  - Format: `@channelname` or `-1001234567890`
  - Source: Post to channel → `/getUpdates` API call

### 💬 WhatsApp Business
- [ ] **WHATSAPP_ACCESS_TOKEN**: `_____________________`
  - Source: Meta Business → WhatsApp API Setup
  
- [ ] **WHATSAPP_PHONE_NUMBER_ID**: `_____________________`
  - Source: WhatsApp Cloud API Dashboard
  
- [ ] **WHATSAPP_BROADCAST_LIST_ID**: `_____________________`
  - Optional: For broadcasting to multiple contacts

### 🔐 Security & Admin
- [ ] **JWT_SECRET**: `_____________________`
  - Generate: Random 32+ character string
  
- [ ] **ADMIN_PASSWORD**: `_____________________` 
  - Use strong password for admin account

### 🗄️ Database
- [ ] **MONGODB_URI**: `_____________________`
  - MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

---

## 🔗 Quick Links for Setup

| Platform | Setup Link | Documentation |
|----------|------------|---------------|
| Facebook | [developers.facebook.com](https://developers.facebook.com/) | [Graph API Docs](https://developers.facebook.com/docs/graph-api/) |
| Instagram | Use Facebook app above | [Instagram API Docs](https://developers.facebook.com/docs/instagram-api/) |
| Telegram | [@BotFather](https://t.me/botfather) | [Bot API Docs](https://core.telegram.org/bots/api) |
| WhatsApp | [business.facebook.com](https://business.facebook.com/) | [WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/) |
| MongoDB | [mongodb.com/atlas](https://www.mongodb.com/atlas) | [Atlas Docs](https://docs.atlas.mongodb.com/) |
| Railway | [railway.app](https://railway.app/) | [Railway Docs](https://docs.railway.app/) |

---

## 🧪 Testing Commands

Once you have credentials, test them:

### Facebook/Instagram Test:
```bash
curl -X GET "https://graph.facebook.com/me/accounts?access_token=YOUR_ACCESS_TOKEN"
```

### Telegram Test:
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe"
```

### WhatsApp Test:
```bash
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID?access_token=YOUR_ACCESS_TOKEN"
```

---

## ⚠️ Important Notes

1. **Never commit credentials to Git** - Use environment variables only
2. **Facebook tokens expire** - Set up long-lived tokens
3. **WhatsApp requires approval** for production use
4. **Telegram bots need admin permissions** in channels
5. **Instagram requires Business account** connected to Facebook page

---

## 📞 Need Help?

If you get stuck:
1. Check the detailed setup guide in `SOCIAL_MEDIA_INTEGRATION.md`
2. Review Railway deployment guide in `RAILWAY_DEPLOYMENT_GUIDE.md`  
3. Test API credentials using the commands above
4. Check platform documentation links

**✅ Once all credentials are collected, you're ready to deploy to Railway!**

