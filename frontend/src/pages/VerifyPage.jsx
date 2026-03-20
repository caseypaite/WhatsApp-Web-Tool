import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, AlertCircle, CheckCircle } from 'lucide-react';

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

  const handleSubmit = async (e) => {
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-50 text-green-600 rounded-full">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Verified!</h1>
          <p className="text-slate-500 mt-4">
            Your phone number has been verified. Your account is now pending admin approval.
            You will be redirected to login shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Verify Account</h1>
          <p className="text-slate-500 mt-2">Enter the 6-digit code sent to your phone</p>
          {email && <p className="text-sm font-medium text-primary-600 mt-1">{email}</p>}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 text-red-700 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                maxLength="6"
                className="w-full pl-12 pr-4 py-4 text-2xl tracking-[1em] font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-center"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition duration-200 shadow-lg shadow-primary-200 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button className="text-slate-500 hover:text-primary-600 text-sm font-medium">
            Didn't receive a code? Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
