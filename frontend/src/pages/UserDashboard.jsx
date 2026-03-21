import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import api from '../services/api';
import axios from 'axios';
import { 
  User, Mail, Phone, Shield, Clock, AlertCircle, Edit2, 
  CheckCircle, Send, X, Terminal, ChevronDown, ChevronUp, 
  Lock, Key, MapPin, Globe, Home, Users, MessageSquare, 
  History, Settings, LogOut, Menu
} from 'lucide-react';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

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

  // Fetch Countries
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

  // Fetch States
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

  // Fetch Districts
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
      const res = await authService.requestPasswordChange();
      setPassOtpSent(true);
      setSuccessMessage('OTP sent to your registered phone number.');
      if (res.result?.gatewayResponse) setGatewayResponse(res.result.gatewayResponse);
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
      await authService.confirmPasswordChange(passOtp, passwords.new);
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userData = profile || user;

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-20 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <div className={`p-6 border-b border-slate-50 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 flex-shrink-0">
              <Settings className="w-6 h-6 text-white" />
            </div>
            {!isSidebarCollapsed && <h1 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">User Portal</h1>}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 ${isSidebarCollapsed ? 'mt-2' : ''}`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccessMessage('');
              }}
              title={isSidebarCollapsed ? tab.label : ''}
              className={`w-full flex items-center rounded-2xl font-bold transition-all ${
                isSidebarCollapsed ? 'justify-center py-4' : 'px-4 py-3.5 gap-4'
              } ${
                activeTab === tab.id 
                  ? 'bg-primary-50 text-primary-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-primary-600' : 'text-slate-400'}`} />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {userData?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{userData?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                {userData?.name?.[0] || 'U'}
              </div>
              <button 
                onClick={logout}
                title="Sign Out"
                className="p-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 transition-all duration-300">
        <div className="p-12 max-w-5xl mx-auto lg:mx-0">
          {/* Header Info */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{activeTab === 'profile' ? 'My Profile' : activeTab}</h2>
              <p className="text-slate-500 mt-1 font-medium">Manage and view your {activeTab} information</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
                userData?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {userData?.status}
              </span>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-8 text-red-700 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
              <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-4 mb-8 text-green-700 bg-green-50 border border-green-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{successMessage}</p>
              <button onClick={() => setSuccessMessage('')} className="ml-auto p-1 hover:bg-green-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* TAB CONTENT: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-10">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-primary-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-primary-200">
                        <User className="w-12 h-12" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900">{userData?.name || 'User'}</h3>
                        <p className="text-lg text-slate-500 font-medium">{userData?.email}</p>
                      </div>
                    </div>
                    {!isEditingProfile && (
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid gap-8 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                          <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Country</label>
                          <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold appearance-none" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value, state: '', district: ''})}>
                            <option value="">Select Country</option>
                            {countries.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">State</label>
                          <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold appearance-none" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value, district: ''})} disabled={!editForm.country}>
                            <option value="">Select State</option>
                            {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">District</label>
                          <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold appearance-none" value={editForm.district} onChange={(e) => setEditForm({...editForm, district: e.target.value})} disabled={!editForm.state}>
                            <option value="">Select District</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Street Address</label>
                          <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PIN / Postal Code</label>
                          <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold" value={editForm.pincode} onChange={(e) => setEditForm({...editForm, pincode: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button type="submit" disabled={actionLoading} className="px-8 py-3.5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-xl shadow-primary-200 disabled:opacity-50">
                          Save Changes
                        </button>
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-8">
                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Phone className="w-6 h-6" /></div>
                          <div>
                            <div className="flex items-center gap-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                              <button onClick={() => { setIsEditingPhone(true); setGatewayResponse(null); }} className="text-[10px] font-black text-primary-600 uppercase hover:underline">Change</button>
                            </div>
                            {isEditingPhone ? (
                              <div className="mt-2 space-y-3 max-w-sm">
                                <div className="flex gap-2">
                                  <input type="tel" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} disabled={phoneOtpSent} placeholder="91..." />
                                  {!phoneOtpSent ? (
                                    <button onClick={handleRequestPhoneOtp} disabled={actionLoading || !newPhone} className="px-4 py-2 bg-primary-600 text-white text-xs font-black rounded-xl uppercase">OTP</button>
                                  ) : (
                                    <button onClick={() => {setPhoneOtpSent(false); setPhoneOtp('');}} className="p-2 bg-slate-100 text-slate-500 rounded-xl"><X className="w-4 h-4" /></button>
                                  )}
                                </div>
                                {phoneOtpSent && (
                                  <div className="flex gap-2">
                                    <input type="text" maxLength="6" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[0.3em]" placeholder="000000" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                                    <button onClick={handleVerifyPhone} disabled={actionLoading || phoneOtp.length !== 6} className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl uppercase">Verify</button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xl font-bold text-slate-900">{userData?.phone_number || 'None'}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Home className="w-6 h-6" /></div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                            <p className="text-lg font-bold text-slate-900 leading-tight">
                              {userData?.address || 'N/A'}<br/>
                              <span className="text-slate-500 text-sm">
                                {userData?.district && `${userData.district}, `}{userData?.state && `${userData.state}, `}{userData?.country || 'N/A'}<br/>
                                {userData?.pincode && `PIN: ${userData.pincode}`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Member Since</span>
                          <span className="font-bold text-slate-700">{new Date(userData?.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Permissions</span>
                          <div className="flex flex-wrap gap-2">
                            {userData?.roles?.map((role, i) => (
                              <span key={i} className="px-4 py-1.5 bg-white text-primary-600 text-[10px] font-black rounded-xl shadow-sm border border-slate-100 uppercase tracking-tighter">{role}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MY GROUPS SECTION INSIDE PROFILE */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <Users className="w-6 h-6 text-primary-600" />
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">My Groups</h3>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {myGroups.length > 0 ? (
                    myGroups.map(group => (
                      <div key={group.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-black">
                            {group.name[0]}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            group.my_role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {group.my_role}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{group.name}</h4>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6">{group.description}</p>
                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</span>
                          <span className="text-xs font-bold text-slate-600">{new Date(group.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">No groups found</h3>
                      <p className="text-slate-400 font-medium text-sm mt-1">You are not a member of any groups.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Change Password</h3>
                      <p className="text-slate-500 font-medium">Protect your account with a secure password</p>
                    </div>
                  </div>
                  {!isChangingPassword && (
                    <button 
                      onClick={() => setIsChangingPassword(true)}
                      className="px-6 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100"
                    >
                      Update Password
                    </button>
                  )}
                </div>

                {isChangingPassword ? (
                  <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <input 
                          type="password" 
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                          placeholder="••••••••"
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          disabled={passOtpSent}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                          placeholder="••••••••"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          disabled={passOtpSent}
                        />
                      </div>
                    </div>

                    {!passOtpSent ? (
                      <div className="flex gap-4">
                        <button 
                          onClick={handleRequestPassOtp}
                          disabled={actionLoading || !passwords.new || passwords.new !== passwords.confirm}
                          className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition shadow-xl disabled:opacity-50"
                        >
                          Request OTP via WhatsApp
                        </button>
                        <button 
                          onClick={() => { setIsChangingPassword(false); setPasswords({ new: '', confirm: '' }); }}
                          className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500 font-bold">Verification code sent to <span className="text-primary-600">{userData?.phone_number}</span></p>
                          <button onClick={() => setPassOtpSent(false)} className="text-xs font-black text-primary-600 uppercase hover:underline">Edit Password</button>
                        </div>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            maxLength="6" 
                            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-black tracking-[0.8em] text-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
                            placeholder="000000"
                            value={passOtp}
                            onChange={(e) => setPassOtp(e.target.value)}
                          />
                          <button 
                            onClick={handleVerifyPassword}
                            disabled={actionLoading || passOtp.length !== 6}
                            className="px-10 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition shadow-xl shadow-green-100 disabled:opacity-50"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700 uppercase tracking-tighter">Account Secured</p>
                      <p className="text-sm text-slate-500 font-medium">Authentication is managed locally via your registered mobile device</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                  <button onClick={fetchData} className="p-2 hover:bg-slate-200 rounded-xl transition text-slate-400"><History className="w-5 h-5" /></button>
                </div>
                <div className="divide-y divide-slate-50">
                  {myMessages.length > 0 ? (
                    myMessages.map(msg => (
                      <div key={msg.id} className="p-8 hover:bg-slate-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                              msg.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {msg.status}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(msg.sent_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <MessageSquare className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No activity records</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GATEWAY DEBUG AREA */}
          {gatewayResponse && (
            <div className="mt-12 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-8 duration-500">
              <button 
                onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                className="w-full bg-slate-800/50 px-8 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 text-slate-300">
                  <Terminal className="w-5 h-5 text-primary-400" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Gateway Debug Information</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                    gatewayResponse.status >= 200 && gatewayResponse.status < 300 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    HTTP {gatewayResponse.status}
                  </span>
                  {isDebugExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {isDebugExpanded && (
                <div className="p-8 overflow-x-auto max-h-[400px] custom-scrollbar">
                  <pre className="text-blue-400 font-mono text-sm leading-relaxed">
                    {JSON.stringify(gatewayResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
