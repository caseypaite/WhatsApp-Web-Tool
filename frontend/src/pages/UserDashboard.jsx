import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import api from '../services/api';
import axios from 'axios';
import { 
  User, Mail, Phone, Shield, Clock, AlertCircle, Edit2, 
  CheckCircle, Send, X, Terminal, ChevronDown, ChevronUp, 
  Lock, Key, MapPin, Globe, Home, Users, MessageSquare, 
  History, Settings, LogOut, Menu, Zap, Fingerprint, Activity, BarChart2, Link, Trash2, RefreshCw, ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
          {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest">{successMessage}</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [profile, setProfile] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [myMessages, setMyMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [flash, setFlash] = useState(null);

  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 5000);
  };
  
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
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [waGroups, setWaGroups] = useState([]);
  const [newPoll, setNewPoll] = useState({
    title: '', description: '', type: 'GENERAL', access_type: 'PUBLIC',
    options: ['', ''], group_id: '', wa_jid: '', candidates: [{ name: '', photo_url: '', manifesto: '', biography: '' }],
    starts_at: '', ends_at: '', background_image_url: ''
  });

  const [viewingResultsId, setViewingResultsId] = useState(null);
  const [advancedResults, setAdvancedResults] = useState(null);

  // Voting State
  const [votingData, setVotingData] = useState({ pollId: null, phone_number: '', otp: '', option_selected: '', candidate_id: null });
  const [voteOtpSent, setVoteOtpSent] = useState(false);
  const [voteNeedsConfirmation, setVoteNeedsConfirmation] = useState(false);
  const [isViewingVote, setIsViewingVote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditPoll = (poll) => {
    navigate(`/poll/edit/${poll.id}`);
  };


  useEffect(() => {
    if (selectedPoll) {
      setVotingData(prev => ({
        ...prev,
        pollId: selectedPoll.id,
        phone_number: '',
        otp: '',
        option_selected: '',
        candidate_id: null
      }));
      setVoteOtpSent(false);
      setVoteNeedsConfirmation(false);
      setIsViewingVote(false);
    }
  }, [selectedPoll]);

  const handleTogglePollStatus = async (poll) => {
    setActionLoading(true);
    try {
      const newStatus = poll.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      await authService.updateAdvancedPoll(poll.id, { ...poll, status: newStatus });
      fetchData();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm('Destroy this decision node? Action is irreversible.')) return;
    setActionLoading(true);
    try {
      await authService.deleteAdvancedPoll(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete poll.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyPollLink = (id) => {
    const link = `${window.location.origin}/#/poll/${id}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          showFlash('Poll link copied to clipboard!');
        })
        .catch(() => {
          fallbackCopyTextToClipboard(link);
        });
    } else {
      fallbackCopyTextToClipboard(link);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure the textarea is not visible but part of the DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }

    if (successful) {
      showFlash('Poll link copied to clipboard!');
    } else {
      setError('Manual copy required: ' + text);
    }
    
    document.body.removeChild(textArea);
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
      
      await fetchTabSpecificData(activeTab);
    } catch (err) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabSpecificData = async (tab) => {
    try {
      if (tab === 'groups' && myGroups.length === 0) {
        const groupsData = await authService.getMyGroups();
        setMyGroups(groupsData || []);
      } else if (tab === 'messages' && myMessages.length === 0) {
        const messagesData = await authService.getMyMessages();
        setMyMessages(messagesData || []);
      } else if (tab === 'polls') {
        const [pollsData, waChats] = await Promise.all([
          authService.getEligiblePolls(),
          authService.getWhatsappChats().catch(() => [])
        ]);
        setPolls(pollsData || []);
        // Only managed WA groups
        setWaGroups(waChats.filter(c => c.isGroup && c.isAdmin) || []);
      }
    } catch (err) {
      console.error(`Failed to load data for tab: ${tab}`);
    }
  };

  useEffect(() => {
    if (activeTab) fetchTabSpecificData(activeTab);
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await authService.updateProfile(editForm);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!newPhone) return;
    setActionLoading(true);
    try {
      await authService.requestPhoneUpdate(newPhone);
      setPhoneOtpSent(true);
      setSuccessMessage('OTP sent to your new number.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    setActionLoading(true);
    try {
      await authService.verifyPhoneUpdate(newPhone, phoneOtp);
      setSuccessMessage('Phone number updated!');
      setIsEditingPhone(false);
      setPhoneOtpSent(false);
      setPhoneOtp('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPasswordOtp = async () => {
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
      return;
    }
    setActionLoading(true);
    try {
      await authService.requestPasswordChange();
      setPassOtpSent(true);
      setSuccessMessage('OTP sent to your registered number.');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    setActionLoading(true);
    try {
      await authService.verifyPasswordChange(passwords.new, passOtp);
      setSuccessMessage('Password changed successfully!');
      setIsChangingPassword(false);
      setPassOtpSent(false);
      setPassOtp('');
      setPasswords({ new: '', confirm: '' });
    } catch (err) {
      setError('Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await authService.createAdvancedPoll(newPoll);
      setSuccessMessage('Poll created successfully!');
      setShowCreatePoll(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Creation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewAdvancedResults = async (id) => {
    setViewingResultsId(id);
    try {
      const data = await authService.getPollResultsAdvanced(id);
      setAdvancedResults(data);
    } catch (err) {
      setError('Failed to load results.');
    }
  };

  const handleRequestVoteOtp = async (confirmView = false) => {
    if (!votingData.phone_number) {
      setError('Phone number is required.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const res = await authService.requestVoteOtp(selectedPoll.id, votingData.phone_number, confirmView);
      if (res.already_voted && !confirmView) {
        setVoteNeedsConfirmation(true);
        setSuccessMessage(res.message);
        return;
      }
      setVoteOtpSent(true);
      setVoteNeedsConfirmation(false);
      setIsViewingVote(confirmView || res.already_voted);
      setSuccessMessage('OTP sent for verification.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAndVote = async () => {
    if (!isViewingVote && !votingData.option_selected && !votingData.candidate_id) {
      setError('Please select an option before finalizing.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await authService.verifyAndVote(votingData);
      if (res.already_voted) {
        setSuccessMessage('Identity verified. Loading your previous decision...');
        setTimeout(() => {
          setSelectedPoll(null);
          setVoteOtpSent(false);
          setIsViewingVote(false);
          setSuccessMessage('');
          navigate(`/poll/${selectedPoll.id}/results`);
        }, 2000);
      } else {
        setSuccessMessage('Decision recorded successfully!');
        setTimeout(() => {
          setSelectedPoll(null);
          setVoteOtpSent(false);
          setIsViewingVote(false);
          setSuccessMessage('');
          navigate(`/poll/${selectedPoll.id}/results`);
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
      {/* Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-500 ease-in-out z-40 fixed lg:static h-full shadow-2xl ${isSidebarCollapsed ? 'w-20' : 'w-72'} ${isSidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 mb-8 flex items-center justify-center">
            <div className={`flex items-center gap-3 transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-900/50"><Zap className="w-6 h-6 text-white" /></div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">AppStack</h1>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsSidebarCollapsed(true); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-xl shadow-primary-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <tab.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isSidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <div className={`mb-4 p-4 bg-slate-800/50 rounded-[2rem] transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-black text-white text-xs border border-slate-600">
                  {userData?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{userData?.name || 'User'}</p>
                  <p className="text-[9px] text-slate-500 truncate uppercase tracking-tighter">{userData?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${userData?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500">{userData?.status}</span>
              </div>
            </div>
            
            <button onClick={logout} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-400/5 hover:text-red-300 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
              <Menu className="w-6 h-6" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight hidden md:block">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full shadow-inner">
              <div className={`w-2 h-2 rounded-full ${userData?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{userData?.status} NODE</span>
            </div>
            {userData?.roles?.includes('Admin') && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition shadow-lg shadow-black/10 uppercase tracking-widest"
              >
                <Shield className="w-3.5 h-3.5" />
                Root Terminal
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {flash && (
            <div className={`p-4 mb-8 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              flash.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'
            }`}>
              {flash.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <p className="text-xs font-black uppercase tracking-widest">{flash.message}</p>
              <button onClick={() => setFlash(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="max-w-5xl space-y-10 animate-in fade-in duration-500">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-primary-600 to-indigo-600 relative">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                </div>
                <div className="px-10 pb-10">
                  <div className="relative -mt-16 mb-8 flex items-end gap-8">
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-2xl border-4 border-white overflow-hidden group">
                      <div className="w-full h-full bg-slate-50 rounded-[2rem] flex items-center justify-center relative">
                        {userData?.name ? (
                          <span className="text-3xl font-black text-primary-600">{userData?.name?.[0]}</span>
                        ) : (
                          <User className="w-12 h-12 text-slate-200" />
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{userData?.name || 'User Name'}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{userData?.email}</span>
                      </div>
                    </div>
                    <div className="ml-auto mb-4">
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm font-black text-[10px] uppercase tracking-widest"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modify Identity
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400 uppercase tracking-widest font-black text-[9px]">
                        <Phone className="w-3.5 h-3.5 text-primary-500" /> WhatsApp Unit
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-slate-800">{userData?.phone_number || 'None'}</p>
                        <button onClick={() => setIsEditingPhone(true)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400 uppercase tracking-widest font-black text-[9px]">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Geo Location
                      </div>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {userData?.address || 'N/A'}<br/>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {userData?.district && `${userData.district}, `}{userData?.state && `${userData.state}, `}{userData?.country || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400 uppercase tracking-widest font-black text-[9px]">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Node Lifecycle
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Deployed On</p>
                        <span className="text-sm font-bold text-slate-700">{userData?.created_at ? new Date(userData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-2">
                    {userData?.roles?.map((role, i) => (
                      <span key={i} className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase border border-primary-100 tracking-widest">{role}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner"><Key className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cryptographic Protocol</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Access Authentication Management</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-slate-100/50 transition-all duration-500">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200"><Lock className="w-5 h-5 text-slate-400" /></div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Update Primary Key</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Change your account access password.</p>
                      </div>
                    </div>
                    <button onClick={() => setIsChangingPassword(true)} className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">Initialize</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner"><Activity className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Interaction Stream</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Communication History</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-6">
                  {myMessages.length > 0 ? myMessages.map((msg, i) => (
                    <div key={i} className="flex gap-6 items-start group animate-in slide-in-from-left-4 transition-all duration-500 hover:translate-x-2" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.group_name || 'Individual Message'}</p>
                          <span className="text-[9px] font-mono text-slate-300">{new Date(msg.sent_at).toLocaleString()}</span>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl rounded-tl-none border border-slate-100 group-hover:border-primary-100 group-hover:bg-white transition-all duration-500 shadow-sm group-hover:shadow-xl">
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{msg.message_content}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
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
                {(userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin') || myGroups.some(g => g.my_role === 'ADMIN')) && (
                  <button 
                    onClick={() => setShowCreatePoll(true)}
                    className="px-6 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 uppercase text-xs tracking-widest"
                  >
                    Create New Poll
                  </button>
                )}
              </div>

              {error && (
                <div className="p-5 bg-red-50 text-red-700 rounded-[2rem] border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                </div>
              )}

              {polls.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {polls.map(poll => (
                    <div key={poll.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${poll.type === 'ELECTION' ? 'bg-indigo-50 text-indigo-600' : 'bg-primary-50 text-primary-600'}`}>
                            <BarChart2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 truncate max-w-[150px] uppercase tracking-tight">{poll.title}</h4>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{poll.type} UNIT</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border ${poll.status === 'OPEN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {poll.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6 h-10 leading-relaxed">{poll.description}</p>
                      
                      <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 mb-4">
                        <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> {poll.starts_at ? `Starts: ${new Date(poll.starts_at).toLocaleString()}` : 'Instant Activation'}
                        </div>
                        {poll.ends_at && (
                          <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> Ends: {new Date(poll.ends_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setSelectedPoll(poll);
                            setVotingData(prev => ({ 
                              ...prev, 
                              pollId: poll.id,
                              phone_number: ''
                            }));
                          }}
                          className="w-full py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                        >
                          View & Vote
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          <button 
                            onClick={() => handleViewAdvancedResults(poll.id)}
                            className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-indigo-600 text-[9px] font-bold rounded-lg hover:bg-indigo-50 uppercase tracking-widest border border-slate-200"
                          >
                            <BarChart2 className="w-3 h-3" /> Results
                          </button>
                          {(userData?.id === poll.creator_id || userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin')) && (
                            <>
                              <button 
                                onClick={() => copyPollLink(poll.id)}
                                className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 text-[9px] font-bold rounded-lg hover:bg-slate-100 uppercase tracking-widest border border-slate-200"
                              >
                                <Link className="w-3 h-3" /> Link
                              </button>
                              <button 
                                onClick={() => handleEditPoll(poll)}
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 text-center space-y-4">
                  <BarChart2 className="w-12 h-12 text-slate-200 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No active decisions found</h4>
                    <p className="text-xs text-slate-400">Check back later for new community polls or create one if you have administrative rights.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* POLL RESULTS DETAIL MODAL */}
          <Modal
            isOpen={!!viewingResultsId}
            onClose={() => { setViewingResultsId(null); setAdvancedResults(null); }}
            title="Poll Intelligence"
            subtitle={advancedResults?.poll?.title || 'Interaction Data'}
            maxWidth="max-w-4xl"
          >
            {advancedResults && (
              <div className="space-y-12 pb-10">
                <div className="flex flex-col md:flex-row gap-10 items-center justify-between bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{advancedResults.totalVotes}</h4>
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Total Packets Cast</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{advancedResults.poll?.description}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-[300px] h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={advancedResults.results.map(r => ({ name: r.name || r.option_selected, value: parseInt(r.votes) }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {advancedResults.results.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Decision Node Breakdown</h4>
                  <div className="grid gap-4">
                    {advancedResults.results.map((r, i) => (
                      <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-100">{i+1}</div>
                          <div>
                            <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{r.name || r.option_selected}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Packet Carrier</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary-600 tracking-tighter">{r.votes}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Weight</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Modal>

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
                    {myGroups.filter(g => g.my_role === 'ADMIN' || userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin')).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Group Restriction</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" 
                    value={newPoll.wa_jid} 
                    onChange={(e) => setNewPoll({...newPoll, wa_jid: e.target.value})}
                  >
                    <option value="">No Restriction</option>
                    {waGroups.map(g => (
                      <option key={g.id?._serialized} value={g.id?._serialized}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {( (newPoll.group_id && myGroups.find(g => g.id === parseInt(newPoll.group_id))?.wa_jid) || newPoll.wa_jid ) && (
                <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">WhatsApp Identity Protocol Active</p>
                    <p className="text-[10px] text-indigo-500 font-bold mt-0.5 leading-relaxed">Voting is restricted to verified members of the linked WhatsApp Group. Membership will be validated before OTP issuance.</p>
                  </div>
                </div>
              )}

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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Protocol</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" 
                    value={
                      newPoll.access_type === 'PUBLIC' ? 'PUBLIC' : 
                      newPoll.group_id ? `INTERNAL:${newPoll.group_id}` : 
                      newPoll.wa_jid ? `WHATSAPP:${newPoll.wa_jid}` : 'PUBLIC'
                    } 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'PUBLIC') {
                        setNewPoll({...newPoll, access_type: 'PUBLIC', group_id: '', wa_jid: ''});
                      } else if (val.startsWith('INTERNAL:')) {
                        setNewPoll({...newPoll, access_type: 'CLOSED', group_id: val.split(':')[1], wa_jid: ''});
                      } else if (val.startsWith('WHATSAPP:')) {
                        setNewPoll({...newPoll, access_type: 'CLOSED', group_id: '', wa_jid: val.split(':')[1]});
                      }
                    }}
                  >
                    <option value="PUBLIC">🌍 PUBLIC (Anyone with link)</option>
                    <optgroup label="Internal Managed Units">
                      {myGroups.map(g => (
                        <option key={g.id} value={`INTERNAL:${g.id}`}>🏠 INTERNAL: {g.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="WhatsApp Organizational Units">
                      {waGroups.map(g => (
                        <option key={g.id?._serialized} value={`WHATSAPP:${g.id?._serialized}`}>💬 WHATSAPP: {g.name}</option>
                      ))}
                    </optgroup>
                  </select>
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
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                      <button type="button" onClick={() => setNewPoll({...newPoll, candidates: newPoll.candidates.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"><X className="w-3 h-3" /></button>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Name" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={cand.name} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].name = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                        <input type="url" placeholder="Photo URL" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono" value={cand.photo_url} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].photo_url = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                      </div>
                      <input type="text" placeholder="Manifesto Summary" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" value={cand.manifesto} onChange={(e) => {
                        const cands = [...newPoll.candidates];
                        cands[i].manifesto = e.target.value;
                        setNewPoll({...newPoll, candidates: cands});
                      }} />
                      <textarea placeholder="Biography" rows="2" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium resize-none" value={cand.biography} onChange={(e) => {
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
            isOpen={!!selectedPoll}
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
                <div className="py-6 space-y-8 animate-in fade-in duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase">Identity Authentication</h3>
                    <p className="text-xs text-slate-400 font-medium">Verify your mobile unit to enable decision selection.</p>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input type="tel" disabled={voteNeedsConfirmation} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary-500 outline-none shadow-inner disabled:opacity-50" placeholder="Mobile Number (e.g. 91...)" value={votingData.phone_number} onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} />
                        {!voteNeedsConfirmation && (
                          <button 
                            onClick={() => handleRequestVoteOtp(false)} 
                            disabled={actionLoading || !votingData.phone_number} 
                            className="px-8 bg-primary-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary-700 transition shadow-lg disabled:opacity-50"
                          >
                            Get OTP
                          </button>
                        )}
                      </div>
                      
                      {voteNeedsConfirmation && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                          <button 
                            onClick={() => handleRequestVoteOtp(true)} 
                            disabled={actionLoading}
                            className="flex-1 py-4 bg-primary-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transform transition-all"
                          >
                            Send OTP to View My Vote
                          </button>
                          <button 
                            onClick={() => { setVoteNeedsConfirmation(false); setSuccessMessage(''); }} 
                            disabled={actionLoading}
                            className="px-6 py-4 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">WhatsApp Identity Protocol</p>
                      <p className="text-[9px] text-indigo-600 font-medium leading-relaxed">Your mobile unit is validated against the live participant ledger of the linked WhatsApp Group before voting is enabled.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase">Cast Your Decision</h3>
                    <p className="text-xs text-slate-400 font-medium">{isViewingVote ? 'Identity verified. Viewing your previous selection.' : 'Identity verified. Select your option and enter the 6-digit packet.'}</p>
                  </div>

                  {!isViewingVote && (
                    <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedPoll.type === 'GENERAL' ? (
                        selectedPoll.options?.map(opt => (
                          <button key={opt} onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})} className={`p-5 rounded-2xl border-2 text-left transition-all ${votingData.option_selected === opt ? 'border-primary-600 bg-primary-50 shadow-md ring-4 ring-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${votingData.option_selected === opt ? 'border-primary-600' : 'border-slate-300'}`}>
                                {votingData.option_selected === opt && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{opt}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        selectedPoll.candidates?.map(cand => (
                          <button key={cand.id} onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})} className={`p-6 rounded-3xl border-2 text-left transition-all flex gap-5 ${votingData.candidate_id === cand.id ? 'border-primary-600 bg-primary-50 shadow-md ring-4 ring-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                              {cand.photo_url ? <img src={cand.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-200" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-sm font-black uppercase text-slate-900 truncate">{cand.name}</h5>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${votingData.candidate_id === cand.id ? 'border-primary-600' : 'border-slate-300'}`}>
                                  {votingData.candidate_id === cand.id && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">{cand.manifesto}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-6">
                    <div className="flex gap-2">
                      <input type="text" maxLength="6" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[0.8em] text-xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={votingData.otp} onChange={(e) => setVotingData({...votingData, otp: e.target.value})} />
                      <button 
                        onClick={handleVerifyAndVote} 
                        disabled={actionLoading || votingData.otp.length !== 6 || (!isViewingVote && !votingData.option_selected && !votingData.candidate_id)} 
                        className="px-10 bg-green-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isViewingVote ? 'Verify' : 'Finalize'}
                      </button>
                    </div>
                    <button 
                      onClick={() => { setVoteOtpSent(false); setVotingData({...votingData, otp: ''}); }}
                      className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                    >
                      Wrong Number? Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>


          {/* EDIT PROFILE MODAL */}
          <Modal
            isOpen={isEditingProfile}
            onClose={() => setIsEditingProfile(false)}
            title="Update Identity"
            subtitle="Secure Profile Node Modification"
            error={error}
            successMessage={successMessage}
          >
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Data (Pincode)</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" value={editForm.pincode} onChange={(e) => setEditForm({...editForm, pincode: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-sm resize-none" rows="2" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold" value={editForm.district} onChange={(e) => setEditForm({...editForm, district: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button type="submit" disabled={actionLoading} className="flex-1 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all">Apply Changes</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-4 bg-slate-100 text-slate-500 text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
              </div>
            </form>
          </Modal>

          {/* EDIT PHONE MODAL */}
          <Modal
            isOpen={isEditingPhone}
            onClose={() => setIsEditingPhone(false)}
            title="Update Comm Unit"
            subtitle="WhatsApp Primary Identity Change"
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-8">
              {!phoneOtpSent ? (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Mobile Number</label>
                    <input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="91XXXXXXXXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                  <button onClick={handleRequestPhoneOtp} disabled={actionLoading} className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all">Request OTP</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-1.5 text-center">
                    <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] mb-4">Verification Packet</label>
                    <input type="text" maxLength="6" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[1em] text-3xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                  </div>
                  <button onClick={handleVerifyPhone} disabled={actionLoading} className="w-full py-4 bg-primary-600 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-primary-700 transition-all">Authorize Change</button>
                </div>
              )}
            </div>
          </Modal>

          {/* CHANGE PASSWORD MODAL */}
          <Modal
            isOpen={isChangingPassword}
            onClose={() => setIsChangingPassword(false)}
            title="Reset Protocol"
            subtitle="Access Key Modification"
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-8">
              {!passOtpSent ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Access Key</label>
                      <input type="password" underline="false" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Access Key</label>
                      <input type="password" underline="false" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={handleRequestPasswordOtp} disabled={actionLoading} className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all">Begin Authorization</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-1.5 text-center">
                    <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] mb-4">Auth Packet</label>
                    <input type="text" maxLength="6" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-[1em] text-3xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner" placeholder="000000" value={passOtp} onChange={(e) => setPassOtp(e.target.value)} />
                  </div>
                  <button onClick={handleVerifyPassword} disabled={actionLoading} className="w-full py-4 bg-primary-600 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl hover:bg-primary-700 transition-all">Commit Reset</button>
                </div>
              )}
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
