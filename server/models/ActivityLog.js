const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'currency_update',
      'currency_create',
      'currency_delete',
      'currency_visibility_toggle',
      'social_publish',
      'user_create',
      'user_update',
      'user_delete',
      'password_change',
      'profile_update'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['currency', 'user', 'social_media', 'system', 'auth']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ resource: 1, createdAt: -1 });
ActivityLogSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted action description
ActivityLogSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    'login': 'User logged in',
    'logout': 'User logged out',
    'currency_update': 'Currency rates updated',
    'currency_create': 'New currency created',
    'currency_delete': 'Currency deleted',
    'currency_visibility_toggle': 'Currency visibility toggled',
    'social_publish': 'Published to social media',
    'user_create': 'New user created',
    'user_update': 'User profile updated',
    'user_delete': 'User deleted',
    'password_change': 'Password changed',
    'profile_update': 'Profile updated'
  };
  
  return actionMap[this.action] || this.action;
});

// Static method to log activity
ActivityLogSchema.statics.logActivity = async function(activityData) {
  try {
    const log = new this(activityData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};

// Static method to get user activity
ActivityLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username profile.firstName profile.lastName');
};

// Static method to get system activity
ActivityLogSchema.statics.getSystemActivity = function(filters = {}, limit = 100) {
  const query = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.resource) query.resource = filters.resource;
  if (filters.status) query.status = filters.status;
  if (filters.startDate) query.createdAt = { $gte: filters.startDate };
  if (filters.endDate) {
    if (query.createdAt) {
      query.createdAt.$lte = filters.endDate;
    } else {
      query.createdAt = { $lte: filters.endDate };
    }
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username profile.firstName profile.lastName');
};

// Static method to get activity statistics
ActivityLogSchema.statics.getActivityStats = async function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
  
  return stats;
};

// Static method to clean old logs (keep last 90 days)
ActivityLogSchema.statics.cleanOldLogs = async function() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const result = await this.deleteMany({
    createdAt: { $lt: ninetyDaysAgo }
  });
  
  return result;
};

// Method to get formatted log entry
ActivityLogSchema.methods.getFormattedLog = function() {
  return {
    id: this._id,
    action: this.action,
    actionDescription: this.actionDescription,
    resource: this.resource,
    status: this.status,
    details: this.details,
    createdAt: this.createdAt,
    user: this.user,
    ipAddress: this.ipAddress
  };
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
