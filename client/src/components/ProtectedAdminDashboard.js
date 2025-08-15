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
  TrendingDown
} from 'lucide-react';
import Logo from '../Logo.png';

const ProtectedAdminDashboard = ({ onLogout }) => {
  const [currencies, setCurrencies] = useState({
    USD: { buyRate: '', sellRate: '', lastUpdated: null },
    EUR: { buyRate: '', sellRate: '', lastUpdated: null },
    GBP: { buyRate: '', sellRate: '', lastUpdated: null },
    TRY: { buyRate: '', sellRate: '', lastUpdated: null }
  });
  
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState({});
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [selectedPlatform, setSelectedPlatform] = useState('general');
  const [notification, setNotification] = useState(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  const currencyInfo = {
    USD: { name: 'US Dollar', icon: DollarSign, flag: '🇺🇸' },
    EUR: { name: 'Euro', icon: Euro, flag: '🇪🇺' },
    GBP: { name: 'British Pound', icon: PoundSterling, flag: '🇬🇧' },
    TRY: { name: 'Turkish Lira', icon: Banknote, flag: '🇹🇷' }
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
    
    return () => {
      newSocket.close();
    };
  }, [navigate, handleLogout]);

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

  const publishToSocial = async (platform) => {
    setPublishing(prev => ({ ...prev, [platform]: true }));
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        handleLogout();
        return;
      }
      
      // Generate platform-specific message before publishing
      const msgResponse = await axios.post('/api/generate-message', {
        template: selectedTemplate,
        platform: platform
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const platformMessage = msgResponse.data.message;
      
      await axios.post(`/api/publish/${platform}`, 
        { message: platformMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      showNotification(`Successfully published to ${platform}!`);
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
                <option value="modern">✨ Modern</option>
                <option value="elegant">💎 Elegant</option>
                <option value="business">🏢 Business</option>
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
      </div>
    </div>
  );
};

export default ProtectedAdminDashboard;
