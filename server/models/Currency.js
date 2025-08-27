const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    enum: ['USD', 'EUR', 'GBP', 'TRY', 'JPY', 'SAR', 'JOD', 'KWD']
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
    min: 0
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
  // Validate that sell rate is greater than buy rate
  if (this.sellRate <= this.buyRate) {
    const error = new Error(`Sell rate (${this.sellRate}) must be greater than buy rate (${this.buyRate}) for ${this.code}`);
    error.name = 'ValidationError';
    return next(error);
  }
  
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

// Pre-update validation hook for findOneAndUpdate operations
CurrencySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  
  // If both buyRate and sellRate are being updated
  if (update.$set && update.$set.buyRate !== undefined && update.$set.sellRate !== undefined) {
    const buyRate = parseFloat(update.$set.buyRate);
    const sellRate = parseFloat(update.$set.sellRate);
    
    if (isNaN(buyRate) || isNaN(sellRate)) {
      const error = new Error(`Invalid rates: buyRate=${update.$set.buyRate}, sellRate=${update.$set.sellRate}`);
      error.name = 'ValidationError';
      return next(error);
    }
    
    if (buyRate <= 0 || sellRate <= 0) {
      const error = new Error(`Rates must be positive: buyRate=${buyRate}, sellRate=${sellRate}`);
      error.name = 'ValidationError';
      return next(error);
    }
    
    if (sellRate <= buyRate) {
      const error = new Error(`Sell rate (${sellRate}) must be greater than buy rate (${buyRate})`);
      error.name = 'ValidationError';
      return next(error);
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

  const currencyNames = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    TRY: 'Turkish Lira',
    JPY: 'Japanese Yen',
    SAR: 'Saudi Riyal',
    JOD: 'Jordanian Dinar',
    KWD: 'Kuwaiti Dinar'
  };
  
  for (const [codeRaw, rates] of Object.entries(currencyUpdates)) {
    const code = codeRaw.toUpperCase();
    
    // Convert rates to numbers and validate
    const buyRate = parseFloat(rates.buyRate);
    const sellRate = parseFloat(rates.sellRate);
    
    if (isNaN(buyRate) || isNaN(sellRate)) {
      throw new Error(`Invalid rates for ${code}: buyRate=${rates.buyRate}, sellRate=${rates.sellRate}`);
    }
    
    if (buyRate <= 0 || sellRate <= 0) {
      throw new Error(`Rates must be positive for ${code}: buyRate=${buyRate}, sellRate=${sellRate}`);
    }
    
    if (sellRate <= buyRate) {
      throw new Error(`Sell rate must be greater than buy rate for ${code}: buyRate=${buyRate}, sellRate=${sellRate}`);
    }
    
    const update = await this.findOneAndUpdate(
      { code },
      {
        $set: {
          buyRate: buyRate,
          sellRate: sellRate,
          lastUpdated: new Date(),
          createdBy: adminUser
        },
        $setOnInsert: {
          code,
          name: currencyNames[code] || code
        }
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
