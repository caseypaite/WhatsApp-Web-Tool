import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import { Lock, Mail, Phone, AlertCircle, ArrowLeft, Key, Zap } from 'lucide-react';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState('email'); // 'email', 'phone', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithPhoneRequest, loginWithPhoneVerify, siteName } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to login. Please try again.';
      setError(msg);
      if (err.response?.status === 403) {
        const status = err.response?.data?.status;
        const userId = err.response?.data?.userId;
        if (status === 'PENDING_VERIFICATION') {
          navigate('/verify', { state: { userId, email } });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithPhoneRequest(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithPhoneVerify(phone, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emailOrPhone = email || phone;
      await authService.forgotPasswordRequest(emailOrPhone);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[@$!%*?&#]/.test(newPassword)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number and special char.');
      return;
    }

    setLoading(true);
    try {
      const emailOrPhone = email || phone;
      await authService.forgotPasswordReset(emailOrPhone, otp, newPassword);
      setLoginMode('email');
      setOtpSent(false);
      setError('');
      alert('Password reset successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f0f1] p-4 font-sans text-[#3c434a]">
      {/* WP Logo Placeholder */}
      <div className="mb-6 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-12 h-12 bg-[#1d2327] rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-[#1d2327] tracking-tight">{siteName}</h1>
      </div>

      <div className="w-full max-w-[320px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde]">
        {error && (
          <div className="p-3 mb-4 text-[#d63638] bg-white border-l-4 border-[#d63638] shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Auth Mode Toggle */}
        {loginMode !== 'forgot' && !otpSent && (
          <div className="flex mb-6 border-b border-[#f0f0f1]">
            <button
              onClick={() => { setLoginMode('email'); setError(''); }}
              className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'email' ? 'border-b-2 border-[#2271b1] text-[#2271b1]' : 'text-[#a7aaad] hover:text-[#3c434a]'}`}
            >
              Email Login
            </button>
            <button
              onClick={() => { setLoginMode('phone'); setError(''); }}
              className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'phone' ? 'border-b-2 border-[#2271b1] text-[#2271b1]' : 'text-[#a7aaad] hover:text-[#3c434a]'}`}
            >
              OTP Login
            </button>
          </div>
        )}

        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#3c434a]">Username or Email Address</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#3c434a]">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="rememberme" className="w-3.5 h-3.5 border-[#8c8f94] rounded-sm text-[#2271b1] focus:ring-[#2271b1]" />
              <label htmlFor="rememberme" className="text-xs text-[#3c434a]">Remember Me</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
        )}

        {loginMode === 'phone' && (
          <form onSubmit={otpSent ? handlePhoneVerify : handlePhoneRequest} className="space-y-4">
            {!otpSent ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3c434a]">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner transition-all"
                  placeholder="91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3c434a]">OTP</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm text-center font-bold tracking-[0.5em] shadow-inner"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-[#2271b1] hover:underline mt-1">Change Number</button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] disabled:opacity-50"
            >
              {loading ? 'Processing...' : (otpSent ? 'Log In' : 'Get OTP')}
            </button>
          </form>
        )}

        {loginMode === 'forgot' && (
          <form onSubmit={otpSent ? handleForgotReset : handleForgotRequest} className="space-y-4">
            {!otpSent ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3c434a]">Email or Phone</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner transition-all"
                  value={email || phone}
                  onChange={(e) => { setEmail(e.target.value); setPhone(e.target.value); }}
                />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#3c434a]">OTP</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#3c434a]">New Security Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] disabled:opacity-50"
            >
              {loading ? 'Processing...' : (otpSent ? 'Reset Password' : 'Get New Password')}
            </button>
            <button type="button" onClick={() => { setLoginMode('email'); setOtpSent(false); }} className="w-full text-xs text-[#2271b1] hover:underline py-1">Back to Login</button>
          </form>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex gap-4">
          <button onClick={() => setLoginMode('forgot')} className="text-xs text-[#646970] hover:text-[#2271b1]">Lost your password?</button>
          <span className="text-[#dcdcde]">|</span>
          <Link to="/register" className="text-xs text-[#646970] hover:text-[#2271b1]">Register account</Link>
        </div>
        <Link to="/" className="text-xs text-[#646970] hover:text-[#2271b1] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3 h-3" /> Back to {siteName}
        </Link>
      </div>
      
      <div className="mt-12 text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">
        Secured by Secure Portal
      </div>
    </div>
  );
};

export default LoginPage;
