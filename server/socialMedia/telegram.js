const axios = require('axios');

class TelegramAPI {
  constructor(botToken, channelId) {
    this.botToken = botToken;
    this.channelId = channelId; // Format: @channel_username or -100XXXXXXXXX
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  async publishPost(message) {
    // Return modal data for copy-paste functionality
    return this.generateTelegramModalData(message);
  }

  generateTelegramModalData(message) {
    // Telegram posting URLs and instructions
    let telegramUrl = 'https://web.telegram.org/';
    let telegramDesktopUrl = 'https://desktop.telegram.org/';
    
    // If we have a channel ID, try to create a direct link
    if (this.channelId) {
      const channelName = this.channelId.startsWith('@') ? this.channelId.substring(1) : this.channelId;
      // Try to create direct channel link
      telegramUrl = `https://web.telegram.org/k/#${channelName}`;
    }
    
    return {
      success: true,
      method: 'modal',
      platform: 'Telegram',
      content: message,
      platformUrl: telegramUrl,
      alternativeUrl: telegramDesktopUrl,
      instructions: [
        'Copy the content above',
        'Click "Open Telegram" to go to your channel',
        'If not redirected to your channel, search for your channel name',
        'Click in the message input box at the bottom',
        'Paste the content',
        'Add any formatting (bold, italic) if desired',
        'Press Enter or click Send button to publish'
      ],
      note: 'You can also use "Telegram Desktop" button or mobile app. Make sure you have admin rights to post in the channel.'
    };
  }

  // Keep the old method for backward compatibility
  async publishPostDirect(message) {
    // If no bot token is provided, simulate the posting
    if (!this.botToken || !this.channelId) {
      console.log('Telegram API - Simulated posting (no credentials provided)');
      console.log('Message:', message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        messageId: `tg_sim_${Date.now()}`,
        message: 'Posted successfully to Telegram (simulated)'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/sendMessage`,
        {
          chat_id: this.channelId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      );

      return {
        success: true,
        messageId: response.data.result.message_id,
        message: 'Posted successfully to Telegram'
      };
    } catch (error) {
      console.error('Telegram posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || 'Failed to post to Telegram'
      };
    }
  }

  async testConnection() {
    if (!this.botToken) {
      return { success: false, error: 'Missing bot token' };
    }

    try {
      const response = await axios.get(`${this.baseURL}/getMe`);
      
      return {
        success: true,
        botInfo: response.data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.description || 'Connection test failed'
      };
    }
  }

  formatMessage(message) {
    // Convert basic formatting to Telegram HTML
    return message
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
      .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
  }
}

module.exports = TelegramAPI;
