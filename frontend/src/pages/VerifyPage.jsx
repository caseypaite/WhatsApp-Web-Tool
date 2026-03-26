import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, ArrowRight, AlertCircle, CheckCircle, Zap, ArrowLeft } from 'lucide-react';

const VerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { verifyRegistration, siteName } = useAuth();
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
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Protocol mismatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f0f1] p-4 font-sans text-[#3c434a]">
      {/* Branding */}
      <div className="mb-6 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-12 h-12 bg-[#1d2327] rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-[#1d2327] tracking-tight">{siteName}</h1>
      </div>

      <div className="w-full max-w-[320px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde]">
        {error && (
          <div className="p-3 mb-4 text-[#d63638] bg-white border-l-4 border-[#d63638] shadow-sm text-xs font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-[#edfaef] text-[#00a32a] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00a32a]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1d2327] mb-1 uppercase">Node Verified</h3>
            <p className="text-xs text-[#646970]">Awaiting session initialization...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xs font-bold text-[#1d2327] uppercase tracking-wider mb-2">Enter OTP</h2>
              <p className="text-[10px] text-[#646970] leading-relaxed">
                Enter the OTP sent to your unit linked with <span className="font-bold">{email}</span>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#a7aaad] uppercase text-center mb-2 tracking-[0.2em]">Enter OTP</label>
              <input
                required
                maxLength="6"
                type="text"
                className="w-full px-3 py-3 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-xl text-center font-black tracking-[0.5em] shadow-inner"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Synchronize Identity'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link to="/login" className="text-xs text-[#646970] hover:text-[#2271b1] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3 h-3" /> Back to Access Portal
        </Link>
      </div>
      
      <div className="mt-12 text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">
        Secure Verification Portal
      </div>
    </div>
  );
};

export default VerifyPage;
