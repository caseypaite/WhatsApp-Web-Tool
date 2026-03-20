import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import { Lock, Mail, Phone, AlertCircle, ArrowLeft, Key } from 'lucide-react';

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
  const { login, loginWithPhoneRequest, loginWithPhoneVerify } = useAuth();
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            {loginMode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2">
            {loginMode === 'forgot' ? 'Set a new password for your account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Tabs */}
        {loginMode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => { setLoginMode('email'); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMode === 'email' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Email
            </button>
            <button
              onClick={() => { setLoginMode('phone'); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMode === 'phone' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Phone (OTP)
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 text-red-700 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setLoginMode('forgot'); setOtpSent(false); }}
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition duration-200 shadow-lg shadow-primary-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {loginMode === 'phone' && (
          <form onSubmit={otpSent ? handlePhoneVerify : handlePhoneRequest} className="space-y-6">
            {!otpSent ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="919988776655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength="6"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)} 
                  className="mt-2 text-xs font-bold text-slate-500 hover:text-primary-600"
                >
                  Change number
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition duration-200 shadow-lg shadow-primary-200 disabled:opacity-50"
            >
              {loading ? (otpSent ? 'Verifying...' : 'Sending OTP...') : (otpSent ? 'Login' : 'Send OTP')}
            </button>
          </form>
        )}

        {loginMode === 'forgot' && (
          <form onSubmit={otpSent ? handleForgotReset : handleForgotRequest} className="space-y-6">
            {!otpSent ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="Email or Phone"
                    value={email || phone}
                    onChange={(e) => { setEmail(e.target.value); setPhone(e.target.value); }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">OTP</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setLoginMode('email'); setOtpSent(false); }}
                className="flex-1 py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (otpSent ? 'Reset' : 'Request OTP')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
