const axios = require('axios');

class WhatsAppAPI {
  constructor(accessToken, phoneNumberId, broadcastListId = null) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.broadcastListId = broadcastListId; // Optional: for broadcasting to multiple contacts
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async publishToStatus(message) {
    // WhatsApp Status API is limited and requires special permissions
    // For now, we'll simulate or send to a broadcast list
    
    if (!this.accessToken || !this.phoneNumberId) {
      console.log('WhatsApp API - Simulated posting (no credentials provided)');
      console.log('Message:', message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 900));
      
      return {
        success: true,
        messageId: `wa_sim_${Date.now()}`,
        message: 'Posted successfully to WhatsApp (simulated)'
      };
    }

    // Note: WhatsApp doesn't have public channels like Telegram
    // This would typically send to a broadcast list or individual contacts
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.broadcastListId || 'broadcast_list_id',
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Sent successfully via WhatsApp'
      };
    } catch (error) {
      console.error('WhatsApp posting error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to send via WhatsApp'
      };
    }
  }

  async sendToContact(phoneNumber, message) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`WhatsApp API - Simulated message to ${phoneNumber} (no credentials provided)`);
      return {
        success: true,
        messageId: `wa_contact_sim_${Date.now()}`,
        message: 'Message sent successfully via WhatsApp (simulated)'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Message sent successfully via WhatsApp'
      };
    } catch (error) {
      console.error('WhatsApp message error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to send message via WhatsApp'
      };
    }
  }

  async testConnection() {
    if (!this.accessToken || !this.phoneNumberId) {
      return { success: false, error: 'Missing credentials' };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.phoneNumberId}?fields=verified_name,display_phone_number`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      return {
        success: true,
        phoneInfo: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Connection test failed'
      };
    }
  }

  formatMessage(message) {
    // WhatsApp supports basic formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/__(.*?)__/g, '_$1_') // Italic
      .replace(/~~(.*?)~~/g, '~$1~') // Strikethrough
      .replace(/```(.*?)```/g, '```$1```'); // Code
  }
}

module.exports = WhatsAppAPI;
