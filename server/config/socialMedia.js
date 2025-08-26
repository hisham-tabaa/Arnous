/**
 * Social Media Configuration
 * Centralized configuration for all social media platforms
 */

const socialMediaConfig = {
  // Facebook Configuration
  facebook: {
    name: 'Facebook',
    url: 'https://www.facebook.com/arnous.ex/',
    icon: '📘',
    color: '#1877f2',
    description: 'Follow us on Facebook for latest updates and news'
  },

  // Instagram Configuration
  instagram: {
    name: 'Instagram',
    url: 'https://instagram.com/arnous.exchange',
    icon: '📷',
    color: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    description: 'Follow us on Instagram for visual content and stories'
  },

  // Telegram Configuration
  telegram: {
    name: 'Telegram',
    url: 'https://t.me/arnous_exchange',
    icon: '📨',
    color: '#0088cc',
    description: 'Join our Telegram channel for instant updates'
  },

  // WhatsApp Configuration
  whatsapp: {
    name: 'WhatsApp',
    url: 'https://whatsapp.com/channel/0029Vb6LYzG3GJP3Ait6uc1e',
    icon: '💬',
    color: '#25D366',
    description: 'Join our WhatsApp channel for daily updates'
  }
};

/**
 * Get all social media platforms
 * @returns {Object} All social media configurations
 */
function getAllSocialMedia() {
  return socialMediaConfig;
}

/**
 * Get specific social media platform
 * @param {string} platform - Platform name (facebook, instagram, telegram, whatsapp)
 * @returns {Object|null} Social media configuration or null if not found
 */
function getSocialMedia(platform) {
  return socialMediaConfig[platform] || null;
}

/**
 * Get social media URLs for frontend
 * @returns {Object} Social media URLs
 */
function getSocialMediaUrls() {
  const urls = {};
  Object.keys(socialMediaConfig).forEach(platform => {
    urls[platform] = socialMediaConfig[platform].url;
  });
  return urls;
}

/**
 * Validate social media URLs
 * @returns {Object} Validation results for each platform
 */
function validateSocialMediaUrls() {
  const results = {};
  
  Object.keys(socialMediaConfig).forEach(platform => {
    const config = socialMediaConfig[platform];
    const url = config.url;
    
    try {
      new URL(url);
      results[platform] = {
        valid: true,
        url: url,
        message: 'Valid URL'
      };
    } catch (error) {
      results[platform] = {
        valid: false,
        url: url,
        message: 'Invalid URL format'
      };
    }
  });
  
  return results;
}

module.exports = {
  socialMediaConfig,
  getAllSocialMedia,
  getSocialMedia,
  getSocialMediaUrls,
  validateSocialMediaUrls
};
