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
  Eye,
  EyeOff,
  Database
} from 'lucide-react';
import Logo from '../Logo.png';

const ProtectedAdminDashboard = ({ onLogout }) => {
  const [currencies, setCurrencies] = useState({
    USD: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    EUR: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    GBP: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    TRY: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    JPY: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    SAR: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    JOD: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true },
    KWD: { buyRate: '', sellRate: '', lastUpdated: null, isVisible: true }
  });
  
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState({});
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [selectedPlatform, setSelectedPlatform] = useState('general');
  const [notification, setNotification] = useState(null);
  const [connected, setConnected] = useState(false);

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
    JPY: { name: 'Japanese Yen', icon: Banknote, flag: '🇯🇵' },
    SAR: { name: 'Saudi Riyal', icon: Banknote, flag: '🇸🇦' },
    JOD: { name: 'Jordanian Dinar', icon: Banknote, flag: '🇯🇴' },
    KWD: { name: 'Kuwaiti Dinar', icon: Banknote, flag: '🇰🇼' }
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
        // Use admin endpoint to get all currencies (including hidden ones)
        const response = await axios.get('/api/admin/currencies', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedCurrencies = response.data.currencies;
        
        if (fetchedCurrencies) {
          setCurrencies(prev => ({
            ...prev,
            ...Object.keys(fetchedCurrencies).reduce((acc, key) => {
              acc[key] = {
                buyRate: fetchedCurrencies[key].buyRate?.toString() || '',
                sellRate: fetchedCurrencies[key].sellRate?.toString() || '',
                lastUpdated: fetchedCurrencies[key].lastUpdated,
                isVisible: fetchedCurrencies[key].isVisible
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
      // Update local currency state with the new data
      setCurrencies(prev => ({
        ...prev,
        ...Object.keys(updatedCurrencies).reduce((acc, key) => {
          acc[key] = {
            buyRate: updatedCurrencies[key].buyRate?.toString() || '',
            sellRate: updatedCurrencies[key].sellRate?.toString() || '',
            lastUpdated: updatedCurrencies[key].lastUpdated,
            isVisible: updatedCurrencies[key].isVisible !== undefined ? updatedCurrencies[key].isVisible : prev[key]?.isVisible
          };
          return acc;
        }, {})
      }));
    });

    newSocket.on('adminCurrencyUpdate', (updatedCurrencies) => {
      console.log('Received admin currency update:', updatedCurrencies);
      // Update local currency state with the new data (includes visibility info)
      setCurrencies(prev => ({
        ...prev,
        ...Object.keys(updatedCurrencies).reduce((acc, key) => {
          acc[key] = {
            buyRate: updatedCurrencies[key].buyRate?.toString() || '',
            sellRate: updatedCurrencies[key].sellRate?.toString() || '',
            lastUpdated: updatedCurrencies[key].lastUpdated,
            isVisible: updatedCurrencies[key].isVisible
          };
          return acc;
        }, {})
      }));
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

  // Currency visibility toggle function
  const toggleCurrencyVisibility = async (currencyCode) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(`/api/currencies/${currencyCode}/visibility`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification(response.data.message, 'success');
    } catch (error) {
      console.error('Error toggling currency visibility:', error);
      showNotification('Error toggling currency visibility', 'error');
    }
  };

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
    // Ensure the value is a valid number string or empty
    const sanitizedValue = value === '' ? '' : value;
    
    setCurrencies(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [field]: sanitizedValue
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

      // Validate and prepare currency data
      const currencyData = {};
      const validationErrors = [];

      Object.keys(currencies).forEach(key => {
        const currency = currencies[key];
        
        // Skip if both rates are empty
        if (!currency.buyRate && !currency.sellRate) {
          return;
        }
        
        // Check if both rates are provided
        if (!currency.buyRate || !currency.sellRate) {
          validationErrors.push(`${key}: Both buy and sell rates are required`);
          return;
        }
        
        const buyRate = parseFloat(currency.buyRate);
        const sellRate = parseFloat(currency.sellRate);
        
        // Validate numbers
        if (isNaN(buyRate) || isNaN(sellRate)) {
          validationErrors.push(`${key}: Rates must be valid numbers`);
          return;
        }
        
        // Validate positive values
        if (buyRate <= 0 || sellRate <= 0) {
          validationErrors.push(`${key}: Rates must be positive numbers`);
          return;
        }
        
        // Validate sell rate > buy rate
        if (sellRate <= buyRate) {
          validationErrors.push(`${key}: Sell rate (${sellRate}) must be greater than buy rate (${buyRate})`);
          return;
        }
        
        currencyData[key] = { buyRate, sellRate };
      });

      // Show validation errors if any
      if (validationErrors.length > 0) {
        showNotification(`Validation errors: ${validationErrors.join(', ')}`, 'error');
        setLoading(false);
        return;
      }

      // Check if there's any data to update
      if (Object.keys(currencyData).length === 0) {
        showNotification('Please enter currency rates to update', 'error');
        setLoading(false);
        return;
      }

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
      
      // Show specific error message from server
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error updating currency rates';
      
      showNotification(errorMessage, 'error');
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
      
      // Copy message to clipboard first
      await copyToClipboard(messageToUse);
      
      // Show success notification
      showNotification(`Content copied! Redirecting to ${platform}...`, 'success');
      
      // Direct redirect to platform URLs
      const platformUrls = {
        facebook: 'https://www.facebook.com/arnous.ex/',
        whatsapp: 'https://whatsapp.com/channel/0029Vb6LYzG3GJP3Ait6uc1e',
        instagram: 'https://www.instagram.com/',
        telegram: 'https://web.telegram.org/'
      };
      
      // Small delay to show the notification, then redirect
      setTimeout(() => {
        window.open(platformUrls[platform], '_blank');
      }, 1000);
      
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
          <Link to="/admin/database" className="nav-link">
            <Database size={16} />
            Database
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
          {Object.keys(currencies)
            .sort((a, b) => {
              // USD first, then alphabetical
              if (a === 'USD') return -1;
              if (b === 'USD') return 1;
              return a.localeCompare(b);
            })
            .map(currency => {
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
                      step="0.01"
                      min="0"
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
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="visibility-control" style={{ marginTop: '10px' }}>
                  <button
                    className={`btn ${currencies[currency].isVisible ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleCurrencyVisibility(currency)}
                    style={{ 
                      fontSize: '12px', 
                      padding: '5px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {currencies[currency].isVisible ? (
                      <>
                        <EyeOff size={14} />
                        Hide from Users
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        Show to Users
                      </>
                    )}
                  </button>
                  <span style={{ 
                    fontSize: '11px', 
                    color: currencies[currency].isVisible ? '#22c55e' : '#ef4444',
                    marginLeft: '10px',
                    fontWeight: 'bold'
                  }}>
                    {currencies[currency].isVisible ? 'Visible to Public' : 'Hidden from Public'}
                  </span>
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
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong>Message Preview:</strong>
              <button
                onClick={() => copyToClipboard(message)}
                className="btn btn-secondary"
                style={{ 
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  minWidth: 'auto'
                }}
              >
                📋 Copy Message
              </button>
            </div>
            <div className="message-preview">
              {message}
            </div>
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
                  {isPublishing ? 'Copying & Redirecting...' : `Copy & Go to ${platform.label}`}
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
