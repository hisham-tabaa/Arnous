import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Banknote,
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  LogOut,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  Yen,
  Coins
} from 'lucide-react';
import Logo from '../Logo.png';

const ProtectedAdminDashboard = ({ onLogout }) => {
  const [currencies, setCurrencies] = useState({
    USD: { buyRate: '', sellRate: '', lastUpdated: null },
    EUR: { buyRate: '', sellRate: '', lastUpdated: null },
    GBP: { buyRate: '', sellRate: '', lastUpdated: null },
    TRY: { buyRate: '', sellRate: '', lastUpdated: null },
    JPY: { buyRate: '', sellRate: '', lastUpdated: null },
    SAR: { buyRate: '', sellRate: '', lastUpdated: null },
    JOD: { buyRate: '', sellRate: '', lastUpdated: null },
    KWD: { buyRate: '', sellRate: '', lastUpdated: null }
  });
  
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState({});
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [selectedPlatform, setSelectedPlatform] = useState('general');
  const [notification, setNotification] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socialModal, setSocialModal] = useState(null);
  const [adviceForm, setAdviceForm] = useState({
    title: '',
    content: '',
    type: 'market_prediction',
    priority: 'medium',
    isActive: true
  });
  const [adviceList, setAdviceList] = useState([]);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAdviceForm, setShowAdviceForm] = useState(false);
  const navigate = useNavigate();

  const currencyInfo = {
    USD: { name: 'US Dollar', icon: DollarSign, flag: '🇺🇸' },
    EUR: { name: 'Euro', icon: Euro, flag: '🇪🇺' },
    GBP: { name: 'British Pound', icon: PoundSterling, flag: '🇬🇧' },
    TRY: { name: 'Turkish Lira', icon: Banknote, flag: '🇹🇷' },
    JPY: { name: 'Japanese Yen', icon: Yen, flag: '🇯🇵' },
    SAR: { name: 'Saudi Riyal', icon: Coins, flag: '🇸🇦' },
    JOD: { name: 'Jordanian Dinar', icon: Coins, flag: '🇯🇴' },
    KWD: { name: 'Kuwaiti Dinar', icon: Coins, flag: '🇰🇼' }
  };

  const socialPlatforms = [
    { name: 'facebook', label: 'Facebook', icon: Facebook, color: 'btn-facebook' },
    { name: 'instagram', label: 'Instagram', icon: Instagram, color: 'btn-instagram' },
    { name: 'telegram', label: 'Telegram', icon: MessageCircle, color: 'btn-telegram' },
    { name: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'btn-whatsapp' }
  ];

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    if (onLogout) onLogout();
    navigate('/admin/login');
  }, [navigate, onLogout]);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const showSocialModal = (data) => {
    setSocialModal(data);
  };

  const closeSocialModal = () => {
    setSocialModal(null);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Content copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showNotification('Failed to copy content', 'error');
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        // The currencies endpoint is public, so no auth header needed for GET
        const response = await axios.get('/api/currencies');
        const fetchedCurrencies = response.data.currencies;
        
        if (fetchedCurrencies) {
          setCurrencies(prev => ({
            ...prev,
            ...Object.keys(fetchedCurrencies).reduce((acc, key) => {
              acc[key] = {
                buyRate: fetchedCurrencies[key].buyRate?.toString() || '',
                sellRate: fetchedCurrencies[key].sellRate?.toString() || '',
                lastUpdated: fetchedCurrencies[key].lastUpdated
              };
              return acc;
            }, {})
          }));
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        showNotification('Error fetching currency data', 'error');
      }
    };

    const generateMsg = async (template = selectedTemplate, platform = selectedPlatform) => {
      try {
        const response = await axios.post('/api/generate-message', {
          template,
          platform
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(response.data.message);
      } catch (error) {
        console.error('Error generating message:', error);
        if (error.response?.status === 401) {
          handleLogout();
          return;
        }
        showNotification('Error generating message', 'error');
      }
    };

    // Add a small delay to ensure server is ready
    const initializeData = async () => {
      await fetchData();
      await generateMsg();
      await fetchAdvice();
    };
    
    initializeData();
    
    // Initialize socket connection
    const newSocket = io(window.location.origin, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    
    newSocket.on('currencyUpdate', (updatedCurrencies) => {
      console.log('Received currency update:', updatedCurrencies);
    });
    
    newSocket.on('publishUpdate', (data) => {
      showNotification(`Successfully published to ${data.platform}!`);
    });
    
    newSocket.on('adviceUpdate', (data) => {
      console.log('Received advice update:', data);
      fetchAdvice(); // Refresh advice list
    });
    
    return () => {
      newSocket.close();
    };
  }, [navigate, handleLogout]);

  // Advice management functions
  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/advice?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdviceList(response.data.advice || []);
    } catch (error) {
      console.error('Error fetching advice:', error);
      setAdviceList([]); // Set empty array on error
      showNotification('Error fetching advice', 'error');
    }
    setLoadingAdvice(false);
  };

  const handleAdviceSubmit = async (e) => {
    e.preventDefault();
    if (!adviceForm.title.trim() || !adviceForm.content.trim()) {
      showNotification('Title and content are required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('/api/advice', adviceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Advice created successfully!');
      setAdviceForm({
        title: '',
        content: '',
        type: 'market_prediction',
        priority: 'medium',
        isActive: true
      });
      setShowAdviceForm(false);
      await fetchAdvice();
    } catch (error) {
      console.error('Error creating advice:', error);
      showNotification('Error creating advice', 'error');
    }
  };

  const handleAdviceFormChange = (field, value) => {
    setAdviceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAdviceStatus = async (adviceId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/advice/${adviceId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Advice status updated successfully!');
      await fetchAdvice();
    } catch (error) {
      console.error('Error toggling advice status:', error);
      showNotification('Error updating advice status', 'error');
    }
  };

  const deleteAdvice = async (adviceId) => {
    if (!window.confirm('Are you sure you want to delete this advice?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/advice/${adviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Advice deleted successfully!');
      await fetchAdvice();
    } catch (error) {
      console.error('Error deleting advice:', error);
      showNotification('Error deleting advice', 'error');
    }
  };

  const handleCurrencyChange = (currency, field, value) => {
    setCurrencies(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [field]: value
      }
    }));
  };

  const updateCurrencies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        handleLogout();
        return;
      }

      const currencyData = Object.keys(currencies).reduce((acc, key) => {
        if (currencies[key].buyRate && currencies[key].sellRate) {
          acc[key] = { 
            buyRate: parseFloat(currencies[key].buyRate),
            sellRate: parseFloat(currencies[key].sellRate)
          };
        }
        return acc;
      }, {});

      await axios.post('/api/currencies', 
        { currencies: currencyData },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh data  
      const response = await axios.get('/api/currencies');
      const fetchedCurrencies = response.data.currencies;
      
      if (fetchedCurrencies) {
        setCurrencies(prev => ({
          ...prev,
          ...Object.keys(fetchedCurrencies).reduce((acc, key) => {
            acc[key] = {
              buyRate: fetchedCurrencies[key].buyRate?.toString() || '',
              sellRate: fetchedCurrencies[key].sellRate?.toString() || '',
              lastUpdated: fetchedCurrencies[key].lastUpdated
            };
            return acc;
          }, {})
        }));
      }

      // Regenerate message
      const msgResponse = await axios.post('/api/generate-message', {
        template: selectedTemplate,
        platform: selectedPlatform
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(msgResponse.data.message);
      
      showNotification('Currency rates updated successfully!');
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }
      console.error('Error updating currencies:', error);
      showNotification('Error updating currency rates', 'error');
    }
    setLoading(false);
  };

  // Helper function to generate platform-specific message
  const generatePlatformMessage = async (platform) => {
    const token = localStorage.getItem('adminToken');
    const msgResponse = await axios.post('/api/generate-message', {
      template: selectedTemplate,
      platform: platform
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return msgResponse.data.message;
  };

  const publishToSocial = async (platform) => {
    setPublishing(prev => ({ ...prev, [platform]: true }));
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        handleLogout();
        return;
      }
      
      // For Facebook, use the current message preview instead of generating new one
      const messageToUse = platform === 'facebook' ? message : await generatePlatformMessage(platform);
      
      const response = await axios.post(`/api/publish/${platform}`, 
        { message: messageToUse },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Handle modal response (for all platforms)
      if (response.data.method === 'modal') {
        // Show modal with content and instructions
        showSocialModal({
          ...response.data,
          content: response.data.content || messageToUse
        });
      } else if (response.data.redirectUrl) {
        // Handle Facebook redirect (backward compatibility)
        showSocialModal({
          platform: 'Facebook',
          content: response.data.fallbackContent || messageToUse,
          platformUrl: response.data.redirectUrl,
          method: 'modal',
          instructions: [
            'Copy the content above',
            'Click "Open Facebook" to go to Facebook',
            'Paste the content in Facebook\'s post box',
            'Add any images or additional text if needed',
            'Click "Post" on Facebook to publish'
          ]
        });
      } else {
        showNotification(`Successfully published to ${platform}!`);
      }
    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }
      showNotification(`Error publishing to ${platform}`, 'error');
    }
    
    setPublishing(prev => ({ ...prev, [platform]: false }));
  };

  const adminUser = localStorage.getItem('adminUser') || 'Admin';

  return (
    <div className="container">
      <div className="navigation">
        <div className="nav-logo">
          <img src={Logo} alt="Arnous Logo" />
          <span>Arnous Exchange</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/rates" className="nav-link">
            <Users size={16} />
            User View
          </Link>
          <div className="nav-link" style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            padding: '8px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <UserIcon size={16} />
            {adminUser}
          </div>
          <button 
            onClick={handleLogout}
            className="nav-link"
            style={{ 
              background: 'rgba(220, 38, 38, 0.9)', 
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type === 'error' ? 'error' : ''}`}>
          {notification.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          {notification.text}
        </div>
      )}

      <div className="card">
        <div className="header">
          <div className="logo-section">
            <div className="logo-container">
              <img src={Logo} alt="Arnous Logo" className="main-logo" />
              <div className="logo-glow"></div>
            </div>
            <div className="title-section">
              <h1 className="main-title">💱 Admin Dashboard</h1>
              <div className="title-decoration"></div>
            </div>
          </div>
          <p className="subtitle">Update currency exchange rates and publish to social media</p>
          <div className={`status-indicator ${connected ? 'status-connected' : 'status-disconnected'}`}>
            <div className={connected ? 'text-green-500' : 'text-red-500'}>●</div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="currency-grid">
          {Object.keys(currencies).map(currency => {
            const info = currencyInfo[currency];
            const Icon = info.icon;
            
            return (
              <div key={currency} className="currency-item">
                <div className="currency-label">
                  <span className="currency-flag">{info.flag}</span>
                  <Icon size={20} />
                  <span className="currency-name">{info.name} ({currency})</span>
                </div>
                
                <div className="currency-inputs">
                  <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 'bold' }}>
                      <TrendingUp size={16} />
                      Buy Rate:
                    </label>
                    <input
                      type="number"
                      className="currency-input"
                      placeholder={`Enter ${currency} buy rate in SYP`}
                      value={currencies[currency].buyRate}
                      onChange={(e) => handleCurrencyChange(currency, 'buyRate', e.target.value)}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold' }}>
                      <TrendingDown size={16} />
                      Sell Rate:
                    </label>
                    <input
                      type="number"
                      className="currency-input"
                      placeholder={`Enter ${currency} sell rate in SYP`}
                      value={currencies[currency].sellRate}
                      onChange={(e) => handleCurrencyChange(currency, 'sellRate', e.target.value)}
                    />
                  </div>
                </div>
                
                {currencies[currency].lastUpdated && (
                  <div className="last-updated">
                    Last updated: {new Date(currencies[currency].lastUpdated).toLocaleString('en-US')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          className="btn btn-success"
          onClick={updateCurrencies}
          disabled={loading}
          style={{ width: '100%', marginBottom: '30px' }}
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          {loading ? 'Updating...' : 'Update Exchange Rates'}
        </button>

        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>Social Media Publishing</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                Template Style:
              </label>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="professional">🏦 Professional</option>
                <option value="casual">🔥 Casual</option>
                <option value="minimal">📋 Minimal</option>
                <option value="detailed">📊 Detailed</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                Platform:
              </label>
              <select 
                value={selectedPlatform} 
                onChange={(e) => setSelectedPlatform(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="general">📱 General</option>
                <option value="facebook">📘 Facebook</option>
                <option value="instagram">📷 Instagram</option>
                <option value="telegram">📨 Telegram</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => {
              const token = localStorage.getItem('adminToken');
              if (token) {
                axios.post('/api/generate-message', {
                  template: selectedTemplate,
                  platform: selectedPlatform
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                }).then(response => {
                  setMessage(response.data.message);
                  showNotification('Message updated successfully!');
                }).catch(error => {
                  console.error('Error updating message:', error);
                  showNotification('Error updating message', 'error');
                });
              }
            }}
            className="btn btn-primary"
            style={{ marginBottom: '20px', width: '100%' }}
          >
            🔄 Update Message Preview
          </button>
          
          <div className="message-preview">
            <strong>Message Preview:</strong>
            <br />
            {message}
          </div>

          <div className="social-buttons">
            {socialPlatforms.map(platform => {
              const Icon = platform.icon;
              const isPublishing = publishing[platform.name];
              
              return (
                <button
                  key={platform.name}
                  className={`btn ${platform.color}`}
                  onClick={() => publishToSocial(platform.name)}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Icon size={16} />
                  )}
                  {isPublishing ? 'Publishing...' : `Publish to ${platform.label}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advice Management Section */}
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#2d3748', margin: 0 }}>📝 Market Predictions & Advice</h3>
            <button
              onClick={() => setShowAdviceForm(!showAdviceForm)}
              className="btn btn-primary"
              style={{ minWidth: 'auto' }}
            >
              {showAdviceForm ? '❌ Cancel' : '➕ Add New Advice'}
            </button>
          </div>

          {/* Advice Form */}
          {showAdviceForm && (
            <form onSubmit={handleAdviceSubmit} style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                    Title:
                  </label>
                  <input
                    type="text"
                    value={adviceForm.title}
                    onChange={(e) => handleAdviceFormChange('title', e.target.value)}
                    placeholder="Enter advice title..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                    Type:
                  </label>
                  <select
                    value={adviceForm.type}
                    onChange={(e) => handleAdviceFormChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="market_prediction">🔮 Market Prediction</option>
                    <option value="financial_advice">💰 Financial Advice</option>
                    <option value="currency_outlook">📊 Currency Outlook</option>
                    <option value="general">📋 General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                    Priority:
                  </label>
                  <select
                    value={adviceForm.priority}
                    onChange={(e) => handleAdviceFormChange('priority', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2d3748' }}>
                  Content:
                </label>
                <textarea
                  value={adviceForm.content}
                  onChange={(e) => handleAdviceFormChange('content', e.target.value)}
                  placeholder="Enter your market prediction or advice here..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={adviceForm.isActive}
                  onChange={(e) => handleAdviceFormChange('isActive', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="isActive" style={{ fontWeight: 'bold', color: '#2d3748' }}>
                  ✅ Publish immediately
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-success"
                style={{ width: '100%' }}
              >
                💾 Save Advice
              </button>
            </form>
          )}

          {/* Advice List */}
          <div>
            <h4 style={{ color: '#2d3748', marginBottom: '15px' }}>Recent Advice</h4>
            {loadingAdvice ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <RefreshCw className="animate-spin" size={24} />
                <p style={{ marginTop: '10px', color: '#718096' }}>Loading advice...</p>
              </div>
            ) : adviceList.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#718096',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #e2e8f0'
              }}>
                <p>📝 No advice found. Create your first prediction above!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {adviceList.map(advice => (
                  <div
                    key={advice._id}
                    style={{
                      background: advice.isActive ? '#ffffff' : '#f8f9fa',
                      border: `2px solid ${advice.isActive ? '#e2e8f0' : '#cbd5e0'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      opacity: advice.isActive ? 1 : 0.7
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, color: '#2d3748', fontSize: '1.1rem' }}>
                            {advice.title}
                          </h5>
                          <span style={{
                            background: advice.type === 'market_prediction' ? '#3b82f6' :
                                       advice.type === 'financial_advice' ? '#10b981' :
                                       advice.type === 'currency_outlook' ? '#f59e0b' : '#6b7280',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {advice.type === 'market_prediction' ? '🔮' :
                             advice.type === 'financial_advice' ? '💰' :
                             advice.type === 'currency_outlook' ? '📊' : '📋'} {advice.type.replace('_', ' ')}
                          </span>
                          <span style={{
                            background: advice.priority === 'urgent' ? '#ef4444' :
                                       advice.priority === 'high' ? '#f97316' :
                                       advice.priority === 'medium' ? '#eab308' : '#22c55e',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {advice.priority === 'urgent' ? '🔴' :
                             advice.priority === 'high' ? '🟠' :
                             advice.priority === 'medium' ? '🟡' : '🟢'} {advice.priority}
                          </span>
                        </div>
                        <p style={{ 
                          color: '#4a5568', 
                          lineHeight: '1.5', 
                          margin: '0 0 10px 0',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {advice.content}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9rem', color: '#718096' }}>
                          <span>📅 {new Date(advice.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span>👤 {advice.author?.username || 'Unknown'}</span>
                          {advice.metadata?.viewCount > 0 && (
                            <span>👁️ {advice.metadata.viewCount} views</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '15px' }}>
                        <button
                          onClick={() => toggleAdviceStatus(advice._id)}
                          className={`btn ${advice.isActive ? 'btn-warning' : 'btn-success'}`}
                          style={{ 
                            minWidth: 'auto',
                            padding: '6px 12px',
                            fontSize: '0.85rem'
                          }}
                          title={advice.isActive ? 'Deactivate advice' : 'Activate advice'}
                        >
                          {advice.isActive ? '⏸️ Hide' : '▶️ Show'}
                        </button>
                        <button
                          onClick={() => deleteAdvice(advice._id)}
                          className="btn"
                          style={{ 
                            minWidth: 'auto',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none'
                          }}
                          title="Delete advice"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Media Modal */}
      {socialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                color: socialModal.platform === 'Facebook' ? '#1877f2' : 
                       socialModal.platform === 'Instagram' ? '#E4405F' :
                       socialModal.platform === 'Telegram' ? '#0088cc' :
                       socialModal.platform === 'WhatsApp' ? '#25D366' : '#333',
                margin: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px' 
              }}>
                {socialModal.platform === 'Facebook' && <Facebook size={24} />}
                {socialModal.platform === 'Instagram' && <Instagram size={24} />}
                {socialModal.platform === 'Telegram' && <MessageCircle size={24} />}
                {socialModal.platform === 'WhatsApp' && <Phone size={24} />}
                Post to {socialModal.platform}
              </h2>
              <button 
                onClick={closeSocialModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>📋 Post Content:</h4>
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {socialModal.content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => copyToClipboard(socialModal.content)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                📋 Copy Content
              </button>
              <button
                onClick={() => window.open(socialModal.platformUrl, '_blank')}
                className={`btn ${
                  socialModal.platform === 'Facebook' ? 'btn-facebook' :
                  socialModal.platform === 'Instagram' ? 'btn-instagram' :
                  socialModal.platform === 'Telegram' ? 'btn-telegram' :
                  socialModal.platform === 'WhatsApp' ? 'btn-whatsapp' : 'btn-primary'
                }`}
                style={{ flex: 1 }}
              >
                {socialModal.platform === 'Facebook' && <Facebook size={16} style={{ marginRight: '8px' }} />}
                {socialModal.platform === 'Instagram' && <Instagram size={16} style={{ marginRight: '8px' }} />}
                {socialModal.platform === 'Telegram' && <MessageCircle size={16} style={{ marginRight: '8px' }} />}
                {socialModal.platform === 'WhatsApp' && <Phone size={16} style={{ marginRight: '8px' }} />}
                Open {socialModal.platform}
              </button>
              {socialModal.platform === 'Instagram' && socialModal.alternativeUrl && (
                <button
                  onClick={() => window.open(socialModal.alternativeUrl, '_blank')}
                  className="btn btn-instagram"
                  style={{ flex: 1 }}
                >
                  📸 Instagram Stories
                </button>
              )}
            </div>

            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1565c0'
            }}>
              <strong>📝 Instructions:</strong>
              <ol style={{ margin: '10px 0 0 20px', padding: 0 }}>
                {socialModal.instructions && socialModal.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
              {socialModal.note && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#fff3cd', 
                  color: '#856404',
                  borderRadius: '5px',
                  fontSize: '13px'
                }}>
                  <strong>💡 Note:</strong> {socialModal.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' && <CheckCircle size={16} />}
          {notification.type === 'error' && <AlertCircle size={16} />}
          {notification.type === 'info' && <AlertCircle size={16} />}
          {notification.text}
        </div>
      )}
    </div>
  );
};

export default ProtectedAdminDashboard;
