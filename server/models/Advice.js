const mongoose = require('mongoose');

const adviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['market_prediction', 'financial_advice', 'currency_outlook', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    viewCount: {
      type: Number,
      default: 0
    },
    isSticky: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true
});

// Add indexes for better performance
adviceSchema.index({ publishDate: -1 });
adviceSchema.index({ isActive: 1, publishDate: -1 });
adviceSchema.index({ type: 1, isActive: 1 });
adviceSchema.index({ 'metadata.isSticky': 1, publishDate: -1 });

// Virtual for formatted publish date
adviceSchema.virtual('formattedPublishDate').get(function() {
  return this.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for checking if advice is expired
adviceSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for checking if advice is current
adviceSchema.virtual('isCurrent').get(function() {
  return this.isActive && !this.isExpired;
});

// Instance method to increment view count
adviceSchema.methods.incrementViewCount = function() {
  this.metadata.viewCount += 1;
  return this.save();
};

// Static method to get active advice
adviceSchema.statics.getActiveAdvice = function(options = {}) {
  const {
    limit = 10,
    type = null,
    includeExpired = false,
    sortBy = 'publishDate',
    sortOrder = -1
  } = options;

  const query = { isActive: true };
  
  if (type) {
    query.type = type;
  }
  
  if (!includeExpired) {
    query.$or = [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ];
  }

  return this.find(query)
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ 'metadata.isSticky': -1, [sortBy]: sortOrder })
    .limit(limit);
};

// Static method to get advice by type
adviceSchema.statics.getAdviceByType = function(type, limit = 5) {
  return this.getActiveAdvice({ type, limit });
};

// Static method to get featured/sticky advice
adviceSchema.statics.getFeaturedAdvice = function(limit = 3) {
  return this.find({ 
    isActive: true, 
    'metadata.isSticky': true,
    $or: [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ]
  })
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ publishDate: -1 })
    .limit(limit);
};

// Static method to search advice
adviceSchema.statics.searchAdvice = function(searchTerm, options = {}) {
  const {
    limit = 10,
    type = null,
    activeOnly = true
  } = options;

  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { 'metadata.tags': { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (activeOnly) {
    query.isActive = true;
    query.$and = [
      query.$and || [],
      {
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } }
        ]
      }
    ];
  }

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ 'metadata.isSticky': -1, publishDate: -1 })
    .limit(limit);
};

// Pre-save middleware to update timestamps
adviceSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-save middleware to validate expiry date
adviceSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate <= this.publishDate) {
    const error = new Error('Expiry date must be after publish date');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Advice', adviceSchema);
