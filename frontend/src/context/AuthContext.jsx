import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('AppStack');
  const [publicConfig, setPublicConfig] = useState({});

  const fetchPublicConfig = async () => {
    try {
      const res = await api.get('/settings/public');
      if (res.data.SITE_NAME) setSiteName(res.data.SITE_NAME);
      setPublicConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch public config');
    }
  };

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    fetchPublicConfig();
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const loginWithPhoneRequest = async (phoneNumber) => {
    return await authService.loginWithPhoneRequest(phoneNumber);
  };

  const loginWithPhoneVerify = async (phoneNumber, otp) => {
    const data = await authService.loginWithPhoneVerify(phoneNumber, otp);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const verifyRegistration = async (userId, otp) => {
    return await authService.verifyRegistration(userId, otp);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin');
  };

  const updateSiteName = (name) => {
    setSiteName(name);
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, loading, login, loginWithPhoneRequest, loginWithPhoneVerify, 
      register, verifyRegistration, logout, isAdmin, siteName, updateSiteName, 
      publicConfig, fetchPublicConfig 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
