const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found or inactive.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account is locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during token verification.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        userPermissions: req.user.permissions
      });
    }
    
    next();
  };
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Middleware to log activity
const logActivity = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log activity after response is sent
      setTimeout(async () => {
        try {
          await ActivityLog.logActivity({
            user: req.user?._id || 'anonymous',
            action,
            resource,
            details: {
              method: req.method,
              path: req.path,
              body: req.body,
              params: req.params,
              query: req.query
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: res.statusCode < 400 ? 'success' : 'failure',
            errorMessage: res.statusCode >= 400 ? data : undefined,
            metadata: {
              responseTime: Date.now() - req.startTime,
              statusCode: res.statusCode
            }
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      }, 0);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware to add request start time
const addRequestTime = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

// Middleware to rate limiting (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const userRequests = requests.get(ip);
      
      if (now > userRequests.resetTime) {
        userRequests.count = 1;
        userRequests.resetTime = now + windowMs;
      } else if (userRequests.count >= maxRequests) {
        return res.status(429).json({ 
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      } else {
        userRequests.count++;
      }
    }
    
    next();
  };
};

// Middleware to validate request body
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed.',
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Validation error.',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

module.exports = {
  verifyToken,
  requirePermission,
  requireAdmin,
  logActivity,
  addRequestTime,
  rateLimit,
  validateBody
};
