import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import axios from 'axios';
import { Lock, Mail, User, Phone, AlertCircle, Send, CheckCircle, ArrowRight, MapPin, Globe, Home, ChevronRight } from 'lucide-react';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone_number: '', otp: '', address: '', country: '', state: '', district: '', pincode: ''
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 3) {
      axios.get('https://countriesnow.space/api/v0.1/countries/iso')
        .then(res => setCountries(res.data.data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(() => console.error('Countries fail'));
    }
  }, [step]);

  useEffect(() => {
    if (formData.country) {
      axios.post('https://countriesnow.space/api/v0.1/countries/states', { country: formData.country })
        .then(res => setStates(res.data.data.states || []))
        .catch(() => setStates([]));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state && formData.country) {
      axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country: formData.country, state: formData.state })
        .then(res => setDistricts(res.data.data || []))
        .catch(() => setDistricts([]));
    }
  }, [formData.state, formData.country]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/user/signup-otp', { phone_number: formData.phone_number });
      setStep(2);
      setSuccess('Verification code sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/user/signup-verify', { phone_number: formData.phone_number, otp: formData.otp });
      setStep(3);
      setSuccess('Verified! Complete your profile.');
    } catch (err) {
      setError('Invalid code.');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(formData);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally { setLoading(false); }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Welcome aboard!</h2>
          <p className="text-slate-500 mb-8">Your account is ready and pending admin approval.</p>
          <Link to="/login" className="block w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 relative overflow-hidden">
      {/* Abstract Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Progress/Info */}
        <div className="md:col-span-2 bg-slate-900 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-primary-600 rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-primary-900/50">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black mb-4 leading-tight">Create your account</h1>
            <p className="text-slate-400 leading-relaxed mb-8">Join thousands of users securing their identity with AppStack.</p>
            
            <div className="space-y-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-4 transition-all ${step >= s ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest">{s === 1 ? 'Mobile' : s === 2 ? 'Verify' : 'Profile'}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-sm italic">"The most secure way to manage your digital footprint."</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-3 p-10">
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake"><AlertCircle className="w-5 h-5" /> {error}</div>}
          
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-8 py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Start with mobile</h3>
                <p className="text-slate-500">Enter your 10-digit phone number to receive a secure code.</p>
              </div>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input type="tel" name="phone_number" required className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-primary-600 focus:bg-white outline-none transition-all text-xl font-bold tracking-wider" placeholder="Enter 10 digit number" value={formData.phone_number} onChange={handleChange} />
              </div>
              <button type="submit" disabled={loading || !formData.phone_number} className="w-full py-5 bg-primary-600 text-white font-black rounded-[1.25rem] hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-3 text-lg tracking-wide uppercase">
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-6 h-6" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Verification</h3>
                <p className="text-slate-500">We sent a code to <span className="text-primary-600 font-bold">{formData.phone_number}</span></p>
              </div>
              <input type="text" name="otp" maxLength="6" required className="w-full px-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-primary-600 focus:bg-white outline-none transition-all text-center text-4xl font-black tracking-[0.5em]" placeholder="000000" value={formData.otp} onChange={handleChange} autoFocus />
              <div className="flex gap-4">
                <button type="submit" disabled={loading || formData.otp.length !== 6} className="flex-1 py-5 bg-primary-600 text-white font-black rounded-[1.25rem] hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 uppercase tracking-widest text-lg">Verify</button>
                <button type="button" onClick={() => setStep(1)} className="px-8 py-5 bg-slate-100 text-slate-600 font-bold rounded-[1.25rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-sm">Back</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Personal</h4>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600" />
                    <input type="text" name="name" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600" />
                    <input type="email" name="email" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600" />
                    <input type="password" name="password" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="Create Password" value={formData.password} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Location</h4>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select name="country" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.country} onChange={handleChange}>
                      <option value="">Country</option>
                      {countries.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="state" required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.state} onChange={handleChange} disabled={!formData.country}>
                      <option value="">State</option>
                      {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <select name="district" required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 outline-none appearance-none text-sm font-bold" value={formData.district} onChange={handleChange} disabled={!formData.state}>
                      <option value="">District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="relative group">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600" />
                    <input type="text" name="address" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="Address" value={formData.address} onChange={handleChange} />
                  </div>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600" />
                    <input type="text" name="pincode" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary-600 focus:bg-white outline-none transition-all text-sm font-bold" placeholder="PIN Code" value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-200 uppercase tracking-widest text-lg mt-4">Complete Registration</button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">Already a member? <Link to="/login" className="text-primary-600 font-black hover:underline">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
