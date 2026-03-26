import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, siteName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide global navbar on dashboards and auth pages as they have their own integrated nav
  const hideOn = ['/dashboard', '/admin', '/login', '/register', '/verify'];
  if (hideOn.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#1d2327] text-white py-2 px-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12">
            <Zap className="w-4 h-4 text-[#72aee6]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">{siteName}</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-[#a7aaad] hover:text-[#72aee6] transition-colors">Home</Link>
          <Link to="/about" className="text-[11px] font-bold uppercase tracking-widest text-[#a7aaad] hover:text-[#72aee6] transition-colors">Intelligence</Link>
          
          <div className="h-4 w-px bg-white/10 mx-2"></div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#72aee6] hover:text-white transition-colors">Portal</Link>
              <button 
                onClick={handleLogout}
                className="text-[#a7aaad] hover:text-[#d63638] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-[#a7aaad] hover:text-white transition-colors">Access</Link>
              <Link 
                to="/register" 
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all border-b border-[#135e96] shadow-sm"
              >
                Initialize
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
