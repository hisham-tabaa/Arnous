const Currency = require('../models/Currency');
const ActivityLog = require('../models/ActivityLog');

class CurrencyService {
  // Get all active currencies
  static async getAllCurrencies() {
    try {
      console.log('🔍 CurrencyService: Fetching all currencies...');
      const currencies = await Currency.getActiveCurrencies();
      console.log(`📊 CurrencyService: Found ${currencies.length} active currencies`);
      
      // Return a keyed map for frontend consumption
      const result = currencies.reduce((acc, currency) => {
        const formatted = currency.getFormattedRates();
        acc[formatted.code] = formatted;
        return acc;
      }, {});
      
      console.log('📋 CurrencyService: Returning currencies:', Object.keys(result).join(', '));
      return result;
    } catch (error) {
      console.error('❌ CurrencyService: Failed to fetch currencies:', error);
      throw new Error('Failed to fetch currencies');
    }
  }

  // Get currency by code
  static async getCurrencyByCode(code) {
    try {
      const currency = await Currency.getByCode(code);
      return currency ? currency.getFormattedRates() : null;
    } catch (error) {
      throw new Error('Failed to fetch currency');
    }
  }

  // Update multiple currencies
  static async updateCurrencies(currencyUpdates, adminUser) {
    try {
      // Validate input data
      const validationErrors = this.validateCurrencyData(currencyUpdates);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Update currencies in database
      const updatedCurrencies = await Currency.updateMultiple(currencyUpdates, adminUser);

      // Log the update activity
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_update',
        resource: 'currency',
        details: {
          updatedCurrencies: Object.keys(currencyUpdates),
          changes: currencyUpdates
        },
        status: 'success'
      });

      // Return a keyed map
      return updatedCurrencies.reduce((acc, currency) => {
        const formatted = currency.getFormattedRates();
        acc[formatted.code] = formatted;
        return acc;
      }, {});
    } catch (error) {
      // Log failed update
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_update',
        resource: 'currency',
        details: {
          attemptedUpdates: currencyUpdates,
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });

      throw error;
    }
  }

  // Create new currency
  static async createCurrency(currencyData, adminUser) {
    try {
      // Validate currency data
      const validationErrors = this.validateSingleCurrency(currencyData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check if currency already exists
      const existingCurrency = await Currency.getByCode(currencyData.code);
      if (existingCurrency) {
        throw new Error(`Currency with code ${currencyData.code} already exists`);
      }

      // Create new currency
      const newCurrency = new Currency({
        ...currencyData,
        createdBy: adminUser
      });

      await newCurrency.save();

      // Log the creation
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_create',
        resource: 'currency',
        details: {
          newCurrency: newCurrency.getFormattedRates()
        },
        status: 'success'
      });

      return newCurrency.getFormattedRates();
    } catch (error) {
      // Log failed creation
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_create',
        resource: 'currency',
        details: {
          attemptedData: currencyData,
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });

      throw error;
    }
  }

  // Delete currency (soft delete)
  static async deleteCurrency(code, adminUser) {
    try {
      const currency = await Currency.getByCode(code);
      
      if (!currency) {
        throw new Error(`Currency with code ${code} not found`);
      }

      // Soft delete by setting isActive to false
      currency.isActive = false;
      await currency.save();

      // Log the deletion
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_delete',
        resource: 'currency',
        details: {
          deletedCurrency: currency.getFormattedRates()
        },
        status: 'success'
      });

      return {
        success: true,
        message: `Currency ${code} deleted successfully`
      };
    } catch (error) {
      // Log failed deletion
      await ActivityLog.logActivity({
        user: adminUser,
        action: 'currency_delete',
        resource: 'currency',
        details: {
          attemptedCode: code,
          error: error.message
        },
        status: 'failure',
        errorMessage: error.message
      });

      throw error;
    }
  }

  // Get currency history
  static async getCurrencyHistory(code, limit = 10) {
    try {
      const currency = await Currency.getByCode(code);
      
      if (!currency) {
        throw new Error(`Currency with code ${code} not found`);
      }

      return {
        code: currency.code,
        name: currency.name,
        currentRates: {
          buyRate: currency.buyRate,
          sellRate: currency.sellRate,
          spread: currency.spread,
          spreadPercentage: currency.spreadPercentage
        },
        lastUpdated: currency.lastUpdated,
        updateHistory: currency.updateHistory.slice(-limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get currency statistics
  static async getCurrencyStats() {
    try {
      const currencies = await Currency.getActiveCurrencies();
      
      const stats = {
        totalCurrencies: currencies.length,
        totalUpdates: 0,
        averageSpread: 0,
        lastUpdate: null,
        currencyDetails: []
      };

      let totalSpread = 0;
      let totalSpreadPercentage = 0;

      currencies.forEach(currency => {
        const spread = currency.spread;
        const spreadPercentage = parseFloat(currency.spreadPercentage);
        
        totalSpread += spread;
        totalSpreadPercentage += spreadPercentage;
        stats.totalUpdates += currency.updateHistory.length;

        if (!stats.lastUpdate || currency.lastUpdated > stats.lastUpdate) {
          stats.lastUpdate = currency.lastUpdated;
        }

        stats.currencyDetails.push({
          code: currency.code,
          name: currency.name,
          buyRate: currency.buyRate,
          sellRate: currency.sellRate,
          spread,
          spreadPercentage,
          lastUpdated: currency.lastUpdated,
          updateCount: currency.updateHistory.length
        });
      });

      if (currencies.length > 0) {
        stats.averageSpread = totalSpread / currencies.length;
        stats.averageSpreadPercentage = totalSpreadPercentage / currencies.length;
      }

      return stats;
    } catch (error) {
      throw new Error('Failed to fetch currency statistics');
    }
  }

  // Validate currency data
  static validateCurrencyData(currencies) {
    const errors = [];
    
    Object.entries(currencies).forEach(([code, data]) => {
      const codeErrors = this.validateSingleCurrency(data, code);
      errors.push(...codeErrors);
    });
    
    return errors;
  }

  // Validate single currency
  static validateSingleCurrency(currencyData, code = '') {
    const errors = [];
    
    // Check if data exists
    if (!currencyData) {
      errors.push(`${code}: Currency data is missing`);
      return errors;
    }
    
    // Convert to numbers to ensure proper comparison
    const buyRate = parseFloat(currencyData.buyRate);
    const sellRate = parseFloat(currencyData.sellRate);
    
    // Check for NaN values
    if (isNaN(buyRate)) {
      errors.push(`${code}: Buy rate must be a valid number (received: ${currencyData.buyRate})`);
    } else if (buyRate <= 0) {
      errors.push(`${code}: Buy rate must be greater than 0 (received: ${buyRate})`);
    }
    
    if (isNaN(sellRate)) {
      errors.push(`${code}: Sell rate must be a valid number (received: ${currencyData.sellRate})`);
    } else if (sellRate <= 0) {
      errors.push(`${code}: Sell rate must be greater than 0 (received: ${sellRate})`);
    }
    
    // Only check comparison if both rates are valid numbers
    if (!isNaN(buyRate) && !isNaN(sellRate) && buyRate >= sellRate) {
      errors.push(`${code}: Buy rate (${buyRate}) must be less than sell rate (${sellRate})`);
    }
    
    if (currencyData.code && !['USD', 'EUR', 'GBP', 'TRY', 'JPY', 'SAR', 'JOD', 'KWD'].includes(currencyData.code)) {
      errors.push(`${code}: Invalid currency code`);
    }
    
    return errors;
  }

  // Search currencies
  static async searchCurrencies(query, filters = {}) {
    try {
      const searchQuery = {};
      
      // Text search
      if (query) {
        searchQuery.$or = [
          { code: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Apply filters
      if (filters.isActive !== undefined) {
        searchQuery.isActive = filters.isActive;
      }
      
      if (filters.minBuyRate) {
        searchQuery.buyRate = { $gte: filters.minBuyRate };
      }
      
      if (filters.maxBuyRate) {
        if (searchQuery.buyRate) {
          searchQuery.buyRate.$lte = filters.maxBuyRate;
        } else {
          searchQuery.buyRate = { $lte: filters.maxBuyRate };
        }
      }
      
      if (filters.minSpread) {
        searchQuery.$expr = { $gte: [{ $subtract: ['$sellRate', '$buyRate'] }, filters.minSpread] };
      }
      
      const currencies = await Currency.find(searchQuery)
        .sort({ lastUpdated: -1 })
        .limit(filters.limit || 50);
      
      return currencies.map(currency => currency.getFormattedRates());
    } catch (error) {
      throw new Error('Failed to search currencies');
    }
  }
}

module.exports = CurrencyService;
