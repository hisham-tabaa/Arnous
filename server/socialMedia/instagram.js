const axios = require('axios');

class InstagramAPI {
  constructor(accessToken, instagramAccountId) {
    this.accessToken = accessToken;
    this.instagramAccountId = instagramAccountId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async publishPost(message) {
    // Return modal data for copy-paste functionality
    return this.generateInstagramModalData(message);
  }

  generateInstagramModalData(message) {
    // Instagram posting URLs - use main Instagram page and stories
    const instagramUrl = 'https://www.instagram.com/';
    const instagramStoriesUrl = 'https://www.instagram.com/stories/camera/';
    
    return {
      success: true,
      method: 'modal',
      platform: 'Instagram',
      content: message,
      platformUrl: instagramUrl,
      alternativeUrl: instagramStoriesUrl,
      instructions: [
        'Copy the content above',
        'Click "Open Instagram" to go to Instagram',
        'For Stories (24h): Click "+" → Story → Create → Add text → Paste content → Share',
        'For Posts: Click "+" → Post → Upload image → Add caption → Paste content → Share',
        'For Reels: Click "+" → Reel → Record/Upload → Add caption → Paste content → Share',
        'Alternative: Use "Instagram Stories" button for quick story posting'
      ],
      note: 'Instagram requires visual content for posts. Stories are best for text-only content but disappear after 24 hours. For permanent posts, create an image with your text or use it as a caption.'
    };
  }

  // Keep the old method for backward compatibility
  async publishPostDirect(message) {
    // If no access token is provided, simulate the posting
    if (!this.accessToken || !this.instagramAccountId) {
      console.log('Instagram API - Simulated posting (no credentials provided)');
      console.log('Message:', message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        success: true,
        postId: `ig_sim_${Date.now()}`,
        message: 'Posted successfully to Instagram (simulated)'
      };
    }

    try {
      // Step 1: Create media container for text post
      const mediaResponse = await axios.post(
        `${this.baseURL}/${this.instagramAccountId}/media`,
        {
          caption: message,
          media_type: 'TEXT',
          access_token: this.accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `${this.baseURL}/${this.instagramAccountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        message: 'Posted successfully to Instagram'
      };
    } catch (error) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      
      // Instagram has specific requirements for text posts
      const errorMessage = error.response?.data?.error?.message;
      if (errorMessage && errorMessage.includes('media_type')) {
        return {
          success: false,
          error: 'Instagram requires image or video content. Text-only posts are not supported.'
        };
      }
      
      return {
        success: false,
        error: errorMessage || 'Failed to post to Instagram'
      };
    }
  }

  async publishPostWithImage(message, imageUrl) {
    if (!this.accessToken || !this.instagramAccountId) {
      console.log('Instagram API - Simulated image posting (no credentials provided)');
      return {
        success: true,
        postId: `ig_img_sim_${Date.now()}`,
        message: 'Posted successfully to Instagram with image (simulated)'
      };
    }

    try {
      // Step 1: Create media container with image
      const mediaResponse = await axios.post(
        `${this.baseURL}/${this.instagramAccountId}/media`,
        {
          image_url: imageUrl,
          caption: message,
          access_token: this.accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Step 2: Wait for media to be processed (recommended)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Publish the media
      const publishResponse = await axios.post(
        `${this.baseURL}/${this.instagramAccountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        message: 'Posted successfully to Instagram with image'
      };
    } catch (error) {
      console.error('Instagram image posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Instagram'
      };
    }
  }

  async testConnection() {
    if (!this.accessToken || !this.instagramAccountId) {
      return { success: false, error: 'Missing credentials' };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.instagramAccountId}?fields=name,username&access_token=${this.accessToken}`
      );
      
      return {
        success: true,
        accountInfo: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Connection test failed'
      };
    }
  }
}

module.exports = InstagramAPI;
