import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import axios from 'axios';
import { 
  User, Mail, Phone, Lock, Shield, CheckCircle, 
  ArrowRight, MapPin, Globe, Building, Navigation, Zap, ArrowLeft
} from 'lucide-react';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    otp: '',
    address: '',
    country: '',
    state: '',
    district: '',
    pincode: ''
  });
  
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const { register, siteName } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get('https://countriesnow.space/api/v0.1/countries/iso');
        setCountries(res.data.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country) {
      const fetchStates = async () => {
        try {
          const res = await axios.post('https://countriesnow.space/api/v0.1/countries/states', {
            country: formData.country
          });
          setStates(res.data.data.states || []);
        } catch (err) {
          setStates([]);
        }
      };
      fetchStates();
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state) {
      const fetchDistricts = async () => {
        try {
          const res = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', {
            country: formData.country,
            state: formData.state
          });
          setDistricts(res.data.data || []);
        } catch (err) {
          setDistricts([]);
        }
      };
      fetchDistricts();
    }
  }, [formData.state, formData.country]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/user/signup-otp', { phone_number: formData.phone_number });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/user/signup-verify', { phone_number: formData.phone_number, otp: formData.otp });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pass)) return 'Include at least one uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Include at least one lowercase letter.';
    if (!/\d/.test(pass)) return 'Include at least one number.';
    if (!/[@$!%*?&#]/.test(pass)) return 'Include one special character (@$!%*?&#).';
    return null;
  };

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setError('');
    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
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

      <div className="w-full max-w-[400px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde]">
        {error && (
          <div className="p-3 mb-4 text-[#d63638] bg-white border-l-4 border-[#d63638] shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Progress Tracker */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? 'bg-[#2271b1]' : 'bg-[#dcdcde]'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-sm font-bold text-[#1d2327] mb-4 uppercase tracking-wider text-center">Step 1: Verify Phone</h2>
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3c434a]">WhatsApp Number</label>
                <input 
                  name="phone_number" 
                  required 
                  type="tel" 
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm shadow-inner transition-all" 
                  placeholder="91XXXXXXXXXX" 
                  value={formData.phone_number} 
                  onChange={handleChange} 
                  disabled={otpSent} 
                />
              </div>
              {otpSent && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                  <label className="block text-xs font-medium text-[#3c434a]">OTP</label>
                  <input 
                    name="otp" 
                    required 
                    maxLength="6" 
                    type="text" 
                    className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-sm text-center font-bold tracking-[0.5em] shadow-inner" 
                    placeholder="000000" 
                    value={formData.otp} 
                    onChange={handleChange} 
                  />
                </div>
              )}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] disabled:opacity-50"
              >
                {loading ? 'Processing...' : (otpSent ? 'Verify & Continue' : 'Send OTP')}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-sm font-bold text-[#1d2327] mb-4 uppercase tracking-wider text-center">Step 2: Profile Details</h2>
            <form onSubmit={handleFinalRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#3c434a]">Full Name</label>
                  <input name="name" required className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-sm" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#3c434a]">Email</label>
                  <input name="email" required type="email" className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-sm" value={formData.email} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3c434a]">Account Password</label>

                <input name="password" required type="password" className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-sm" value={formData.password} onChange={handleChange} />
              </div>
              
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-[#a7aaad] uppercase border-b border-[#f0f0f1] pb-1">Location Details</p>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#3c434a]">Primary Address</label>
                  <input name="address" required className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-sm" value={formData.address} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select name="country" required className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-xs" value={formData.country} onChange={handleChange}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.iso2 || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <select name="state" required className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-xs" value={formData.state} onChange={handleChange} disabled={!formData.country}>
                    <option value="">Select State</option>
                    {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <select name="district" required className="w-full px-3 py-2 bg-white border border-[#8c8f94] focus:border-[#2271b1] outline-none text-xs" value={formData.district} onChange={handleChange} disabled={!formData.state}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={typeof d === 'string' ? d : d.name} value={typeof d === 'string' ? d : d.name}>{typeof d === 'string' ? d : d.name}</option>)}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm shadow-sm transition-all text-sm border-b-2 border-[#135e96] mt-4"
              >
                {loading ? 'Finalizing Node...' : 'Initialize Account'}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#edfaef] text-[#00a32a] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#00a32a]">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-sm font-bold text-[#1d2327] mb-2 uppercase">Request Successfully Queued</h2>
            <p className="text-xs text-[#646970] mb-8 leading-relaxed">Your registration has been logged. A system administrator will review your credentials and activate your dashboard access shortly.</p>
            <Link to="/login" className="w-full py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded-sm block shadow-sm text-sm border-b-2 border-[#135e96]">
              Return to Login
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex gap-4">
          <Link to="/login" className="text-xs text-[#646970] hover:text-[#2271b1]">Log in instead?</Link>
        </div>
        <Link to="/" className="text-xs text-[#646970] hover:text-[#2271b1] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3 h-3" /> Back to {siteName}
        </Link>
      </div>
      
      <div className="mt-12 text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">
        Secure Registration Portal
      </div>
    </div>
  );
};

export default RegisterPage;
