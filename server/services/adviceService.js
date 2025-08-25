const Advice = require('../models/Advice');
const { ActivityLog } = require('../config/database');

class AdviceService {
  /**
   * Create new advice/prediction
   */
  static async createAdvice(adviceData, authorId) {
    try {
      const advice = new Advice({
        ...adviceData,
        author: authorId
      });

      const savedAdvice = await advice.save();
      
      // Log the creation
      await ActivityLog.logActivity({
        user: authorId,
        action: 'advice_create',
        resource: 'advice',
        details: {
          adviceId: savedAdvice._id,
          title: savedAdvice.title,
          type: savedAdvice.type
        },
        status: 'success'
      });

      return await this.getAdviceById(savedAdvice._id);
    } catch (error) {
      throw new Error(`Failed to create advice: ${error.message}`);
    }
  }

  /**
   * Get advice by ID
   */
  static async getAdviceById(adviceId) {
    try {
      const advice = await Advice.findById(adviceId)
        .populate('author', 'username profile.firstName profile.lastName');
      
      if (!advice) {
        throw new Error('Advice not found');
      }

      return advice;
    } catch (error) {
      throw new Error(`Failed to get advice: ${error.message}`);
    }
  }

  /**
   * Get all active advice for public display
   */
  static async getPublicAdvice(options = {}) {
    try {
      const {
        limit = 10,
        type = null,
        featured = false
      } = options;

      let advice;
      
      if (featured) {
        advice = await Advice.getFeaturedAdvice(limit);
      } else {
        advice = await Advice.getActiveAdvice({ limit, type });
      }

      return advice || [];
    } catch (error) {
      console.error('Error in getPublicAdvice:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get all advice for admin panel
   */
  static async getAllAdvice(options = {}) {
    try {
      const {
        limit = 50,
        page = 1,
        type = null,
        isActive = null,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      const query = {};
      
      if (type) query.type = type;
      if (isActive !== null) query.isActive = isActive;

      const skip = (page - 1) * limit;

      const advice = await Advice.find(query)
        .populate('author', 'username profile.firstName profile.lastName')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const total = await Advice.countDocuments(query);

      return {
        advice: advice || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllAdvice:', error);
      // Return empty result instead of throwing error
      return {
        advice: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        }
      };
    }
  }

  /**
   * Update advice
   */
  static async updateAdvice(adviceId, updateData, userId) {
    try {
      const advice = await Advice.findById(adviceId);
      
      if (!advice) {
        throw new Error('Advice not found');
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          advice[key] = updateData[key];
        }
      });

      const updatedAdvice = await advice.save();

      // Log the update
      await ActivityLog.logActivity({
        user: userId,
        action: 'advice_update',
        resource: 'advice',
        details: {
          adviceId: updatedAdvice._id,
          title: updatedAdvice.title,
          changes: Object.keys(updateData)
        },
        status: 'success'
      });

      return await this.getAdviceById(updatedAdvice._id);
    } catch (error) {
      throw new Error(`Failed to update advice: ${error.message}`);
    }
  }

  /**
   * Delete advice
   */
  static async deleteAdvice(adviceId, userId) {
    try {
      const advice = await Advice.findById(adviceId);
      
      if (!advice) {
        throw new Error('Advice not found');
      }

      await Advice.findByIdAndDelete(adviceId);

      // Log the deletion
      await ActivityLog.logActivity({
        user: userId,
        action: 'advice_delete',
        resource: 'advice',
        details: {
          adviceId,
          title: advice.title,
          type: advice.type
        },
        status: 'success'
      });

      return { success: true, message: 'Advice deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete advice: ${error.message}`);
    }
  }

  /**
   * Toggle advice active status
   */
  static async toggleAdviceStatus(adviceId, userId) {
    try {
      const advice = await Advice.findById(adviceId);
      
      if (!advice) {
        throw new Error('Advice not found');
      }

      advice.isActive = !advice.isActive;
      const updatedAdvice = await advice.save();

      // Log the status change
      await ActivityLog.logActivity({
        user: userId,
        action: 'advice_status_toggle',
        resource: 'advice',
        details: {
          adviceId: updatedAdvice._id,
          title: updatedAdvice.title,
          newStatus: updatedAdvice.isActive
        },
        status: 'success'
      });

      return await this.getAdviceById(updatedAdvice._id);
    } catch (error) {
      throw new Error(`Failed to toggle advice status: ${error.message}`);
    }
  }

  /**
   * Search advice
   */
  static async searchAdvice(searchTerm, options = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return await this.getPublicAdvice(options);
      }

      const advice = await Advice.searchAdvice(searchTerm.trim(), options);
      return advice;
    } catch (error) {
      throw new Error(`Failed to search advice: ${error.message}`);
    }
  }

  /**
   * Get advice statistics
   */
  static async getAdviceStats() {
    try {
      const [
        totalAdvice,
        activeAdvice,
        expiredAdvice,
        adviceByType,
        recentAdvice,
        topViewedAdvice
      ] = await Promise.all([
        Advice.countDocuments(),
        Advice.countDocuments({ isActive: true }),
        Advice.countDocuments({ 
          expiryDate: { $lt: new Date() }
        }),
        Advice.aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              activeCount: {
                $sum: {
                  $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                }
              }
            }
          }
        ]),
        Advice.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('author', 'username'),
        Advice.find({ isActive: true })
          .sort({ 'metadata.viewCount': -1 })
          .limit(5)
          .populate('author', 'username')
      ]);

      return {
        totalAdvice,
        activeAdvice,
        expiredAdvice,
        inactiveAdvice: totalAdvice - activeAdvice - expiredAdvice,
        adviceByType,
        recentAdvice,
        topViewedAdvice
      };
    } catch (error) {
      throw new Error(`Failed to get advice statistics: ${error.message}`);
    }
  }

  /**
   * Increment view count for advice
   */
  static async incrementViewCount(adviceId) {
    try {
      const advice = await Advice.findById(adviceId);
      
      if (advice) {
        await advice.incrementViewCount();
      }
      
      return advice;
    } catch (error) {
      // Don't throw error for view count increment failures
      console.error('Failed to increment view count:', error);
      return null;
    }
  }

  /**
   * Get company information (static data - can be made dynamic later)
   */
  static getCompanyInfo() {
    return {
      companyName: 'شركة أرنوس للصرافة',
      companyNameEn: 'Arnous Exchange Company',
      address: 'دمشق - شارع الثورة - مقابل وزارة التجارة الداخلية',
      addressEn: 'Damascus - Al-Thawra Street - Opposite Ministry of Internal Trade',
      phone: '+963 11 2233445',
      mobile: '+963 988 123 456',
      email: 'info@arnous-exchange.com',
      website: 'https://arnous-production.up.railway.app',
      workingHours: {
        ar: 'من السبت إلى الخميس: 9:00 ص - 6:00 م',
        en: 'Saturday to Thursday: 9:00 AM - 6:00 PM'
      },
      services: {
        ar: [
          'صرافة العملات الأجنبية',
          'تحويلات مالية داخلية وخارجية',
          'خدمات الدفع الإلكتروني',
          'استشارات مالية'
        ],
        en: [
          'Foreign Currency Exchange',
          'Local & International Money Transfers',
          'Electronic Payment Services',
          'Financial Consulting'
        ]
      },
      socialMedia: {
        facebook: {
          name: 'Facebook',
          url: 'https://facebook.com/arnous.exchange',
          icon: 'facebook'
        },
        instagram: {
          name: 'Instagram',
          url: 'https://instagram.com/arnous.exchange',
          icon: 'instagram'
        },
        telegram: {
          name: 'Telegram',
          url: 'https://t.me/arnous_exchange',
          icon: 'telegram'
        },
        whatsapp: {
          name: 'WhatsApp',
          url: 'https://wa.me/963988123456',
          icon: 'whatsapp'
        }
      }
    };
  }
}

module.exports = AdviceService;
