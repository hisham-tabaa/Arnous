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

    fetchData();
    
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    
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