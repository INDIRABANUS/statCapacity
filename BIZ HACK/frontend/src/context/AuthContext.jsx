import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [donor, setDonor] = useState(() => {
    const savedDonor = localStorage.getItem('donor');
    return savedDonor ? JSON.parse(savedDonor) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication status with backend
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.user);
          setDonor(data.donor || null);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.donor) {
            localStorage.setItem('donor', JSON.stringify(data.donor));
          } else {
            localStorage.removeItem('donor');
          }
        }
      } catch (error) {
        console.error('Session expired or invalid token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.donor) {
        localStorage.setItem('donor', JSON.stringify(data.donor));
      } else {
        localStorage.removeItem('donor');
      }

      setToken(data.token);
      setUser(data.user);
      setDonor(data.donor || null);
      return data;
    }
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.donor) {
        localStorage.setItem('donor', JSON.stringify(data.donor));
      }

      setToken(data.token);
      setUser(data.user);
      setDonor(data.donor || null);
      return data;
    }
  };

  const updateDonorState = (updatedDonor) => {
    setDonor(updatedDonor);
    localStorage.setItem('donor', JSON.stringify(updatedDonor));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('donor');
    setUser(null);
    setDonor(null);
    setToken(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isDonor = user?.role === 'DONOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        donor,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isDonor,
        login,
        register,
        logout,
        updateDonorState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
