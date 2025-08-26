import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Banknote,
  RefreshCw,
  TrendingUp,
  Clock,
  TrendingDown,
  CircleDollarSign,
  Coins
} from 'lucide-react';
import Logo from '../Logo.png';

const UserPage = () => {
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'شركة عرنوس للصرافة',
    companyNameEn: 'Arnous Exchange Company',
    address: 'دمشق - شارع بغداد - عين الكرش  = ',
    phone: '011 2322767 , 011 2322702',
    mobile: '+963966106106',
    email: 'arnous.establishment@hotmail.com',
    website: 'https://arnous-production.up.railway.app',
    workingHours: {
      ar: 'من السبت إلى الخميس: 9:00 ص - 9:00 م'
    },
    services: {
      ar: [
        'صرافة العملات الأجنبية',
        'تحويلات مالية داخلية وخارجية',
        'شام كاش خدمات الدفع الإلكتروني',
        'استشارات مالية'
      ]
    },
    socialMedia: {
      facebook: {
        name: 'Facebook',
        url: 'https://facebook.com/arnous.exchange'
      },
      instagram: {
        name: 'Instagram',
        url: 'https://instagram.com/arnous.exchange'
      },
      telegram: {
        name: 'Telegram',
        url: 'https://t.me/arnous_exchange'
      },
      whatsapp: {
        name: 'WhatsApp',
        url: 'https://wa.me/96366106106'
      }
    }
  });
  const [advice, setAdvice] = useState([]);
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  const [notification, setNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const currencyInfo = {
    USD: { 
      name: 'US Dollar', 
      icon: DollarSign, 
      flag: '🇺🇸',
      color: '#22c55e',
      description: 'United States Dollar'
    },
    EUR: { 
      name: 'Euro', 
      icon: Euro, 
      flag: '🇪🇺',
      color: '#3b82f6',
      description: 'European Union Euro'
    },
    GBP: { 
      name: 'British Pound', 
      icon: PoundSterling, 
      flag: '🇬🇧',
      color: '#8b5cf6',
      description: 'British Pound Sterling'
    },
    TRY: { 
      name: 'Turkish Lira', 
      icon: Banknote, 
      flag: '🇹🇷',
      color: '#f59e0b',
      description: 'Turkish Lira'
    },
    JPY: { 
      name: 'Japanese Yen', 
      icon: CircleDollarSign, 
      flag: '🇯🇵',
      color: '#dc2626',
      description: 'Japanese Yen'
    },
    SAR: { 
      name: 'Saudi Riyal', 
      icon: Coins, 
      flag: '🇸🇦',
      color: '#059669',
      description: 'Saudi Riyal'
    },
    JOD: { 
      name: 'Jordanian Dinar', 
      icon: Coins, 
      flag: '🇯🇴',
      color: '#7c3aed',
      description: 'Jordanian Dinar'
    },
    KWD: { 
      name: 'Kuwaiti Dinar', 
      icon: Coins, 
      flag: '🇰🇼',
      color: '#ea580c',
      description: 'Kuwaiti Dinar'
    }
  };

      const fetchAdvice = async () => {
      try {
        const response = await axios.get('/api/advice?limit=5');
        setAdvice(response.data.advice || []);
      } catch (error) {
        console.error('Error fetching advice:', error);
        setAdvice([]); // Set empty array on error
      } finally {
        setLoadingAdvice(false);
      }
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching currency data...');
        const response = await axios.get('/api/currencies');
        console.log('📊 Received currency data:', response.data.currencies);
        setCurrencies(response.data.currencies);
        setLastUpdate(new Date().toISOString());
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching currencies:', error);
        setLoading(false);
      }
    };

    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get('/api/company/info');
        console.log('Company info response:', response.data);
        // Update with server data if available
        if (response.data.companyInfo) {
          setCompanyInfo(response.data.companyInfo);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Keep default company info if API fails - no need to update since we have defaults
        console.log('Using default company information');
      }
    };

    fetchData();
    fetchCompanyInfo();
    fetchAdvice();
    
    // Initialize socket connection
    const newSocket = io(window.location.origin);
    
    newSocket.on('connect', () => {
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    
    newSocket.on('currencyUpdate', (updatedCurrencies) => {
      console.log('Received real-time currency update:', updatedCurrencies);
      
      // Handle different update formats
      if (updatedCurrencies && typeof updatedCurrencies === 'object') {
        if (updatedCurrencies.deleted) {
          // Currency was deleted, refresh all data
          fetchData();
        } else if (Array.isArray(updatedCurrencies)) {
          // Array of currencies received
          setCurrencies(updatedCurrencies);
          setLastUpdate(new Date().toISOString());
        } else {
          // Object with currency codes as keys
      setCurrencies(updatedCurrencies);
      setLastUpdate(new Date().toISOString());
        }
        
        showNotification('Rates updated in real-time!', 'success');
      }
    });
    
    newSocket.on('adviceUpdate', (data) => {
      console.log('Received advice update:', data);
      fetchAdvice(); // Refresh advice list
    });
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    // Manual refresh function
    const manualRefresh = () => {
      fetchData();
      showNotification('Rates refreshed manually!', 'success');
    };
    
    // Expose manual refresh globally for admin updates
    window.refreshCurrencyRates = manualRefresh;
    
    // Refresh when page becomes visible (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
        showNotification('Rates refreshed on page focus!', 'success');
      }
    };
    
    // Check for updates every 10 seconds (more frequent than auto-refresh)
    const updateCheckInterval = setInterval(() => {
      // Only check if we're not already loading
      if (!loading) {
        fetchData();
      }
    }, 10000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      newSocket.close();
      clearInterval(interval);
      clearInterval(updateCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      delete window.refreshCurrencyRates;
    };
  }, []);



  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.05); }
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3); }
      50% { box-shadow: 0 12px 40px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.5); }
    }
  `;
  document.head.appendChild(style);

  return (
    <div className="container" style={{
      padding: window.innerWidth <= 768 ? '16px' : '24px',
      maxWidth: '100%'
    }}>
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: window.innerWidth <= 768 ? '10px' : '20px',
          left: window.innerWidth <= 768 ? '10px' : 'auto',
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: window.innerWidth <= 768 ? '10px 16px' : '12px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem'
        }}>
          {notification.type === 'success' ? '✅' : '❌'}
          {notification.text}
        </div>
      )}
      <div className="card">
        <div className="header" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
          padding: window.innerWidth <= 768 ? '20px' : '32px',
          marginBottom: window.innerWidth <= 768 ? '20px' : '30px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/svg%3E")',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="logo-section" style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '24px' }}>
              <div className="logo-container" style={{ 
                marginBottom: window.innerWidth <= 768 ? '12px' : '16px',
                position: 'relative'
              }}>
                <img src={Logo} alt="Arnous Logo" className="main-logo" style={{ 
                  width: window.innerWidth <= 768 ? '100px' : '120px', 
                  height: window.innerWidth <= 768 ? '100px' : '120px', 
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 215, 0, 0.8)',
                  boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)',
                  filter: 'brightness(1.3) saturate(1.4) hue-rotate(10deg)',
                  transition: 'all 0.3s ease',
                  animation: 'glow 3s ease-in-out infinite'
                }} />
                {/* Golden glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: window.innerWidth <= 768 ? '130px' : '150px',
                  height: window.innerWidth <= 768 ? '130px' : '150px',
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                  zIndex: -1
                }}></div>
              </div>
              <div className="title-section">
                <h1 className="main-title" style={{ 
                  fontSize: window.innerWidth <= 768 ? '1.8rem' : '2.5rem', 
                  fontWeight: '800', 
                  margin: '0 0 16px 0',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  padding: window.innerWidth <= 768 ? '0 8px' : '0'
                }}>
                  💱 أسعار الصرف اليوم
                </h1>
                <div style={{
                  width: window.innerWidth <= 768 ? '60px' : '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                  margin: '0 auto',
                  borderRadius: '2px'
                }}></div>
              </div>
            </div>
            
            <p className="subtitle" style={{ 
              fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem', 
              margin: '0 0 24px 0',
              opacity: 0.9,
              fontWeight: '500',
              padding: window.innerWidth <= 768 ? '0 16px' : '0'
            }}>
              أحدث أسعار صرف العملات مقابل الليرة السورية
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: window.innerWidth <= 768 ? '12px' : '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: window.innerWidth <= 768 ? '10px 16px' : '12px 20px',
                borderRadius: '25px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontSize: window.innerWidth <= 768 ? '0.85rem' : '1rem'
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%',
                  background: connected ? '#10b981' : '#ef4444',
                  boxShadow: connected ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                }}></div>
                <span style={{ fontWeight: '600' }}>
                  {connected ? 'متصل - تحديث فوري' : 'غير متصل'}
                </span>
              </div>
              
              {lastUpdate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: window.innerWidth <= 768 ? '10px 16px' : '12px 20px',
                  borderRadius: '25px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: window.innerWidth <= 768 ? '0.85rem' : '1rem'
                }}>
                  <Clock size={window.innerWidth <= 768 ? 16 : 18} />
                  <span style={{ fontWeight: '600' }}>
                    آخر تحديث: {formatDate(lastUpdate)}
                  </span>
                </div>
              )}
            </div>

            {/* Currency count badge */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: window.innerWidth <= 768 ? '6px 12px' : '8px 16px',
              borderRadius: '20px',
              fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              marginBottom: window.innerWidth <= 768 ? '8px' : '0'
            }}>
              📊 {Object.keys(currencies).length} عملة متاحة
            </div>
            
            {/* Manual refresh button */}
            <button
              onClick={() => {
                setRefreshing(true);
                const fetchData = async () => {
                  try {
                    const response = await axios.get('/api/currencies');
                    setCurrencies(response.data.currencies);
                    setLastUpdate(new Date().toISOString());
                    showNotification('Rates refreshed manually!', 'success');
                  } catch (error) {
                    console.error('Error fetching currencies:', error);
                    showNotification('Error refreshing rates', 'error');
                  } finally {
                    setRefreshing(false);
                  }
                };
                fetchData();
              }}
              disabled={refreshing}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: window.innerWidth <= 768 ? '6px 12px' : '8px 16px',
                borderRadius: '20px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                marginTop: '10px',
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              {refreshing ? '⏳ جاري التحديث...' : '🔄 تحديث فوري'}
            </button>
          </div>
        </div>

                  <div className="currency-grid" style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: window.innerWidth <= 768 ? '16px' : '24px',
            marginTop: window.innerWidth <= 768 ? '20px' : '30px',
            padding: window.innerWidth <= 768 ? '0 8px' : '0'
          }}>
          {Object.keys(currencies).map(currency => {
            const info = currencyInfo[currency];
            const data = currencies[currency];
            const Icon = info.icon;
            
            return (
              <div 
                key={currency} 
                className="currency-item"
                style={{ 
                  borderLeftColor: info.color,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                  padding: window.innerWidth <= 768 ? '16px' : '24px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Background accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${info.color} 0%, ${info.color}80 100%)`,
                  borderRadius: '16px 16px 0 0'
                }} />
                
                <div className="currency-label" style={{ 
                  marginBottom: window.innerWidth <= 768 ? '16px' : '20px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: window.innerWidth <= 768 ? '8px' : '12px', 
                    marginBottom: '8px',
                    flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                    textAlign: window.innerWidth <= 480 ? 'center' : 'left'
                  }}>
                    <span className="currency-flag" style={{ 
                      fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem' 
                    }}>{info.flag}</span>
                    <Icon size={window.innerWidth <= 768 ? 24 : 28} style={{ color: info.color }} />
                    <div>
                      <div className="currency-name" style={{ 
                        fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.25rem', 
                        fontWeight: '700', 
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}>
                        {info.name}
                      </div>
                      <div style={{ 
                        fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem', 
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        {info.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Currency code badge */}
                  <div style={{
                    display: 'inline-block',
                    background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}80 100%)`,
                    color: 'white',
                    padding: window.innerWidth <= 768 ? '4px 8px' : '6px 12px',
                    borderRadius: '20px',
                    fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.85rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    minWidth: window.innerWidth <= 768 ? '50px' : '60px',
                    marginBottom: window.innerWidth <= 480 ? '8px' : '0'
                  }}>
                    {currency}
                  </div>
                </div>
                
                <div className="currency-rates" style={{ 
                  marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '1fr 1fr',
                  gap: window.innerWidth <= 480 ? '12px' : '16px'
                }}>
                  <div className="rate-item" style={{ 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    padding: window.innerWidth <= 768 ? '12px' : '16px',
                    borderRadius: '12px',
                    marginBottom: window.innerWidth <= 480 ? '0' : '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: '#16a34a',
                      marginBottom: '8px',
                      justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-start'
                    }}>
                      <TrendingUp size={window.innerWidth <= 768 ? 16 : 18} />
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.95rem' 
                      }}>سعر الشراء</span>
                    </div>
                    <div className="rate-value" style={{
                      fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem',
                      fontWeight: '700',
                      color: '#15803d',
                      textAlign: 'center'
                    }}>
                      {formatNumber(data.buyRate)} <span style={{ 
                        fontSize: window.innerWidth <= 768 ? '0.9rem' : '1.1rem', 
                        color: '#16a34a' 
                      }}>ل.س</span>
                    </div>
                  </div>
                  
                  <div className="rate-item" style={{ 
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    padding: window.innerWidth <= 768 ? '12px' : '16px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: '#dc2626',
                      marginBottom: '8px',
                      justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-start'
                    }}>
                      <TrendingDown size={window.innerWidth <= 768 ? 16 : 18} />
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.95rem' 
                      }}>سعر البيع</span>
                    </div>
                    <div className="rate-value" style={{
                      fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem',
                      fontWeight: '700',
                      color: '#b91c1c',
                      textAlign: 'center'
                    }}>
                      {formatNumber(data.sellRate)} <span style={{ 
                        fontSize: window.innerWidth <= 768 ? '0.9rem' : '1.1rem', 
                        color: '#dc2626' 
                      }}>ل.س</span>
                    </div>
                  </div>
                </div>
                
                {/* Spread information */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid #cbd5e1'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                    flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                    gap: window.innerWidth <= 480 ? '8px' : '0'
                  }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>الفرق:</span>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '600',
                      background: 'white',
                      padding: window.innerWidth <= 768 ? '3px 6px' : '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {formatNumber(data.sellRate - data.buyRate)} ل.س
                    </span>
                  </div>
                </div>
                
                <div className="last-updated" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.85rem',
                  color: '#64748b',
                  justifyContent: 'center',
                  padding: window.innerWidth <= 768 ? '10px' : '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                  textAlign: 'center'
                }}>
                  <Clock size={window.innerWidth <= 768 ? 12 : 14} />
                  آخر تحديث: {formatDate(data.lastUpdated)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Currency Summary Section */}
        <div className="card" style={{ 
          marginTop: window.innerWidth <= 768 ? '20px' : '30px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
          padding: window.innerWidth <= 768 ? '20px' : '24px',
          border: '1px solid #cbd5e1'
        }}>
          <h3 style={{ 
            color: '#1e293b', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: window.innerWidth <= 768 ? '1.3rem' : '1.5rem',
            fontWeight: '700'
          }}>
            📊 ملخص العملات
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: window.innerWidth <= 768 ? '16px' : '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: window.innerWidth <= 768 ? '16px' : '20px',
              borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', marginBottom: '8px' }}>💱</div>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {Object.keys(currencies).length}
              </div>
              <div style={{ color: '#64748b', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}>عملة متاحة</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: window.innerWidth <= 768 ? '16px' : '20px',
              borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', marginBottom: '8px' }}>🔄</div>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {lastUpdate ? formatDate(lastUpdate).split(' ')[0] : 'N/A'}
              </div>
              <div style={{ color: '#64748b', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}>آخر تحديث</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: window.innerWidth <= 768 ? '16px' : '20px',
              borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', marginBottom: '8px' }}>📡</div>
              <div style={{ 
                fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem', 
                fontWeight: '700', 
                color: connected ? '#10b981' : '#ef4444',
                marginBottom: '4px'
              }}>
                {connected ? 'متصل' : 'غير متصل'}
              </div>
              <div style={{ color: '#64748b', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}>حالة الاتصال</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: window.innerWidth <= 768 ? '16px' : '20px',
              borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', marginBottom: '8px' }}>⏰</div>
              <div style={{ fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                30 ث
              </div>
              <div style={{ color: '#64748b', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}>معدل التحديث</div>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            padding: window.innerWidth <= 768 ? '16px' : '20px',
            borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              marginBottom: '16px', 
              textAlign: 'center',
              fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.2rem',
              fontWeight: '600'
            }}>
              🎯 العملات المتاحة
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {Object.keys(currencies).map(currency => {
                const info = currencyInfo[currency];
                return (
                  <div key={currency} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}80 100%)`,
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {currency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Company Information Section */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '20px', textAlign: 'center' }}>
            🏢 معلومات الشركة
          </h3>
          {companyInfo ? (
            <>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '25px',
                marginBottom: '20px'
              }}>
                {/* Contact Information */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '15px',
                padding: '25px',
                color: 'white'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>📞 معلومات التواصل</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>📍 العنوان:</span>
                    <span>{companyInfo.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>📱 الجوال:</span>
                    <a href={`tel:${companyInfo.mobile}`} style={{ color: 'white', textDecoration: 'none' }}>
                      {companyInfo.mobile}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>☎️ الهاتف:</span>
                    <a href={`tel:${companyInfo.phone}`} style={{ color: 'white', textDecoration: 'none' }}>
                      {companyInfo.phone}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>📧 البريد:</span>
                    <a href={`mailto:${companyInfo.email}`} style={{ color: 'white', textDecoration: 'none' }}>
                      {companyInfo.email}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>🌐 الموقع:</span>
                    <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                      {companyInfo.website}
                    </a>
                  </div>
                </div>
              </div>

              {/* Working Hours & Services */}
              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '15px',
                padding: '25px',
                color: 'white'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>🕒 ساعات العمل والخدمات</h4>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>⏰ ساعات العمل:</p>
                  <p style={{ margin: 0 }}>{companyInfo.workingHours.ar}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>🛎️ خدماتنا:</p>
                  <ul style={{ margin: 0, paddingRight: '20px' }}>
                    {companyInfo.services.ar.map((service, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>


            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '15px' }}>🔗 تابعونا على</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {Object.entries(companyInfo.socialMedia).map(([platform, info]) => (
                  <a
                    key={platform}
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '25px',
                      textDecoration: 'none',
                      color: 'white',
                      fontWeight: 'bold',
                      background: platform === 'facebook' ? '#1877f2' :
                                 platform === 'instagram' ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' :
                                 platform === 'telegram' ? '#0088cc' :
                                 platform === 'whatsapp' ? '#25D366' : '#333',
                      transition: 'transform 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {platform === 'facebook' && '📘'}
                    {platform === 'instagram' && '📷'}
                    {platform === 'telegram' && '📨'}
                    {platform === 'whatsapp' && '💬'}
                    {info.name}
                  </a>
                ))}
              </div>
            </div>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '15px',
              border: '2px dashed #e2e8f0'
            }}>
              <p style={{ color: '#718096', fontSize: '1.1rem' }}>🔄 جاري تحميل معلومات الشركة...</p>
            </div>
          )}
        </div>

        {/* Advice and Predictions Section */}
        <div className="card" style={{ 
          marginTop: window.innerWidth <= 768 ? '20px' : '30px',
          padding: window.innerWidth <= 768 ? '20px' : '30px'
        }}>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: window.innerWidth <= 768 ? '1.4rem' : '1.6rem'
          }}>
            🔮 توقعات وتحليلات أرنوس
          </h3>
          <p style={{ 
            color: '#718096', 
            textAlign: 'center', 
            marginBottom: '25px',
            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
            lineHeight: '1.6',
            padding: window.innerWidth <= 768 ? '0 8px' : '0'
          }}>
            آراء وتوقعات خبراء أرنوس حول أسواق العملات والاقتصاد المحلي والعالمي
          </p>
          
          {loadingAdvice ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <RefreshCw className="animate-spin" size={32} style={{ color: '#3b82f6' }} />
              <p style={{ marginTop: '15px', color: '#718096', fontSize: '1.1rem' }}>جاري تحميل التوقعات...</p>
            </div>
          ) : advice.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              color: 'white'
            }}>
              <p style={{ fontSize: '1.2rem', margin: 0 }}>🔍 لا توجد توقعات متاحة حالياً</p>
              <p style={{ fontSize: '1rem', margin: '10px 0 0 0', opacity: 0.9 }}>ترقبوا التحديثات قريباً</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {advice.map(item => (
                <div
                  key={item._id}
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '15px',
                    padding: '25px',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1.3rem', 
                        fontWeight: 'bold'
                      }}>
                        {item.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}>
                          {item.type === 'market_prediction' ? '🔮 توقع السوق' :
                           item.type === 'financial_advice' ? '💰 نصيحة مالية' :
                           item.type === 'currency_outlook' ? '📊 نظرة عملات' : '📋 عام'}
                        </span>
                        <span style={{
                          background: item.priority === 'urgent' ? 'rgba(239, 68, 68, 0.8)' :
                                     item.priority === 'high' ? 'rgba(249, 115, 22, 0.8)' :
                                     item.priority === 'medium' ? 'rgba(234, 179, 8, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}>
                          {item.priority === 'urgent' ? '🔴 عاجل' :
                           item.priority === 'high' ? '🟠 مهم' :
                           item.priority === 'medium' ? '🟡 متوسط' : '🟢 عادي'}
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ 
                      fontSize: '1.1rem', 
                      lineHeight: '1.6', 
                      margin: '0 0 15px 0',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {item.content}
                    </p>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '15px',
                      fontSize: '0.95rem',
                      opacity: 0.9
                    }}>
                      <span>📅 {new Date(item.publishDate || item.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                      <span>👤 {item.author?.username || 'فريق أرنوس'}</span>
                      {item.metadata?.viewCount > 0 && (
                        <span>👁️ {item.metadata.viewCount} مشاهدة</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Background pattern */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.05"%3E%3Cpath d="M20 20c0 11.046-8.954 20-20 20v-20h20z"/%3E%3C/g%3E%3C/svg%3E")',
                    transform: 'rotate(45deg)',
                    zIndex: 0
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="card" style={{ 
          marginTop: window.innerWidth <= 768 ? '20px' : '30px', 
          textAlign: 'center',
          padding: window.innerWidth <= 768 ? '20px' : '30px'
        }}>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '15px',
            fontSize: window.innerWidth <= 768 ? '1.3rem' : '1.5rem'
          }}>معلومات إضافية</h3>
          <p style={{ 
            color: '#718096', 
            lineHeight: '1.6',
            fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
            padding: window.innerWidth <= 768 ? '0 8px' : '0'
          }}>
            تُحدث أسعار الصرف بشكل دوري من قبل الإدارة. الأسعار المعروضة هي أسعار استرشادية وقد تختلف قليلاً عن أسعار السوق الفعلية.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              color: 'white',
              padding: window.innerWidth <= 768 ? '12px 24px' : '16px 32px',
              borderRadius: '12px',
              fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px auto 0',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              width: window.innerWidth <= 480 ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 15px -3px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
            }}
          >
            <RefreshCw size={window.innerWidth <= 768 ? 18 : 20} />
            تحديث الأسعار
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;