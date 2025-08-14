const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

class AuthService {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // User login
  static async login(identifier, password, ipAddress, userAgent) {
    try {
      // Find user by username or email
      const user = await User.findByUsernameOrEmail(identifier);
      
      if (!user) {
        await this.logFailedLogin(identifier, ipAddress, userAgent, 'User not found');
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked) {
        await this.logFailedLogin(identifier, ipAddress, userAgent, 'Account locked');
        throw new Error('Account is locked due to multiple failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        await this.logFailedLogin(identifier, ipAddress, userAgent, 'Invalid password');
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      // Log successful login
      await ActivityLog.logActivity({
        user: user._id,
        action: 'login',
        resource: 'auth',
        details: {
          ipAddress,
          userAgent,
          loginMethod: 'username_password'
        },
        ipAddress,
        userAgent,
        status: 'success'
      });

      return {
        success: true,
        token,
        user: user.getPublicProfile(),
        message: 'Login successful'
      };
    } catch (error) {
      throw error;
    }
  }

  // User logout
  static async logout(userId, ipAddress, userAgent) {
    try {
      await ActivityLog.logActivity({
        user: userId,
        action: 'logout',
        resource: 'auth',
        details: {
          ipAddress,
          userAgent
        },
        ipAddress,
        userAgent,
        status: 'success'
      });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout logging error:', error);
      return {
        success: true,
        message: 'Logout successful'
      };
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Log password change
      await ActivityLog.logActivity({
        user: userId,
        action: 'password_change',
        resource: 'user',
        details: {
          changedAt: new Date()
        },
        status: 'success'
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Refresh token
  static async refreshToken(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      if (user.isLocked) {
        throw new Error('Account is locked');
      }

      const token = this.generateToken(user._id);

      return {
        success: true,
        token,
        user: user.getPublicProfile()
      };
    } catch (error) {
      throw error;
    }
  }

  // Validate token
  static async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return { valid: false, reason: 'User not found or inactive' };
      }

      if (user.isLocked) {
        return { valid: false, reason: 'Account locked' };
      }

      return {
        valid: true,
        user: user.getPublicProfile()
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, reason: 'Token expired' };
      }
      return { valid: false, reason: 'Invalid token' };
    }
  }

  // Log failed login attempt
  static async logFailedLogin(identifier, ipAddress, userAgent, reason) {
    try {
      await ActivityLog.logActivity({
        user: 'anonymous',
        action: 'login',
        resource: 'auth',
        details: {
          identifier,
          reason,
          ipAddress,
          userAgent
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: reason
      });
    } catch (error) {
      console.error('Failed to log failed login:', error);
    }
  }

  // Get user permissions
  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId).select('permissions role');
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        permissions: user.permissions,
        role: user.role
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if user has permission
  static async hasPermission(userId, permission) {
    try {
      const user = await User.findById(userId).select('permissions role');
      
      if (!user) {
        return false;
      }

      // Admin has all permissions
      if (user.role === 'admin') {
        return true;
      }

      return user.permissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
}

module.exports = AuthService;
