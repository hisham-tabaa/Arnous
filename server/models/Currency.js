const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    enum: ['USD', 'EUR', 'GBP', 'TRY']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  buyRate: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Buy rate must be greater than 0'
    }
  },
  sellRate: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value > this.buyRate;
      },
      message: 'Sell rate must be greater than buy rate'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  updateHistory: [{
    buyRate: Number,
    sellRate: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for spread (difference between buy and sell)
CurrencySchema.virtual('spread').get(function() {
  return this.sellRate - this.buyRate;
});

// Virtual field for spread percentage
CurrencySchema.virtual('spreadPercentage').get(function() {
  return ((this.sellRate - this.buyRate) / this.buyRate * 100).toFixed(2);
});

// Pre-save middleware to update lastUpdated and add to history
CurrencySchema.pre('save', function(next) {
  if (this.isModified('buyRate') || this.isModified('sellRate')) {
    this.lastUpdated = new Date();
    
    // Add to update history
    this.updateHistory.push({
      buyRate: this.buyRate,
      sellRate: this.sellRate,
      updatedAt: new Date(),
      updatedBy: this.createdBy
    });
    
    // Keep only last 10 updates in history
    if (this.updateHistory.length > 10) {
      this.updateHistory = this.updateHistory.slice(-10);
    }
  }
  next();
});

// Static method to get all active currencies
CurrencySchema.statics.getActiveCurrencies = function() {
  return this.find({ isActive: true }).sort({ code: 1 });
};

// Static method to get currency by code
CurrencySchema.statics.getByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Static method to update multiple currencies
CurrencySchema.statics.updateMultiple = async function(currencyUpdates, adminUser) {
  const updates = [];
  
  for (const [code, rates] of Object.entries(currencyUpdates)) {
    const update = await this.findOneAndUpdate(
      { code: code.toUpperCase() },
      {
        buyRate: rates.buyRate,
        sellRate: rates.sellRate,
        lastUpdated: new Date(),
        createdBy: adminUser
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    updates.push(update);
  }
  
  return updates;
};

// Instance method to get formatted rates
CurrencySchema.methods.getFormattedRates = function() {
  return {
    code: this.code,
    name: this.name,
    buyRate: this.buyRate,
    sellRate: this.sellRate,
    spread: this.spread,
    spreadPercentage: this.spreadPercentage,
    lastUpdated: this.lastUpdated,
    isActive: this.isActive
  };
};

module.exports = mongoose.model('Currency', CurrencySchema);
