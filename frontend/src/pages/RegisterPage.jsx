import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import axios from 'axios';
import { 
  User, Mail, Phone, Lock, Shield, CheckCircle, 
  ArrowRight, MapPin, Globe, Building, Navigation
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
  
  const { register } = useAuth();
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

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Side: Branding */}
          <div className="bg-primary-600 md:w-1/3 p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight uppercase">Join the decision network</h2>
            </div>
            <div className="relative z-10">
              <div className="space-y-4">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${step >= s ? 'bg-white text-primary-600 border-white shadow-lg' : 'border-white/30 text-white/50'}`}>{s}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-white/40'}`}>{s === 1 ? 'Verify Identity' : s === 2 ? 'Secure Access' : 'Awaiting Approval'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="flex-1 p-10 md:p-12">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in duration-300">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Identity Proofing</h3>
                <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">Verifying your WhatsApp identity creates a cryptographic anchor for your session.</p>
                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input name="phone_number" required type="tel" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner" placeholder="WhatsApp (e.g. 91...)" value={formData.phone_number} onChange={handleChange} disabled={otpSent} />
                  </div>
                  {otpSent && (
                    <div className="relative animate-in slide-in-from-top-4 duration-300">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input name="otp" required maxLength="6" type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-600 focus:bg-white outline-none transition-all text-center tracking-[0.5em] text-xl font-black shadow-inner" placeholder="000000" value={formData.otp} onChange={handleChange} />
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Access Credentials</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">Establish your secure portal access and local identifying information.</p>
                <form onSubmit={handleFinalRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="name" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none transition-all text-sm font-bold" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="email" required type="email" className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none transition-all text-sm font-bold" placeholder="Email" value={formData.email} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="password" required type="password" className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none transition-all text-sm font-bold" placeholder="Password" value={formData.password} onChange={handleChange} />
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mt-6">Locality Information</h4>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="address" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="Address" value={formData.address} onChange={handleChange} />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select name="country" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.country} onChange={handleChange}>
                      <option value="">Country</option>
                      {countries.map(c => <option key={c.iso2 || c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="state" required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.state} onChange={handleChange} disabled={!formData.country}>
                      <option value="">State</option>
                      {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <select name="district" required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.district} onChange={handleChange} disabled={!formData.state}>
                      <option value="">District</option>
                      {districts.map(d => <option key={typeof d === 'string' ? d : d.name} value={typeof d === 'string' ? d : d.name}>{typeof d === 'string' ? d : d.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-primary-100 flex items-center justify-center gap-3 mt-6 disabled:opacity-50">
                    {loading ? 'Finalizing...' : 'Register Account'} <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-green-50/50">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Request Logged</h3>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">Your registration is complete. A system administrator will review your credentials and activate your dashboard access within 24 hours.</p>
                <Link to="/login" className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-primary-600 transition-all shadow-xl">
                  Back to Portal <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-500 font-medium">Already a member? <Link to="/login" className="text-primary-600 font-black hover:underline">Sign In</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
