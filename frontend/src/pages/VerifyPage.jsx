import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const VerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyRegistration(userId, otp);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-12 text-center">
          <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-primary-50/50">
            <Shield className="w-10 h-10" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Identity Verification</h2>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
            We've sent a 6-digit verification code to your WhatsApp for <span className="text-slate-900 font-bold">{email}</span>.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-6 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Verified Successfully</h3>
              <p className="text-slate-500 text-sm font-medium">Redirecting you to the portal...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  maxLength="6"
                  type="text"
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-600 focus:bg-white outline-none transition-all text-center tracking-[0.8em] text-2xl font-black shadow-inner"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'} <ArrowRight className="w-6 h-6" />
              </button>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Didn't receive the code? Check your WhatsApp.
            </p>
            <Link to="/login" className="mt-4 text-xs font-bold text-primary-600 hover:underline inline-block">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
