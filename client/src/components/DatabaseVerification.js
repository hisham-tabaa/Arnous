import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Server,
  HardDrive,
  Users,
  DollarSign
} from 'lucide-react';

const DatabaseVerification = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('/api/admin/database/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Database verification error:', error);
      setError(error.response?.data?.error || 'Failed to verify database');
      
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            
            <Database size={24} color="#6366f1" />
            <h1 style={{ margin: 0, color: '#2d3748' }}>Database Verification</h1>
            
            <button
              onClick={fetchDatabaseInfo}
              disabled={loading}
              style={{
                background: loading ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginLeft: 'auto'
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {data && (
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Last updated: {formatDate(data.timestamp)}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <RefreshCw size={32} className="animate-spin" color="#6366f1" />
            <p style={{ marginTop: '15px', color: '#64748b' }}>Verifying database connection...</p>
          </div>
        )}

        {/* Database Info */}
        {data && (
          <>
            {/* Connection Status */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Server size={20} color="#6366f1" />
                <h2 style={{ margin: 0, color: '#2d3748' }}>Database Connection</h2>
                {data.database.readyState === 1 ? (
                  <CheckCircle size={20} color="#10b981" />
                ) : (
                  <AlertCircle size={20} color="#dc2626" />
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>Database Name:</strong>
                  <p style={{ margin: '5px 0', color: '#6366f1', fontFamily: 'monospace' }}>
                    {data.database.name}
                  </p>
                </div>
                <div>
                  <strong>Connection Status:</strong>
                  <p style={{ 
                    margin: '5px 0', 
                    color: data.database.readyState === 1 ? '#10b981' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    {data.database.readyStateText}
                  </p>
                </div>
                <div>
                  <strong>Host:</strong>
                  <p style={{ margin: '5px 0', color: '#64748b', fontFamily: 'monospace' }}>
                    {data.database.host}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <DollarSign size={32} color="#10b981" style={{ marginBottom: '10px' }} />
                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>Currencies</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {data.summary.currencies}
                </p>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <Users size={32} color="#6366f1" style={{ marginBottom: '10px' }} />
                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>Users</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>
                  {data.summary.users}
                </p>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <HardDrive size={32} color="#f59e0b" style={{ marginBottom: '10px' }} />
                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>Collections</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {data.summary.totalCollections}
                </p>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <Database size={32} color="#8b5cf6" style={{ marginBottom: '10px' }} />
                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>Activity Logs</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {data.summary.activityLogs}
                </p>
              </div>
            </div>

            {/* Collections Details */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '15px', color: '#2d3748' }}>Collections Details</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                        Collection Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>
                        Document Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(data.collections).map((collection, index) => (
                      <tr key={collection.name} style={{ 
                        background: index % 2 === 0 ? 'white' : '#f8fafc' 
                      }}>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e2e8f0',
                          fontFamily: 'monospace',
                          color: '#6366f1'
                        }}>
                          {collection.name}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid #e2e8f0',
                          fontWeight: 'bold'
                        }}>
                          {collection.documentCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample Data */}
            {data.samples && (
              <>
                {/* Sample Currencies */}
                {data.samples.currencies && data.samples.currencies.length > 0 && (
                  <div style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}>
                    <h2 style={{ marginBottom: '15px', color: '#2d3748' }}>Sample Currencies</h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Code</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Buy Rate</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Sell Rate</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Active</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Visible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.samples.currencies.map((currency, index) => (
                            <tr key={currency.code} style={{ 
                              background: index % 2 === 0 ? 'white' : '#f8fafc' 
                            }}>
                              <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                                {currency.code}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                {currency.name}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                                {currency.buyRate?.toLocaleString()}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                                {currency.sellRate?.toLocaleString()}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ 
                                  color: currency.isActive ? '#10b981' : '#dc2626',
                                  fontWeight: 'bold'
                                }}>
                                  {currency.isActive ? '✓' : '✗'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ 
                                  color: currency.isVisible ? '#10b981' : '#dc2626',
                                  fontWeight: 'bold'
                                }}>
                                  {currency.isVisible ? '👁️' : '🚫'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sample Users */}
                {data.samples.users && data.samples.users.length > 0 && (
                  <div style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}>
                    <h2 style={{ marginBottom: '15px', color: '#2d3748' }}>Sample Users</h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Username</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Role</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.samples.users.map((user, index) => (
                            <tr key={user.username} style={{ 
                              background: index % 2 === 0 ? 'white' : '#f8fafc' 
                            }}>
                              <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                                {user.username}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ 
                                  background: user.role === 'admin' ? '#dc2626' : '#6366f1',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ 
                                  color: user.isActive ? '#10b981' : '#dc2626',
                                  fontWeight: 'bold'
                                }}>
                                  {user.isActive ? '✓' : '✗'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DatabaseVerification;