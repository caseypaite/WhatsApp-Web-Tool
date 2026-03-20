import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('AppStack');

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://backend.kcdev.qzz.io/api';
        const res = await axios.get(`${baseUrl}/settings/public`);
        if (res.data.SITE_NAME) setSiteName(res.data.SITE_NAME);
      } catch (err) {
        console.error('Failed to fetch site name');
      }
    };
    fetchSiteName();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100">
      <div className="container px-6 mx-auto">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{siteName}</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                {isAdmin && isAdmin() && (
                  <Link to="/admin" className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900">{user.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition duration-200 shadow-lg shadow-primary-100"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
