import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedAdminDashboard from './components/ProtectedAdminDashboard';
import Login from './components/Login';
import UserPage from './components/UserPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token with server
      fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p style={{ color: 'white', marginTop: '20px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/rates" replace />} />
          <Route path="/rates" element={<UserPage />} />
          <Route 
            path="/admin/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/admin" replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAuthenticated ? 
                <ProtectedAdminDashboard onLogout={handleLogout} /> : 
                <Navigate to="/admin/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;