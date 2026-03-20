import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import api from '../services/api';
import axios from 'axios';
import { User, Mail, Phone, Shield, Clock, AlertCircle, Edit2, CheckCircle, Send, X, Terminal, ChevronDown, ChevronUp, Lock, Key, MapPin, Globe, Home, Users, MessageSquare, History } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [myMessages, setMyMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Phone Update State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passOtpSent, setPassOtpSent] = useState(false);
  const [passOtp, setPassOtp] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    country: '',
    state: '',
    district: '',
    pincode: ''
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [isDebugExpanded, setIsDebugExpanded] = useState(true);

  const fetchData = async () => {
    try {
      const [profileData, groupsData, messagesData] = await Promise.all([
        authService.getProfile(),
        authService.getMyGroups(),
        authService.getMyMessages()
      ]);
      
      setProfile(profileData);
      setMyGroups(groupsData);
      setMyMessages(messagesData);
      
      setNewPhone(profileData.phone_number || '');
      setEditForm({
        name: profileData.name || '',
        address: profileData.address || '',
        country: profileData.country || '',
        state: profileData.state || '',
        district: profileData.district || '',
        pincode: profileData.pincode || ''
      });
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Countries when editing profile
  useEffect(() => {
    if (isEditingProfile) {
      const fetchCountries = async () => {
        try {
          const res = await axios.get('https://countriesnow.space/api/v0.1/countries/iso');
          setCountries(res.data.data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
          console.error('Failed to fetch countries');
        }
      };
      fetchCountries();
    }
  }, [isEditingProfile]);

  // Fetch States when country changes in edit mode
  useEffect(() => {
    if (isEditingProfile && editForm.country) {
      const fetchStates = async () => {
        try {
          const res = await axios.post('https://countriesnow.space/api/v0.1/countries/states', {
            country: editForm.country
          });
          setStates(res.data.data.states || []);
        } catch (err) {
          console.error('Failed to fetch states');
          setStates([]);
        }
      };
      fetchStates();
    }
  }, [editForm.country, isEditingProfile]);

  // Fetch Districts when state changes in edit mode
  useEffect(() => {
    if (isEditingProfile && editForm.state && editForm.country) {
      const fetchDistricts = async () => {
        try {
          const res = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', {
            country: editForm.country,
            state: editForm.state
          });
          setDistricts(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch districts');
          setDistricts([]);
        }
      };
      fetchDistricts();
    }
  }, [editForm.state, editForm.country, isEditingProfile]);

  const handleRequestPhoneOtp = async () => {
    if (!newPhone) return;
    setActionLoading(true);
    setError('');
    setGatewayResponse(null);
    setSuccessMessage('');
    try {
      const res = await api.post('/user/request-phone-update', { phone_number: newPhone });
      setPhoneOtpSent(true);
      setSuccessMessage('OTP sent to your new phone number.');
      if (res.data.result?.gatewayResponse) setGatewayResponse(res.data.result.gatewayResponse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
      if (err.response?.data?.result?.gatewayResponse) setGatewayResponse(err.response.data.result.gatewayResponse);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneOtp) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post('/user/confirm-phone-update', { otp: phoneOtp, phone_number: newPhone });
      setSuccessMessage('Phone number updated successfully!');
      setIsEditingPhone(false);
      setPhoneOtpSent(false);
      setPhoneOtp('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await api.put('/user/profile', editForm);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPassOtp = async () => {
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (passwords.new.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    setActionLoading(true);
    setError('');
    setGatewayResponse(null);
    setSuccessMessage('');
    try {
      const res = await api.post('/user/request-password-change');
      setPassOtpSent(true);
      setSuccessMessage('OTP sent to your registered phone number.');
      if (res.data.result?.gatewayResponse) setGatewayResponse(res.data.result.gatewayResponse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
      if (err.response?.data?.result?.gatewayResponse) setGatewayResponse(err.response.data.result.gatewayResponse);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!passOtp) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post('/user/confirm-password-change', { otp: passOtp, new_password: passwords.new });
      setSuccessMessage('Password changed successfully!');
      setIsChangingPassword(false);
      setPassOtpSent(false);
      setPassOtp('');
      setPasswords({ new: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userData = profile || user;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container px-6 mx-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Dashboard</h1>
              <p className="text-slate-500 mt-2">Manage your account, groups, and message history</p>
            </div>
            {!isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition shadow-sm">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </header>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-8 text-red-700 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-4 mb-8 text-green-700 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
            {/* Left Column - Profile & Security (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Profile Card */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{userData?.name || 'User'}</h2>
                    <p className="text-slate-500">{userData?.email}</p>
                  </div>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Country</label>
                        <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value, state: '', district: ''})}>
                          <option value="">Select Country</option>
                          {countries.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">State</label>
                        <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value, district: ''})} disabled={!editForm.country}>
                          <option value="">Select State</option>
                          {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">District</label>
                        <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.district} onChange={(e) => setEditForm({...editForm, district: e.target.value})} disabled={!editForm.state}>
                          <option value="">Select District</option>
                          {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Street Address</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">PIN / Postal Code</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={editForm.pincode} onChange={(e) => setEditForm({...editForm, pincode: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                      <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 disabled:opacity-50">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3 text-slate-500 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
                      </div>
                      <p className="font-medium text-slate-900">{userData?.email}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-500 mb-1">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Phone</span>
                        </div>
                        {!isEditingPhone && (
                          <button onClick={() => { setIsEditingPhone(true); setGatewayResponse(null); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {isEditingPhone ? (
                        <div className="space-y-4 mt-2">
                          <div className="flex gap-2">
                            <input type="tel" className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} disabled={phoneOtpSent} placeholder="Enter 10 digit number" />
                            {!phoneOtpSent ? (
                              <button onClick={handleRequestPhoneOtp} disabled={actionLoading || !newPhone} className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition disabled:opacity-50">OTP</button>
                            ) : (
                              <button onClick={() => {setPhoneOtpSent(false); setPhoneOtp(''); setGatewayResponse(null);}} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition"><X className="w-4 h-4" /></button>
                            )}
                          </div>
                          {phoneOtpSent && (
                            <div className="flex gap-2">
                              <input type="text" maxLength="6" className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all text-center font-bold tracking-widest" placeholder="000000" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                              <button onClick={handleVerifyPhone} disabled={actionLoading || phoneOtp.length !== 6} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50">Verify</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium text-slate-900">{userData?.phone_number || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3 text-slate-500 mb-1">
                        <Home className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Address</span>
                      </div>
                      <p className="font-medium text-slate-900">
                        {userData?.address || 'N/A'}<br/>
                        {userData?.district && `${userData.district}, `}{userData?.state && `${userData.state}, `}{userData?.country || 'N/A'}<br/>
                        {userData?.pincode && `PIN: ${userData.pincode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message History Section */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-primary-600" />
                    Message History
                  </h3>
                </div>
                <div className="space-y-4">
                  {myMessages.length > 0 ? (
                    myMessages.map(msg => (
                      <div key={msg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            msg.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {msg.status}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.sent_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No messages received yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Status & Groups (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Security Status */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  Account Status
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${userData?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{userData?.status}</span>
                    </div>
                    {userData?.status !== 'ACTIVE' && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-2xl flex gap-3"><p className="text-xs text-amber-700 leading-relaxed">{userData?.status === 'PENDING_VERIFICATION' ? 'Please verify your phone number to proceed.' : 'Your account is waiting for administrator approval.'}</p></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Memberships */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  My Groups
                </h3>
                <div className="space-y-4">
                  {myGroups.length > 0 ? (
                    myGroups.map(group => (
                      <div key={group.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-slate-900">{group.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            group.my_role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'
                          }`}>
                            {group.my_role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{group.description}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Joined: {new Date(group.joined_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-xs font-medium">Not a member of any groups</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles & Joining Info */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  System Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase">Joined On</span>
                    <span className="text-sm font-bold text-slate-700">{new Date(userData?.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-3">System Roles</span>
                    <div className="flex flex-wrap gap-2">
                      {userData?.roles?.map((role, i) => (
                        <span key={i} className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-full uppercase">{role}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
