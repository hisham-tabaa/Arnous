const axios = require('axios');

class FacebookAPI {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async publishPost(message) {
    // If no access token is provided, simulate the posting
    if (!this.accessToken || !this.pageId) {
      console.log('Facebook API - Simulated posting (no credentials provided)');
      console.log('Message:', message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        postId: `fb_sim_${Date.now()}`,
        message: 'Posted successfully to Facebook (simulated)'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/${this.pageId}/feed`,
        {
          message: message,
          access_token: this.accessToken
        }
      );
      
      return {
        success: true,
        postId: response.data.id,
        message: 'Posted successfully to Facebook'
      };
    } catch (error) {
      console.error('Facebook posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Facebook'
      };
    }
  }

  async testConnection() {
    if (!this.accessToken || !this.pageId) {
      return { success: false, error: 'Missing credentials' };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.pageId}?fields=name,access_token&access_token=${this.accessToken}`
      );
      
      return {
        success: true,
        pageName: response.data.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Connection test failed'
      };
    }
  }
}

module.exports = FacebookAPI;
