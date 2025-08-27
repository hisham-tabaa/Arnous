import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication token/session
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', credentials.username);
        
        onLogin(data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="header">
          <Shield size={48} style={{ color: '#4299e1', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Admin Login</h1>
          <p>Enter your credentials to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <User 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  color: '#718096',
                  zIndex: 1
                }} 
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={credentials.username}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px 12px 50px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease',
                  background: '#f7fafc'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Lock 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  color: '#718096',
                  zIndex: 1
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 50px 12px 50px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease',
                  background: '#f7fafc'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fed7d7',
              color: '#c53030',
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Logging in...
              </div>
            ) : (
              <>
                <Lock size={16} style={{ marginRight: '8px' }} />
                Login to Admin Panel
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f7fafc',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#2d3748', marginBottom: '10px' }}> Credentials</h4>
       
 
        </div>
      </div>
    </div>
  );
};

export default Login;
