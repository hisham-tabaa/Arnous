const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class FacebookAPI {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    
    // Detect posting method based on environment variables
    this.method = this.detectPostingMethod();
    this.setupCredentials();
  }

  detectPostingMethod() {
    if (process.env.ZAPIER_FACEBOOK_WEBHOOK) {
      return 'zapier';
    } else if (process.env.BUFFER_ACCESS_TOKEN) {
      return 'buffer';
    } else if (process.env.FACEBOOK_METHOD === 'manual') {
      return 'manual';
    } else if (this.accessToken && this.pageId) {
      return 'direct';
    } else {
      return 'manual';
    }
  }

  setupCredentials() {
    switch(this.method) {
      case 'zapier':
        this.webhookUrl = process.env.ZAPIER_FACEBOOK_WEBHOOK;
        break;
      case 'buffer':
        this.bufferToken = process.env.BUFFER_ACCESS_TOKEN;
        this.bufferProfileId = process.env.BUFFER_PROFILE_ID;
        break;
    }
  }

  async publishPost(message) {
    // Generate Facebook redirect URL with pre-filled content
    return this.generateFacebookRedirectUrl(message);
  }

  generateFacebookRedirectUrl(message) {
    // Direct link to the specific Facebook page
    const facebookPageUrl = 'https://www.facebook.com/arnous.ex/';
    
    return {
      success: true,
      method: 'modal',
      platform: 'Facebook',
      content: message,
      platformUrl: facebookPageUrl,
      instructions: [
        'Copy the content above',
        'Click "Open Facebook" to go to your Facebook page',
        'Click "Create Post" or "What\'s on your mind?" box',
        'Paste the content in the post box',
        'Add any images or additional text if needed',
        'Click "Post" to publish'
      ],
      note: 'Make sure you are logged in to Facebook and have admin access to the Arnous Exchange page.'
    };
  }

  // Zapier webhook method (works globally)
  async publishViaZapier(message) {
    if (!this.webhookUrl) {
      throw new Error('Zapier webhook URL not configured');
    }

    const response = await axios.post(this.webhookUrl, {
      message: message,
      timestamp: new Date().toISOString(),
      platform: 'facebook'
    });

    return {
      success: true,
      postId: `zapier_${Date.now()}`,
      message: 'Post sent to Facebook via Zapier automation',
      method: 'zapier'
    };
  }

  // Buffer API method
  async publishViaBuffer(message) {
    if (!this.bufferToken || !this.bufferProfileId) {
      throw new Error('Buffer credentials not configured');
    }

    const response = await axios.post('https://api.bufferapp.com/1/updates/create.json', {
      text: message,
      profile_ids: [this.bufferProfileId],
      access_token: this.bufferToken
    });

    return {
      success: true,
      postId: response.data.updates[0].id,
      message: 'Post scheduled on Facebook via Buffer',
      method: 'buffer'
    };
  }

  // Manual posting - save content for copy-paste
  async saveForManualPost(message) {
    try {
      const postsDir = path.join(__dirname, '../data/manual-posts');
      await fs.mkdir(postsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `facebook-post-${timestamp}.txt`;
      const filepath = path.join(postsDir, filename);
      
      const content = `📘 FACEBOOK POST - ${new Date().toLocaleString()}\n` +
                     `${'='.repeat(50)}\n\n` +
                     `${message}\n\n` +
                     `${'='.repeat(50)}\n` +
                     `Instructions:\n` +
                     `1. Copy the message above\n` +
                     `2. Go to your Facebook page\n` +
                     `3. Paste and publish the post\n` +
                     `4. Delete this file after posting\n`;
      
      await fs.writeFile(filepath, content, 'utf8');
      
      console.log(`📁 Facebook post saved for manual posting: ${filepath}`);
      
      return {
        success: true,
        postId: `manual_${Date.now()}`,
        message: 'Post content saved for manual posting to Facebook',
        method: 'manual',
        filepath: filepath,
        instructions: 'Check server/data/manual-posts/ folder for post content'
      };
    } catch (error) {
      throw new Error(`Failed to save manual post: ${error.message}`);
    }
  }

  // Direct Facebook API (for regions with access)
  async publishViaDirect(message) {
    if (!this.accessToken || !this.pageId) {
      throw new Error('Facebook API credentials not configured');
    }

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
      message: 'Posted successfully to Facebook via API',
      method: 'direct'
    };
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
