import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import api from '../services/api';
import axios from 'axios';
import { 
  User, Mail, Phone, Shield, Clock, AlertCircle, Edit2, 
  CheckCircle, Send, X, Terminal, ChevronDown, ChevronUp, 
  Lock, Key, MapPin, Globe, Home, Users, MessageSquare, 
  History, Settings, LogOut, Menu, Zap, Fingerprint, Activity, BarChart2, Link, Trash2, RefreshCw
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl', error, successMessage }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-[2.5rem] w-full ${maxWidth} p-10 shadow-2xl my-8 border border-slate-100 animate-in zoom-in-95 duration-300 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{title}</h3>
            {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* In-Modal Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 text-red-800 bg-red-50 border border-red-100 rounded-xl animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 p-4 mb-6 text-green-800 bg-green-50 border border-green-100 rounded-xl animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-bold">{successMessage}</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

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

  // Polls State
  const [polls, setPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [isEditingPoll, setIsEditingPoll] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [newPoll, setNewPoll] = useState({ 
    title: '', description: '', type: 'GENERAL', access_type: 'PUBLIC', 
    options: ['', ''], group_id: '', candidates: [{ name: '', photo_url: '', manifesto: '', biography: '' }] 
  });
  const [votingData, setVotingData] = useState({ pollId: null, phone_number: '', otp: '', option_selected: '', candidate_id: null });
  const [voteOtpSent, setVoteOtpSent] = useState(false);
  const [pollResults, setPollResults] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const handleUpdatePoll = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await authService.updateAdvancedPoll(selectedPoll.id, selectedPoll);
      setSuccessMessage('Poll updated successfully!');
      setIsEditingPoll(false);
      setSelectedPoll(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update poll.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePollStatus = async (poll) => {
    setActionLoading(true);
    try {
      const newStatus = poll.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      await authService.updateAdvancedPoll(poll.id, { ...poll, status: newStatus });
      setSuccessMessage(`Poll ${newStatus === 'OPEN' ? 'Enabled' : 'Disabled'}!`);
      fetchData();
    } catch (err) {
      setError('Failed to toggle poll status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    setActionLoading(true);
    try {
      await authService.deleteAdvancedPoll(id);
      setSuccessMessage('Poll deleted successfully!');
      fetchData();
    } catch (err) {
      setError('Failed to delete poll.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyPollLink = (id) => {
    const link = `${window.location.origin}/#/poll/${id}`;
    navigator.clipboard.writeText(link);
    setSuccessMessage('Poll link copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchData = async () => {
    try {
      const profileData = await authService.getProfile();
      setProfile(profileData || null);
      setNewPhone(profileData?.phone_number || '');
      setEditForm({
        name: profileData?.name || '',
        address: profileData?.address || '',
        country: profileData?.country || '',
        state: profileData?.state || '',
        district: profileData?.district || '',
        pincode: profileData?.pincode || ''
      });
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabSpecificData = async (tab) => {
    try {
      if (tab === 'profile' && myGroups.length === 0) {
        const groupsData = await authService.getMyGroups();
        setMyGroups(groupsData || []);
      } else if (tab === 'messages' && myMessages.length === 0) {
        const messagesData = await authService.getMyMessages();
        setMyMessages(messagesData || []);
      } else if (tab === 'polls' && polls.length === 0) {
        const pollsData = await authService.getPublicLatestPolls();
        setPolls(pollsData || []);
      }
    } catch (err) {
      console.error(`Failed to load data for tab: ${tab}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTabSpecificData(activeTab);
  }, [activeTab]);

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

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await authService.createAdvancedPoll(newPoll);
      setSuccessMessage('Poll created successfully!');
      setShowCreatePoll(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestVoteOtp = async () => {
    if (!votingData.phone_number) return;
    setActionLoading(true);
    try {
      await authService.requestVoteOtp(votingData.pollId, votingData.phone_number);
      setVoteOtpSent(true);
      setSuccessMessage('OTP sent for verification.');
    } catch (err) {
      setError('Failed to send voting OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAndVote = async () => {
    setActionLoading(true);
    try {
      const res = await authService.verifyAndVote(votingData);
      if (res.already_voted) {
        setSuccessMessage(res.message);
        // Don't close immediately so they can see the message/vote
      } else {
        setSuccessMessage('Vote cast successfully!');
        setTimeout(() => {
          setSelectedPoll(null);
          setVoteOtpSent(false);
          setSuccessMessage('');
        }, 2000);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Voting failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const userData = profile || user;

  const tabs = [
    { id: 'profile', label: 'Identity', icon: Fingerprint },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'polls', label: 'Polls', icon: BarChart2 },
    { id: 'messages', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-800 font-sans selection:bg-primary-100">
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 flex flex-col sticky top-0 h-screen z-30 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 active:scale-95 cursor-pointer">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">WA Web Tool</h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Portal</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccessMessage('');
              }}
              title={isSidebarCollapsed ? tab.label : ''}
              className={`w-full flex items-center rounded-xl font-semibold transition-all duration-200 group ${
                isSidebarCollapsed ? 'justify-center py-4' : 'px-4 py-3 gap-3'
              } ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!isSidebarCollapsed && <span className="text-sm whitespace-nowrap">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full mb-4 flex items-center justify-center p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-all border border-slate-700/50"
          >
            <Menu className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>

          {!isSidebarCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <div className="w-9 h-9 bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {userData?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{userData?.name || 'User'}</p>
                  <p className="text-[9px] text-slate-500 truncate uppercase tracking-tighter">{userData?.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-9 h-9 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center font-bold text-sm border border-slate-700">
                {userData?.name?.[0] || 'U'}
              </div>
              <button 
                onClick={logout}
                title="Sign Out"
                className="p-3 rounded-xl text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 lg:p-10 max-w-5xl mx-auto">
          {/* Header Info */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">User Dashboard</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'profile' ? 'Identity Management' : activeTab === 'messages' ? 'Activity Log' : activeTab}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200">
              <span className={`w-1.5 h-1.5 rounded-full ${userData?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500">{userData?.status}</span>
            </div>
          </div>

          {/* Alert Messages */}
          {error && !showCreatePoll && !selectedPoll && !isEditingProfile && !isEditingPhone && !isChangingPassword && (
            <div className="flex items-center gap-3 p-4 mb-6 text-red-800 bg-red-50 border border-red-100 rounded-xl animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold">{error}</p>
              <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
            </div>
          )}

          {successMessage && !showCreatePoll && !selectedPoll && !isEditingProfile && !isEditingPhone && !isChangingPassword && (
            <div className="flex items-center gap-3 p-4 mb-6 text-green-800 bg-green-50 border border-green-100 rounded-xl animate-in fade-in duration-300">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold">{successMessage}</p>
              <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
            </div>
          )}

          {/* TAB CONTENT: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary-600 to-indigo-600 relative">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                </div>
                
                <div className="px-8 pb-8 relative">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-8 gap-4">
                    <div className="flex items-end gap-5">
                      <div className="w-24 h-24 bg-white p-1.5 rounded-2xl shadow-lg border border-slate-100">
                        <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden">
                          {userData?.name ? (
                            <span className="text-3xl font-black text-primary-600">{userData?.name?.[0]}</span>
                          ) : (
                            <User className="w-10 h-10 text-slate-300" />
                          )}
                        </div>
                      </div>
                      <div className="mb-1">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{userData?.name || 'User Name'}</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {userData?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isEditingProfile && (
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2 uppercase tracking-wider"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Profile
                        </button>
                      )}
                      <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="px-5 py-2.5 bg-primary-600 text-white text-[11px] font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md active:scale-95 flex items-center gap-2 uppercase tracking-wider"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Password
                      </button>
                    </div>
                  </div>

                  {/* PROFILE CARD BODY */}
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                            <button onClick={() => { setIsEditingPhone(true); setGatewayResponse(null); }} className="text-[9px] font-bold text-primary-600 uppercase hover:underline">Change</button>
                          </div>
                          <p className="text-base font-bold text-slate-800">{userData?.phone_number || 'None'}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Location</label>
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {userData?.address || 'N/A'}<br/>
                            <span className="text-slate-400 text-[11px] font-medium">
                              {userData?.district && `${userData.district}, `}{userData?.state && `${userData.state}, `}{userData?.country || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl space-y-5 border border-slate-100 shadow-inner">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Member Since</span>
                        <span className="text-sm font-bold text-slate-700">{userData?.created_at ? new Date(userData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Access Roles</span>
                        <div className="flex flex-wrap gap-2">
                          {userData?.roles?.map((role, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-primary-600 text-[9px] font-black rounded-lg border border-slate-200 shadow-sm uppercase">{role}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GROUPS SECTION */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 px-2">
                  <Users className="w-4 h-4 text-primary-600" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Organization Groups</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myGroups.length > 0 ? (
                    myGroups.map(group => (
                      <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-9 h-9 bg-slate-50 text-primary-600 rounded-xl flex items-center justify-center font-black text-lg border border-slate-100 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                            {group?.name?.[0]}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            group.my_role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {group.my_role}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mb-1">{group.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 font-medium">{group.description || 'Organizational unit group member.'}</p>
                        <div className="pt-4 border-t border-slate-50 flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase">Since {group?.joined_at ? new Date(group.joined_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
                      <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">No organizational groups assigned.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shadow-inner">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Security & Credentials</h3>
                      <p className="text-xs text-slate-500 font-medium">Protect your access with multi-factor auth</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="px-5 py-2 bg-primary-600 text-white text-[10px] font-black rounded-lg hover:bg-primary-700 transition shadow-sm uppercase tracking-widest"
                  >
                    Update Password
                  </button>
                </div>

                <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-5 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                  <Fingerprint className="w-6 h-6 text-slate-300 group-hover:text-primary-500 transition-colors" />
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5">Password Protection Active</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">System manages credentials locally. Changes require WhatsApp multi-factor proofing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ACTIVITY */}
          {activeTab === 'messages' && (
            <div className="animate-in fade-in duration-500 max-w-4xl">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary-600" />
                    <h3 className="text-base font-black text-slate-900 tracking-tight">System Notifications</h3>
                  </div>
                  <button onClick={fetchData} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-primary-600"><History className="w-4 h-4" /></button>
                </div>
                <div className="divide-y divide-slate-50">
                  {myMessages.length > 0 ? (
                    myMessages.map(msg => (
                      <div key={msg.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase ${
                              msg.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {msg.status}
                            </span>
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {msg?.sent_at ? new Date(msg.sent_at).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 px-5 py-4 rounded-xl border border-slate-100 shadow-inner">
                          <p className="text-slate-700 font-medium text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <MessageSquare className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Recent Activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: POLLS */}
          {activeTab === 'polls' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Polls & Elections</h3>
                  <p className="text-xs text-slate-500 font-medium">Create or participate in community decisions</p>
                </div>
                {(userData?.roles?.includes('Admin') || myGroups.some(g => g.my_role === 'ADMIN')) && (
                  <button 
                    onClick={() => setShowCreatePoll(true)}
                    className="px-6 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 uppercase text-xs tracking-widest"
                  >
                    Create New Poll
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {polls.map(poll => (
                  <div key={poll.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                        {poll.type}
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border ${poll.status === 'OPEN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {poll.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{poll.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium">{poll.description}</p>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setSelectedPoll(poll);
                          setVotingData({ ...votingData, pollId: poll.id });
                        }}
                        className="w-full py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                      >
                        View & Vote
                      </button>

                      {(userData?.id === poll.creator_id || userData?.roles?.includes('Admin')) && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          <button 
                            onClick={() => copyPollLink(poll.id)}
                            className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 text-[9px] font-bold rounded-lg hover:bg-slate-100 uppercase tracking-widest border border-slate-200"
                          >
                            <Link className="w-3 h-3" /> Link
                          </button>
                          <button 
                            onClick={() => { setSelectedPoll(poll); setIsEditingPoll(true); }}
                            className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-primary-600 text-[9px] font-bold rounded-lg hover:bg-primary-50 uppercase tracking-widest border border-slate-200"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleTogglePollStatus(poll)}
                            className={`flex items-center justify-center gap-2 py-2 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${poll.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}`}
                          >
                            <RefreshCw className={`w-3 h-3 ${actionLoading ? 'animate-spin' : ''}`} /> {poll.status === 'OPEN' ? 'Close' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => handleDeletePoll(poll.id)}
                            className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 text-[9px] font-bold rounded-lg hover:bg-red-100 uppercase tracking-widest border border-red-100"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE POLL MODAL */}
          <Modal
            isOpen={showCreatePoll}
            onClose={() => setShowCreatePoll(false)}
            title="New Decision Unit"
            subtitle="Reactive Engine Configuration"
            error={error}
            successMessage={successMessage}
          >
            <form onSubmit={handleCreatePoll} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={newPoll.title} onChange={(e) => setNewPoll({...newPoll, title: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Associated Group</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" 
                    value={newPoll.group_id} 
                    onChange={(e) => setNewPoll({...newPoll, group_id: e.target.value})}
                    required={!userData?.roles?.includes('Admin')}
                  >
                    <option value="">Global / No Group</option>
                    {myGroups.filter(g => g.my_role === 'ADMIN' || userData?.roles?.includes('Admin')).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-sm resize-none" rows="2" placeholder="Describe the purpose of this poll..." value={newPoll.description} onChange={(e) => setNewPoll({...newPoll, description: e.target.value})} />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={newPoll.type} onChange={(e) => setNewPoll({...newPoll, type: e.target.value})}>
                    <option value="GENERAL">General Poll</option>
                    <option value="ELECTION">Election Type</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                  <div className="flex gap-4">
                    {['PUBLIC', 'CLOSED'].map(acc => (
                      <button key={acc} type="button" onClick={() => setNewPoll({...newPoll, access_type: acc})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newPoll.access_type === acc ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>{acc}</button>
                    ))}
                  </div>
                </div>
              </div>

              {newPoll.type === 'GENERAL' ? (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Voting Options</label>
                  {newPoll.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" placeholder={`Option ${i+1}`} value={opt} onChange={(e) => {
                        const opts = [...newPoll.options];
                        opts[i] = e.target.value;
                        setNewPoll({...newPoll, options: opts});
                      }} />
                      {newPoll.options.length > 2 && (
                        <button type="button" onClick={() => setNewPoll({...newPoll, options: newPoll.options.filter((_, idx) => idx !== i)})} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">+ Add Option</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Candidates</label>
                  {newPoll.candidates.map((cand, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative group">
                      <button type="button" onClick={() => setNewPoll({...newPoll, candidates: newPoll.candidates.filter((_, idx) => idx !== i)})} className="absolute top-4 right-4 p-1.5 bg-white border border-slate-200 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3.5 h-3.5" /></button>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input type="text" placeholder="Candidate Name" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" value={cand.name} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].name = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                        <input type="url" placeholder="Photo URL" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" value={cand.photo_url} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].photo_url = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                      </div>
                      <textarea placeholder="Manifesto" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" value={cand.manifesto} onChange={(e) => {
                        const cands = [...newPoll.candidates];
                        cands[i].manifesto = e.target.value;
                        setNewPoll({...newPoll, candidates: cands});
                      }} />
                      <textarea placeholder="Short Biography" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" value={cand.biography} onChange={(e) => {
                        const cands = [...newPoll.candidates];
                        cands[i].biography = e.target.value;
                        setNewPoll({...newPoll, candidates: cands});
                      }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewPoll({...newPoll, candidates: [...newPoll.candidates, { name: '', photo_url: '', manifesto: '', biography: '' }]})} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">+ Add Candidate</button>
                </div>
              )}

              <div className="pt-6">
                <button type="submit" disabled={actionLoading} className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">Publish Decision Unit</button>
              </div>
            </form>
          </Modal>

          {/* VOTE MODAL */}
          <Modal
            isOpen={!!selectedPoll && !isEditingPoll}
            onClose={() => { setSelectedPoll(null); setVoteOtpSent(false); }}
            title={selectedPoll?.title}
            subtitle={`Status: ${selectedPoll?.status} | Access: ${selectedPoll?.access_type}`}
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedPoll?.description}</p>
              </div>

              {!voteOtpSent ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Required</label>
                    <div className="flex gap-2">
                      <input type="tel" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="Mobile Number (e.g. 91...)" value={votingData.phone_number} onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} />
                      <button onClick={handleRequestVoteOtp} disabled={actionLoading || !votingData.phone_number} className="px-8 bg-primary-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary-700 transition shadow-lg">Get OTP</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="space-y-6">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Cast Your Identity Unit</label>
                    <div className="grid gap-4">
                      {selectedPoll?.type === 'GENERAL' ? (
                        selectedPoll.options.map(opt => (
                          <button key={opt} onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})} className={`p-5 rounded-2xl border-2 text-left transition-all ${votingData.option_selected === opt ? 'border-primary-600 bg-primary-50 shadow-md ring-4 ring-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${votingData.option_selected === opt ? 'border-primary-600' : 'border-slate-300'}`}>
                                {votingData.option_selected === opt && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>}
                              </div>
                              <span className="text-sm font-black text-slate-800">{opt}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="grid gap-4">
                          {selectedPoll?.candidates?.map(cand => (
                            <button key={cand.id} onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})} className={`p-6 rounded-3xl border-2 text-left transition-all flex gap-5 ${votingData.candidate_id === cand.id ? 'border-primary-600 bg-primary-50 shadow-md ring-4 ring-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                              <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-inner">
                                {cand.photo_url ? <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-base font-black text-slate-900 uppercase tracking-tight">{cand.name}</h5>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${votingData.candidate_id === cand.id ? 'border-primary-600' : 'border-slate-300'}`}>
                                    {votingData.candidate_id === cand.id && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>}
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">{cand.manifesto}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input type="text" maxLength="6" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[0.8em] text-xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={votingData.otp} onChange={(e) => setVotingData({...votingData, otp: e.target.value})} />
                      <button onClick={handleVerifyAndVote} disabled={actionLoading || votingData.otp.length !== 6 || (!votingData.option_selected && !votingData.candidate_id)} className="px-8 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all">Verify & Cast</button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-black uppercase text-center tracking-[0.2em]">One vote per mobile unit • Finalized on submission</p>
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* EDIT POLL MODAL */}
          <Modal
            isOpen={isEditingPoll}
            onClose={() => { setIsEditingPoll(false); setSelectedPoll(null); }}
            title="Edit Decision Unit"
            subtitle="Update Configuration"
            error={error}
            successMessage={successMessage}
          >
            {selectedPoll && (
              <form onSubmit={handleUpdatePoll} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={selectedPoll.title} onChange={(e) => setSelectedPoll({...selectedPoll, title: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-sm resize-none" rows="2" value={selectedPoll.description} onChange={(e) => setSelectedPoll({...selectedPoll, description: e.target.value})} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={selectedPoll.status} onChange={(e) => setSelectedPoll({...selectedPoll, status: e.target.value})}>
                      <option value="OPEN">Open (Accepting Votes)</option>
                      <option value="CLOSED">Closed (Archived)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={selectedPoll.access_type} onChange={(e) => setSelectedPoll({...selectedPoll, access_type: e.target.value})}>
                      <option value="PUBLIC">Public (Any Number)</option>
                      <option value="CLOSED">Closed (Group Members Only)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <button type="submit" disabled={actionLoading} className="flex-1 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all">Save Changes</button>
                  <button type="button" onClick={() => { setIsEditingPoll(false); setSelectedPoll(null); }} className="px-8 py-4 bg-slate-100 text-slate-500 text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                </div>
              </form>
            )}
          </Modal>

          {/* EDIT PROFILE MODAL */}
          <Modal
            isOpen={isEditingProfile}
            onClose={() => setIsEditingProfile(false)}
            title="Update Identity"
            subtitle="Organizational Profile Metadata"
            error={error}
            successMessage={successMessage}
          >
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-sm" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-sm" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value, state: '', district: ''})}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm disabled:opacity-50" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value, district: ''})} disabled={!editForm.country}>
                    <option value="">Select State</option>
                    {states.map(s => <option key={s.state_code || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm disabled:opacity-50" value={editForm.district} onChange={(e) => setEditForm({...editForm, district: e.target.value})} disabled={!editForm.state}>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" value={editForm.pincode} onChange={(e) => setEditForm({...editForm, pincode: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-primary-600 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-900/20 disabled:opacity-50">
                  Save Identity
                </button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-3 bg-slate-100 text-slate-500 text-xs font-black rounded-xl uppercase tracking-widest hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          </Modal>

          {/* CHANGE PHONE MODAL */}
          <Modal
            isOpen={isEditingPhone}
            onClose={() => { setIsEditingPhone(false); setPhoneOtpSent(false); }}
            title="Change Mobile Unit"
            subtitle="Secure Communications Migration"
            maxWidth="max-w-md"
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-6">
              {!phoneOtpSent ? (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Mobile Number</label>
                  <div className="flex gap-2">
                    <input type="tel" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="91..." />
                    <button onClick={handleRequestPhoneOtp} disabled={actionLoading || !newPhone} className="px-6 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-800 transition shadow-lg">Get OTP</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-primary-600" />
                    <p className="text-[10px] font-bold text-primary-700 uppercase tracking-tight">Code sent to: {newPhone}</p>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Verification Packet</label>
                    <input type="text" maxLength="6" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[0.8em] text-2xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                    <button onClick={handleVerifyPhone} disabled={actionLoading || phoneOtp.length !== 6} className="w-full py-4 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all">Verify & Update</button>
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* CHANGE PASSWORD MODAL */}
          <Modal
            isOpen={isChangingPassword}
            onClose={() => { setIsChangingPassword(false); setPassOtpSent(false); }}
            title="Security Vault"
            subtitle="Multi-Factor Credential Update"
            maxWidth="max-w-md"
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-6">
              {!passOtpSent ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                    </div>
                  </div>
                  <button onClick={handleRequestPassOtp} disabled={actionLoading || !passwords.new || passwords.new !== passwords.confirm} className="w-full py-4 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">Request OTP via WhatsApp</button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-2">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Identity ProofingPacket</label>
                    <input type="text" maxLength="6" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[0.8em] text-2xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={passOtp} onChange={(e) => setPassOtp(e.target.value)} />
                    <button onClick={handleVerifyPassword} disabled={actionLoading || passOtp.length !== 6} className="w-full py-4 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all">Confirm Change</button>
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* GATEWAY DEBUG AREA */}
          {gatewayResponse && (
            <div className="mt-10 bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3 text-primary-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Gateway Log</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold text-white tracking-widest uppercase">HTTP {gatewayResponse.status}</span>
                  {isDebugExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>
              {isDebugExpanded && (
                <div className="p-6 bg-black/30 border-t border-slate-800 overflow-x-auto max-h-[400px] custom-scrollbar">
                  <pre className="text-primary-300/70 font-mono text-[10px] leading-relaxed">
                    {JSON.stringify(gatewayResponse.data, null, 4)}
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
