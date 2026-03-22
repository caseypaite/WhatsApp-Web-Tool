import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
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

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, loginWithPhoneRequest, loginWithPhoneVerify, register, verifyRegistration, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
