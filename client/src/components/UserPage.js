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
        
        // Get currencies from API
        const apiCurrencies = response.data.currencies || {};
        
        // Create a complete currency object with all currencies (including new ones)
        const allCurrencies = {};
        
        // Add all currencies from currencyInfo (including new ones)
        Object.keys(currencyInfo).forEach(code => {
          if (apiCurrencies[code]) {
            // Use API data if available
            allCurrencies[code] = apiCurrencies[code];
          } else {
            // Use default data for new currencies that don't exist in API yet
            allCurrencies[code] = {
              code: code,
              name: currencyInfo[code].name,
              buyRate: 0,
              sellRate: 0,
              isActive: true,
              lastUpdated: new Date().toISOString()
            };
          }
        });
        
        console.log('📊 Final currencies to display:', allCurrencies);
        setCurrencies(allCurrencies);
        setLastUpdate(new Date().toISOString());
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching currencies:', error);
        
        // Fallback: show all currencies with default values
        const fallbackCurrencies = {};
        Object.keys(currencyInfo).forEach(code => {
          fallbackCurrencies[code] = {
            code: code,
            name: currencyInfo[code].name,
            buyRate: 0,
            sellRate: 0,
            isActive: true,
            lastUpdated: new Date().toISOString()
          };
        });
        
        setCurrencies(fallbackCurrencies);
        setLastUpdate(new Date().toISOString());
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

  return (
    <div className="container">
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {notification.type === 'success' ? '✅' : '❌'}
          {notification.text}
        </div>
      )}
              {/* Status message for new currencies */}
        {Object.keys(currencies).some(code => ['JPY', 'SAR', 'JOD', 'KWD'].includes(code) && currencies[code].buyRate === 0) && (
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '1px solid #3b82f6',
            color: '#1e40af',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ℹ️ بعض العملات الجديدة تحتاج إلى تحديث الأسعار من قبل المدير
          </div>
        )}
        
        <div className="card">
          <div className="header" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '30px',
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
            <div className="logo-section" style={{ marginBottom: '24px' }}>
              <div className="logo-container" style={{ marginBottom: '16px' }}>
                <img src={Logo} alt="Arnous Logo" className="main-logo" style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }} />
              </div>
              <div className="title-section">
                <h1 className="main-title" style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '800', 
                  margin: '0 0 16px 0',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  💱 أسعار الصرف اليوم
                </h1>
                <div style={{
                  width: '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                  margin: '0 auto',
                  borderRadius: '2px'
                }}></div>
              </div>
            </div>
            
            <p className="subtitle" style={{ 
              fontSize: '1.2rem', 
              margin: '0 0 24px 0',
              opacity: 0.9,
              fontWeight: '500'
            }}>
              أحدث أسعار صرف العملات مقابل الليرة السورية
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px 20px',
                borderRadius: '25px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
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
                  padding: '12px 20px',
                  borderRadius: '25px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Clock size={18} />
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
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              📊 {Object.keys(currencies).length} عملة متاحة
            </div>
            
            {/* New currencies notice */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              🆕 تم إضافة 4 عملات جديدة: الين الياباني، الريال السعودي، الدينار الأردني، الدينار الكويتي
              <br />
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                💡 يمكن للمدير تحديث أسعار هذه العملات من لوحة التحكم
              </span>
              <br />
              <a 
                href="/admin/login" 
                style={{ 
                  color: '#92400e', 
                  textDecoration: 'underline',
                  fontSize: '0.8rem',
                  marginTop: '8px',
                  display: 'inline-block'
                }}
              >
                🔐 تسجيل دخول المدير
              </a>
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
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                marginTop: '10px'
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginTop: '30px'
        }}>
          {Object.keys(currencyInfo).map(currency => {
            const info = currencyInfo[currency];
            const data = currencies[currency] || {
              code: currency,
              name: info.name,
              buyRate: 0,
              sellRate: 0,
              isActive: true,
              lastUpdated: null
            };
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
                  borderRadius: '16px',
                  padding: '24px',
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
                
                <div className="currency-label" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span className="currency-flag" style={{ fontSize: '2rem' }}>{info.flag}</span>
                    <Icon size={28} style={{ color: info.color }} />
                    <div>
                      <div className="currency-name" style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}>
                        {info.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
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
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    {currency}
                  </div>
                  
                  {/* New currency indicator */}
                  {['JPY', 'SAR', 'JOD', 'KWD'].includes(currency) && (
                    <div style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      marginLeft: '8px'
                    }}>
                      🆕 جديد
                    </div>
                  )}
                </div>
                
                <div className="currency-rates" style={{ marginBottom: '20px' }}>
                  <div className="rate-item" style={{ 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: '#16a34a',
                      marginBottom: '8px'
                    }}>
                      <TrendingUp size={18} />
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>سعر الشراء</span>
                    </div>
                    <div className="rate-value" style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#15803d',
                      textAlign: 'center'
                    }}>
                      {data.buyRate > 0 ? (
                        `${formatNumber(data.buyRate)} <span style={{ fontSize: '1.1rem', color: '#16a34a' }}>ل.س</span>`
                      ) : (
                        <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '1.1rem' }}>لم يتم تحديد السعر بعد</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="rate-item" style={{ 
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: '#dc2626',
                      marginBottom: '8px'
                    }}>
                      <TrendingDown size={18} />
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>سعر البيع</span>
                    </div>
                    <div className="rate-value" style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#b91c1c',
                      textAlign: 'center'
                    }}>
                      {data.sellRate > 0 ? (
                        `${formatNumber(data.sellRate)} <span style={{ fontSize: '1.1rem', color: '#dc2626' }}>ل.س</span>`
                      ) : (
                        <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '1.1rem' }}>لم يتم تحديد السعر بعد</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Spread information */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid #cbd5e1'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>الفرق:</span>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '600',
                      background: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {data.buyRate > 0 && data.sellRate > 0 ? (
                        `${formatNumber(data.sellRate - data.buyRate)} ل.س`
                      ) : (
                        <span style={{ color: '#6b7280', fontStyle: 'italic' }}>غير متوفر</span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="last-updated" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#64748b',
                  justifyContent: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Clock size={14} />
                  {data.lastUpdated ? (
                    `آخر تحديث: ${formatDate(data.lastUpdated)}`
                  ) : (
                    'لم يتم تحديث الأسعار بعد'
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Currency Summary Section */}
        <div className="card" style={{ 
          marginTop: '30px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #cbd5e1'
        }}>
          <h3 style={{ 
            color: '#1e293b', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            📊 ملخص العملات
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💱</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {Object.keys(currencies).length}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>عملة متاحة</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {lastUpdate ? formatDate(lastUpdate).split(' ')[0] : 'N/A'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>آخر تحديث</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: connected ? '#10b981' : '#ef4444',
                marginBottom: '4px'
              }}>
                {connected ? 'متصل' : 'غير متصل'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>حالة الاتصال</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏰</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                30 ث
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>معدل التحديث</div>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              marginBottom: '16px', 
              textAlign: 'center',
              fontSize: '1.2rem',
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
        <div className="card" style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '20px', textAlign: 'center' }}>
            🔮 توقعات وتحليلات أرنوس
          </h3>
          <p style={{ 
            color: '#718096', 
            textAlign: 'center', 
            marginBottom: '25px',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            آراء وتوقعات خبراء شركة عرنوس حول أسواق العملات والاقتصاد المحلي والعالم 
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
        <div className="card" style={{ marginTop: '30px', textAlign: 'center' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>معلومات إضافية</h3>
          <p style={{ color: '#718096', lineHeight: '1.6' }}>
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
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px auto 0',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
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
            <RefreshCw size={20} />
            تحديث الأسعار
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;