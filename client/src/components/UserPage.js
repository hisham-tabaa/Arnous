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
  TrendingDown
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
        url: 'https://www.facebook.com/arnous.ex/'
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
        url: 'https://whatsapp.com/channel/0029Vb6LYzG3GJP3Ait6uc1e'
      }
    }
  });
  const [advice, setAdvice] = useState([]);
  const [loadingAdvice, setLoadingAdvice] = useState(true);

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
        const response = await axios.get('/api/currencies');
        setCurrencies(response.data.currencies);
        setLastUpdate(new Date().toISOString());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching currencies:', error);
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
      setCurrencies(updatedCurrencies);
      setLastUpdate(new Date().toISOString());
    });
    
    newSocket.on('adviceUpdate', (data) => {
      console.log('Received advice update:', data);
      fetchAdvice(); // Refresh advice list
    });
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, []);



  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
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
      <div className="card">
        <div className="header">
          <div className="logo-section">
            <div className="logo-container">
              <img src={Logo} alt="Arnous Logo" className="main-logo" />
              <div className="logo-glow"></div>
            </div>
            <div className="title-section">
              <h1 className="main-title">💱 أسعار الصرف اليوم</h1>
              <div className="title-decoration"></div>
            </div>
          </div>
          <p className="subtitle">أحدث أسعار صرف العملات مقابل الليرة السورية</p>
          <div className={`status-indicator ${connected ? 'status-connected' : 'status-disconnected'}`}>
            <div className={connected ? 'text-green-500' : 'text-red-500'}>●</div>
            {connected ? 'متصل - تحديث فوري' : 'غير متصل'}
          </div>
          {lastUpdate && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', color: '#718096' }}>
              <Clock size={16} />
              آخر تحديث: {formatDate(lastUpdate)}
            </div>
          )}
        </div>

        <div className="currency-grid">
          {Object.keys(currencies).map(currency => {
            const info = currencyInfo[currency];
            const data = currencies[currency];
            const Icon = info.icon;
            
            return (
              <div 
                key={currency} 
                className="currency-item"
                style={{ borderLeftColor: info.color }}
              >
                <div className="currency-label">
                  <span className="currency-flag">{info.flag}</span>
                  <Icon size={24} style={{ color: info.color }} />
                  <div>
                    <div className="currency-name">{info.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                      {info.description}
                    </div>
                  </div>
                </div>
                
                <div className="currency-rates">
                  <div className="rate-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
                      <TrendingUp size={16} />
                      <span style={{ fontWeight: 'bold' }}>شراء:</span>
                    </div>
                    <div className="rate-value">
                      {formatNumber(data.buyRate)} <span style={{ fontSize: '1.2rem', color: '#718096' }}>ل.س</span>
                    </div>
                  </div>
                  
                  <div className="rate-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                      <TrendingDown size={16} />
                      <span style={{ fontWeight: 'bold' }}>بيع:</span>
                    </div>
                    <div className="rate-value">
                      {formatNumber(data.sellRate)} <span style={{ fontSize: '1.2rem', color: '#718096' }}>ل.س</span>
                    </div>
                  </div>
                </div>
                
                <div className="last-updated">
                  <TrendingUp size={14} />
                  آخر تحديث: {formatDate(data.lastUpdated)}
                </div>
              </div>
            );
          })}
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
        <div className="card" style={{ marginTop: '30px', textAlign: 'center' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>معلومات إضافية</h3>
          <p style={{ color: '#718096', lineHeight: '1.6' }}>
            تُحدث أسعار الصرف بشكل دوري من قبل الإدارة. الأسعار المعروضة هي أسعار استرشادية وقد تختلف قليلاً عن أسعار السوق الفعلية.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            <RefreshCw size={16} />
            تحديث الأسعار
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;