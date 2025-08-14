# Admin Authentication System

This document explains how to use the secure admin authentication system for the currency exchange dashboard.

## Overview

The admin panel is now protected with username and password authentication. Only authenticated users can access the admin dashboard and perform currency updates or social media posting.

## 🔐 **Default Credentials**

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Important:** Change these credentials for production use!

## 🚀 **How to Access Admin Panel**

### Step 1: Navigate to Login Page
Go to: `http://localhost:3000/admin/login`

### Step 2: Enter Credentials
- Enter your username and password
- Click "Login to Admin Panel"

### Step 3: Access Admin Dashboard
- After successful login, you'll be redirected to `/admin`
- You'll see your username in the top navigation
- Use the "Logout" button to end your session

## 🔧 **Changing Admin Credentials**

### For Development:
1. Create or edit `server/.env` file:
   ```env
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_secure_password
   ```

2. Restart the server:
   ```bash
   npm run dev
   ```

### For Production:
1. **Never use default credentials in production!**
2. Use strong, unique passwords
3. Consider implementing password hashing
4. Use environment variables or secure secret management

## 🛡️ **Security Features**

### Current Implementation:
- ✅ **Session-based authentication** with tokens
- ✅ **24-hour session expiration**
- ✅ **Automatic logout** on token expiration
- ✅ **Protected API endpoints**
- ✅ **Client-side route protection**
- ✅ **Token verification** on server restart

### Additional Security (Recommended for Production):
- **Password hashing** using bcrypt
- **JWT tokens** instead of simple tokens
- **Rate limiting** for login attempts
- **HTTPS** encryption
- **Database storage** for users and sessions
- **Multi-factor authentication** (2FA)

## 📱 **User Experience**

### Login Flow:
1. Visit `/admin` → Redirected to `/admin/login`
2. Enter credentials → Token generated and stored
3. Access granted → Redirected to admin dashboard
4. Session maintained across browser refreshes
5. Automatic logout after 24 hours

### Admin Dashboard Features:
- **User indicator** showing logged-in username
- **Logout button** for secure session termination
- **Protected operations** (currency updates, social media posting)
- **Real-time updates** with authenticated socket connections

### Error Handling:
- **Invalid credentials** → Clear error message
- **Session expired** → Automatic redirect to login
- **Connection errors** → User-friendly error display

## 🔒 **API Endpoint Protection**

### Public Endpoints (No Authentication Required):
- `GET /api/currencies` - View current exchange rates

### Protected Endpoints (Authentication Required):
- `POST /api/currencies` - Update currency rates
- `POST /api/publish/:platform` - Publish to social media
- `POST /api/generate-message` - Generate social media message
- `GET /api/test-connections` - Test social media connections

### Authentication Headers:
All protected endpoints require:
```
Authorization: Bearer <token>
```

## 🔄 **Session Management**

### Token Storage:
- **Client-side:** localStorage (adminToken, adminUser)
- **Server-side:** In-memory Map (activeSessions)

### Session Lifecycle:
1. **Login** → Token generated and stored
2. **API calls** → Token validated on each request
3. **Expiration** → 24-hour automatic cleanup
4. **Logout** → Token removed from both sides

### Production Considerations:
- Use **Redis** or database for session storage
- Implement **session cleanup** background tasks
- Add **concurrent session limits**
- Monitor **active sessions** for security

## 🚨 **Troubleshooting**

### "Unauthorized" Error:
- Check if you're logged in
- Try logging out and back in
- Verify credentials are correct

### Session Expired:
- Normal after 24 hours
- Simply log in again
- Session extends on each API call

### Can't Access Admin Panel:
- Make sure you're using `/admin/login`
- Check server is running
- Verify credentials in .env file

### Connection Issues:
- Check server logs for errors
- Verify network connectivity
- Try refreshing the page

## 💡 **Advanced Configuration**

### Custom Session Duration:
Edit `server/index.js`:
```javascript
// Change from 24 hours to custom duration
if (Date.now() - session.createdAt > 2 * 60 * 60 * 1000) { // 2 hours
```

### Multiple Admin Users:
For production, implement a user management system:
```javascript
const ADMIN_USERS = [
  { username: 'admin1', password: 'hash1', role: 'super' },
  { username: 'admin2', password: 'hash2', role: 'editor' }
];
```

### Password Hashing:
```bash
npm install bcrypt
```

```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

## 📋 **Quick Reference**

| Action | URL | Method |
|--------|-----|---------|
| Login Page | `/admin/login` | GET |
| Admin Dashboard | `/admin` | GET |
| User Rates | `/rates` | GET |
| Login API | `/api/admin/login` | POST |
| Verify Token | `/api/admin/verify` | GET |
| Logout API | `/api/admin/logout` | POST |

## ✅ **Security Checklist**

- [ ] Changed default credentials
- [ ] Using HTTPS in production
- [ ] Implemented password hashing
- [ ] Set up proper session storage
- [ ] Added rate limiting
- [ ] Configured proper CORS
- [ ] Set secure environment variables
- [ ] Implemented logging and monitoring

---

**Your admin panel is now secure! 🔐**

Remember to change the default credentials before deploying to production.
