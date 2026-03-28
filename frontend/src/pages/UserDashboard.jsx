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
  History, Settings, LogOut, Menu, Zap, Fingerprint, Activity, BarChart2, Link, Trash2, RefreshCw, ShieldCheck,
  Plus, MoreVertical
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl', error, successMessage }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white w-full ${maxWidth} shadow-xl my-8 border border-[#dcdcde] animate-in zoom-in-95 duration-200 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]">
          <h2 className="text-sm font-semibold text-[#1d2327]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 text-[#646970] hover:text-[#d63638] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {subtitle && <p className="text-xs text-[#646970] mb-4 italic">{subtitle}</p>}

          {error && (
            <div className="mb-4 p-3 bg-[#fcf0f1] text-[#d63638] border-l-4 border-[#d63638] text-sm font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-[#edfaef] text-[#00a32a] border-l-4 border-[#00a32a] text-sm font-medium">
              {successMessage}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, siteName } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
      // Fallback for non-secure context
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
      <div className="flex items-center justify-center min-h-screen bg-[#f0f0f1]">
        <div className="w-8 h-8 border-4 border-[#dcdcde] border-t-[#2271b1] rounded-full animate-spin"></div>
      </div>
    );
  }

  const userData = profile || user;

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'polls', label: 'Polls', icon: BarChart2 },
    { id: 'messages', label: 'Messages', icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans">
      {/* WP Sidebar */}
      <aside className={`bg-[#1d2327] transition-all duration-200 z-40 fixed lg:static h-full shadow-lg ${isSidebarCollapsed ? 'w-12' : 'w-48'}`}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="py-4 px-3 mb-2 flex items-center gap-2 border-b border-[#2c3338]">
            <Zap className="w-5 h-5 text-[#72aee6]" />
            {!isSidebarCollapsed && <h1 className="text-sm font-bold text-white uppercase tracking-tight">{siteName}</h1>}
          </div>

          <nav className="flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full wp-sidebar-link ${activeTab === tab.id ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={tab.label}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{tab.label}</span>}
              </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-[#2c3338]">
               {userData?.roles?.includes('Admin') && (
                <button 
                  onClick={() => navigate('/admin')}
                  className={`w-full wp-sidebar-link ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title="Root Terminal"
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>Root Terminal</span>}
                </button>
              )}
              <button 
                onClick={logout} 
                className={`w-full wp-sidebar-link hover:text-[#d63638] ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="Logout"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Terminate Session</span>}
              </button>
            </div>
          </nav>

          <div className="px-4 py-2 border-t border-[#2c3338] opacity-30">
            <p className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-[0.2em]">Beta v1.6.0</p>
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="mt-auto py-3 px-4 text-[#a7aaad] hover:text-white flex items-center gap-2 transition-colors border-t border-[#2c3338]"
          >
            <Menu className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-widest font-bold">Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* WP Topbar */}
        <header className="bg-white border-b border-[#dcdcde] px-4 py-2 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-[#1d2327]">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 bg-[#f6f7f7] border border-[#dcdcde] rounded-sm">
              <div className={`w-2 h-2 rounded-full ${userData?.status === 'ACTIVE' ? 'bg-[#00a32a]' : 'bg-[#dba617]'}`}></div>
              <span className="text-[11px] font-medium text-[#646970] uppercase tracking-tighter">{userData?.status} NODE</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#1d2327]">
              <span>Howdy, {userData?.name || 'User'}</span>
              <div className="w-7 h-7 rounded-sm bg-[#dcdcde] flex items-center justify-center font-bold text-[#1d2327] text-xs">
                {userData?.name?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {flash && (
            <div className={`p-3 mb-6 border-l-4 shadow-sm animate-in fade-in duration-200 ${
              flash.type === 'error' ? 'bg-[#fcf0f1] border-[#d63638] text-[#d63638]' : 'bg-[#edfaef] border-[#00a32a] text-[#00a32a]'
            }`}>
              <div className="flex items-center gap-2">
                {flash.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <p className="text-sm font-medium">{flash.message}</p>
                <button onClick={() => setFlash(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-6">
              <div className="wp-card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#f6f7f7] border border-[#dcdcde] flex items-center justify-center relative">
                      {userData?.name ? (
                        <span className="text-3xl font-bold text-[#2271b1]">{userData?.name?.[0]}</span>
                      ) : (
                        <User className="w-10 h-10 text-[#a7aaad]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">{userData?.name || 'User Name'}</h3>
                      <p className="text-sm text-[#646970] font-medium">{userData?.email}</p>
                      <div className="flex gap-1 mt-2">
                        {userData?.roles?.map((role, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#f6f7f7] text-[#1d2327] border border-[#dcdcde] text-[10px] font-semibold uppercase tracking-tighter">{role}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="wp-button-secondary">Edit Profile</button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-[#f0f0f1]">
                   <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#a7aaad] uppercase block mb-1">WhatsApp Number</label>
                        <div className="flex items-center justify-between bg-[#f6f7f7] p-2 border border-[#dcdcde]">
                          <span className="text-sm font-medium">{userData?.phone_number || 'Not Linked'}</span>
                          <button onClick={() => setIsEditingPhone(true)} className="text-[#2271b1] hover:underline text-xs">Update</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#a7aaad] uppercase block mb-1">Primary Address</label>
                        <div className="bg-[#f6f7f7] p-2 border border-[#dcdcde] text-sm min-h-[60px]">
                          {userData?.address || 'No address provided'}
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-[#a7aaad] uppercase block mb-1">State</label>
                          <div className="bg-[#f6f7f7] p-2 border border-[#dcdcde] text-sm">{userData?.state || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#a7aaad] uppercase block mb-1">District</label>
                          <div className="bg-[#f6f7f7] p-2 border border-[#dcdcde] text-sm">{userData?.district || 'N/A'}</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#a7aaad] uppercase block mb-1">Node Deployment Date</label>
                        <div className="bg-[#f6f7f7] p-2 border border-[#dcdcde] text-sm">
                           {userData?.created_at ? new Date(userData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl">
              <div className="wp-card">
                 <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7]">
                    <h3 className="text-sm font-semibold">Security Protocol</h3>
                 </div>
                 <div className="p-6">
                    <p className="text-sm text-[#646970] mb-6">Manage your account credentials and security settings.</p>
                    <div className="bg-[#f6f7f7] p-4 border border-[#dcdcde] flex items-center justify-between">
                       <div>
                          <p className="text-sm font-semibold text-[#1d2327]">Account Password</p>
                          <p className="text-xs text-[#646970]">Update your primary access key.</p>
                       </div>
                       <button onClick={() => setIsChangingPassword(true)} className="wp-button-secondary">Change Password</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="max-w-5xl space-y-4">
               <div className="wp-card min-h-[500px] flex flex-col">
                  <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-between">
                     <h3 className="text-sm font-semibold">Activity Log</h3>
                     <span className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">{myMessages.length} Interactions</span>
                  </div>
                  <div className="flex-1 p-0 overflow-y-auto custom-scrollbar">
                    {myMessages.length > 0 ? (
                      <table className="wp-list-table w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Unit</th>
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Interaction Content</th>
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Timestamp</th>
                           </tr>
                        </thead>
                        <tbody>
                          {myMessages.map((msg, i) => (
                            <tr key={i} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors">
                               <td className="px-4 py-4 align-top">
                                  <span className="text-xs font-semibold text-[#2271b1]">{msg.group_name || 'Direct'}</span>
                               </td>
                               <td className="px-4 py-4 text-sm text-[#3c434a] leading-relaxed max-w-xl">
                                  {msg.message_content}
                               </td>
                               <td className="px-4 py-4 text-[10px] font-semibold text-[#a7aaad] text-right">
                                  {new Date(msg.sent_at).toLocaleString()}
                               </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-40">
                         <Activity className="w-12 h-12 mb-4" />
                         <p className="text-sm font-medium">No activity recorded on this node.</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium text-[#1d2327]">Community Polls</h3>
                  {(userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin') || myGroups.some(g => g.my_role === 'ADMIN')) && (
                    <button onClick={() => setShowCreatePoll(true)} className="wp-button-primary flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Create New Poll
                    </button>
                  )}
               </div>

               {polls.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {polls.map(poll => (
                      <div key={poll.id} className="wp-card flex flex-col h-full hover:border-[#2271b1] transition-all group">
                         <div className="p-4 border-b border-[#f0f0f1] bg-[#f6f7f7]/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <BarChart2 className={`w-4 h-4 ${poll.type === 'ELECTION' ? 'text-[#8b5cf6]' : 'text-[#2271b1]'}`} />
                               <span className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-wider">{poll.type}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 border rounded-sm ${poll.status === 'OPEN' ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' : 'bg-[#fcf0f1] text-[#d63638] border-[#d63638]'}`}>
                               {poll.status}
                            </span>
                         </div>
                         <div className="p-5 flex-1 flex flex-col">
                            <h4 className="text-base font-semibold text-[#1d2327] mb-2 group-hover:text-[#2271b1] transition-colors">{poll.title}</h4>
                            <p className="text-xs text-[#646970] line-clamp-3 mb-4 flex-1 italic">{poll.description}</p>
                            
                            <div className="space-y-1 mb-4">
                               <div className="flex items-center gap-2 text-[10px] text-[#a7aaad] font-bold">
                                  <Clock className="w-3 h-3" /> START: {poll.starts_at ? new Date(poll.starts_at).toLocaleString() : 'LIVE'}
                               </div>
                               {poll.ends_at && (
                                 <div className="flex items-center gap-2 text-[10px] text-[#a7aaad] font-bold">
                                    <Clock className="w-3 h-3" /> END: {new Date(poll.ends_at).toLocaleString()}
                                 </div>
                               )}
                            </div>

                            <div className="pt-4 border-t border-[#f0f0f1] space-y-2">
                               <button 
                                 onClick={() => { setSelectedPoll(poll); setVotingData(prev => ({ ...prev, pollId: poll.id, phone_number: '' })); }}
                                 className="w-full wp-button-primary"
                               >
                                 Participate
                               </button>
                               <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => handleViewAdvancedResults(poll.id)} className="wp-button-secondary text-[10px] py-1">Results</button>
                                  {(userData?.id === poll.creator_id || userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin')) && (
                                    <div className="flex gap-1">
                                      <button onClick={() => copyPollLink(poll.id)} className="wp-button-secondary text-[10px] py-1 flex-1" title="Copy Link"><Link className="w-3 h-3 mx-auto" /></button>
                                      <button onClick={() => handleEditPoll(poll)} className="wp-button-secondary text-[10px] py-1 flex-1" title="Edit"><Edit2 className="w-3 h-3 mx-auto" /></button>
                                      <button onClick={() => handleDeletePoll(poll.id)} className="wp-button-secondary text-[10px] py-1 flex-1 border-[#d63638] text-[#d63638] hover:bg-[#fcf0f1]" title="Delete"><Trash2 className="w-3 h-3 mx-auto" /></button>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="wp-card p-20 flex flex-col items-center justify-center text-center opacity-40">
                    <BarChart2 className="w-12 h-12 mb-4" />
                    <h4 className="text-sm font-bold uppercase">No Active Polls</h4>
                    <p className="text-xs max-w-xs mt-2">Check back later or initialize a new unit if authorized.</p>
                 </div>
               )}
            </div>
          )}

          {/* POLL RESULTS DETAIL MODAL */}
          <Modal
            isOpen={!!viewingResultsId}
            onClose={() => { setViewingResultsId(null); setAdvancedResults(null); }}
            title="Poll Results"
            subtitle={advancedResults?.poll?.title}
            maxWidth="max-w-3xl"
          >
            {advancedResults && (
              <div className="space-y-6">
                <div className="bg-[#f6f7f7] p-6 border border-[#dcdcde] flex flex-col md:flex-row gap-6 items-center">
                   <div className="flex-1 text-center md:text-left">
                      <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-[0.2em] mb-1">Total Votes</p>
                      <h4 className="text-4xl font-bold text-[#1d2327]">{advancedResults.totalVotes}</h4>
                      <p className="text-xs text-[#646970] mt-4 italic">{advancedResults.poll?.description}</p>
                   </div>
                   <div className="w-[200px] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={advancedResults.results.map(r => ({ name: r.name || r.option_selected, value: parseInt(r.votes) }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {advancedResults.results.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#2271b1', '#d63638', '#00a32a', '#dba617', '#72aee6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '12px', border: '1px solid #dcdcde' }} />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-xs font-bold text-[#1d2327] uppercase mb-4">Node Breakdown</h4>
                   <div className="border border-[#dcdcde]">
                      {advancedResults.results.map((r, i) => (
                        <div key={i} className={`p-3 flex items-center justify-between text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#f6f7f7]'} border-b border-[#dcdcde] last:border-0`}>
                           <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-[#dcdcde] text-[#1d2327] rounded-sm flex items-center justify-center text-[10px] font-bold">{i+1}</span>
                              <span className="font-semibold">{r.name || r.option_selected}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="font-bold text-[#2271b1]">{r.votes} Votes</span>
                              <span className="text-[10px] text-[#a7aaad] font-bold">({advancedResults.totalVotes > 0 ? ((r.votes/advancedResults.totalVotes)*100).toFixed(1) : 0}%)</span>
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
            title="Create New Poll"
            error={error}
            successMessage={successMessage}
          >
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1d2327]">Poll Title</label>
                  <input type="text" required className="w-full wp-input" value={newPoll.title} onChange={(e) => setNewPoll({...newPoll, title: e.target.value})} placeholder="e.g., Executive Election 2026" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1d2327]">Target Group</label>
                  <select 
                    className="w-full wp-input" 
                    value={newPoll.group_id} 
                    onChange={(e) => setNewPoll({...newPoll, group_id: e.target.value})}
                    required={!userData?.roles?.includes('Admin')}
                  >
                    <option value="">Global (No Link)</option>
                    {myGroups.filter(g => g.my_role === 'ADMIN' || userData?.roles?.includes('Admin') || userData?.roles?.includes('SuperAdmin')).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1d2327]">Context / Instructions</label>
                <textarea required className="w-full wp-input min-h-[80px] resize-none" placeholder="Provide background information..." value={newPoll.description} onChange={(e) => setNewPoll({...newPoll, description: e.target.value})} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1d2327]">Operational Mode</label>
                  <select className="w-full wp-input" value={newPoll.type} onChange={(e) => setNewPoll({...newPoll, type: e.target.value})}>
                    <option value="GENERAL">General Decision</option>
                    <option value="ELECTION">Election / Candidate Mode</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1d2327]">Access Protocol</label>
                  <select 
                    className="w-full wp-input" 
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
                    <option value="PUBLIC">🌍 PUBLIC (Open Access)</option>
                    <optgroup label="Internal Groups">
                      {myGroups.map(g => (
                        <option key={g.id} value={`INTERNAL:${g.id}`}>🏠 {g.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="WhatsApp Groups">
                      {waGroups.map(g => (
                        <option key={g.id?._serialized} value={`WHATSAPP:${g.id?._serialized}`}>💬 {g.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {newPoll.type === 'GENERAL' ? (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-[#1d2327]">Decision Options</label>
                  {newPoll.options.map((opt, i) => (
                    <div key={i} className="flex gap-1">
                      <input type="text" className="flex-1 wp-input" placeholder={`Option ${i+1}`} value={opt} onChange={(e) => {
                        const opts = [...newPoll.options];
                        opts[i] = e.target.value;
                        setNewPoll({...newPoll, options: opts});
                      }} />
                      {newPoll.options.length > 2 && (
                        <button type="button" onClick={() => setNewPoll({...newPoll, options: newPoll.options.filter((_, idx) => idx !== i)})} className="p-1 text-[#d63638] hover:bg-[#fcf0f1] border border-transparent"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-[10px] font-bold text-[#2271b1] hover:underline uppercase">+ Add Selection Node</button>
                </div>
              ) : (
                <div className="space-y-4 pt-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <label className="text-xs font-semibold text-[#1d2327]">Candidate Profiles</label>
                  {newPoll.candidates.map((cand, i) => (
                    <div key={i} className="p-3 bg-[#f6f7f7] border border-[#dcdcde] space-y-2 relative">
                      <button type="button" onClick={() => setNewPoll({...newPoll, candidates: newPoll.candidates.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 p-0.5 text-[#d63638] hover:bg-white rounded"><X className="w-3 h-3" /></button>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Name" className="wp-input" value={cand.name} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].name = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                        <input type="url" placeholder="Photo Link" className="wp-input" value={cand.photo_url} onChange={(e) => {
                          const cands = [...newPoll.candidates];
                          cands[i].photo_url = e.target.value;
                          setNewPoll({...newPoll, candidates: cands});
                        }} />
                      </div>
                      <textarea placeholder="Manifesto..." rows="2" className="w-full wp-input resize-none" value={cand.manifesto} onChange={(e) => {
                        const cands = [...newPoll.candidates];
                        cands[i].manifesto = e.target.value;
                        setNewPoll({...newPoll, candidates: cands});
                      }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewPoll({...newPoll, candidates: [...newPoll.candidates, { name: '', photo_url: '', manifesto: '', biography: '' }]})} className="text-[10px] font-bold text-[#2271b1] hover:underline uppercase">+ Add Candidate Node</button>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={actionLoading} className="wp-button-primary px-8">Create Poll</button>
              </div>
            </form>
          </Modal>

          {/* VOTE MODAL */}
          <Modal
            isOpen={!!selectedPoll}
            onClose={() => { setSelectedPoll(null); setVoteOtpSent(false); }}
            title={selectedPoll?.title}
            subtitle={`Access: ${selectedPoll?.access_type}`}
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-6">
              <div className="p-4 bg-[#f6f7f7] border border-[#dcdcde] text-sm italic">
                {selectedPoll?.description}
              </div>

              {!voteOtpSent ? (
                <div className="py-4 space-y-4">
                  <h3 className="text-sm font-semibold text-center">OTP Verification</h3>
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <div className="flex gap-1">
                      <input type="tel" disabled={voteNeedsConfirmation} className="flex-1 wp-input text-center font-bold" placeholder="Mobile Number" value={votingData.phone_number} onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} />
                      {!voteNeedsConfirmation && (
                        <button onClick={() => handleRequestVoteOtp(false)} disabled={actionLoading || !votingData.phone_number} className="wp-button-primary">Get OTP</button>
                      )}
                    </div>
                    {voteNeedsConfirmation && (
                      <div className="flex gap-2 animate-in slide-in-from-top-1">
                        <button onClick={() => handleRequestVoteOtp(true)} disabled={actionLoading} className="flex-1 wp-button-primary">View My Vote</button>
                        <button onClick={() => { setVoteNeedsConfirmation(false); setSuccessMessage(''); }} disabled={actionLoading} className="wp-button-secondary">Cancel</button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#fcf9e8] border border-[#dba617] text-[#1d2327] text-[10px] font-medium leading-relaxed">
                    Identity validation via WhatsApp Identity Protocol required for decision submission.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   {!isViewingVote && (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedPoll.type === 'GENERAL' ? (
                        selectedPoll.options?.map(opt => (
                          <button key={opt} onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})} className={`p-3 border text-left flex items-center justify-between transition-all ${votingData.option_selected === opt ? 'bg-[#f6f7f7] border-[#2271b1] ring-1 ring-[#2271b1]' : 'bg-white border-[#dcdcde] hover:bg-[#f6f7f7]'}`}>
                            <span className="text-sm font-semibold">{opt}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${votingData.option_selected === opt ? 'border-[#2271b1]' : 'border-[#dcdcde]'}`}>
                              {votingData.option_selected === opt && <div className="w-2 h-2 bg-[#2271b1] rounded-full"></div>}
                            </div>
                          </button>
                        ))
                      ) : (
                        selectedPoll.candidates?.map(cand => (
                          <button key={cand.id} onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})} className={`p-3 border text-left flex gap-4 transition-all ${votingData.candidate_id === cand.id ? 'bg-[#f6f7f7] border-[#2271b1] ring-1 ring-[#2271b1]' : 'bg-white border-[#dcdcde] hover:bg-[#f6f7f7]'}`}>
                            <div className="w-12 h-12 bg-[#f0f0f1] border border-[#dcdcde] flex-shrink-0">
                               {cand.photo_url ? <img src={cand.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-[#a7aaad]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h5 className="text-xs font-bold text-[#1d2327] truncate mb-1 uppercase">{cand.name}</h5>
                               <p className="text-[10px] text-[#646970] line-clamp-2 leading-tight italic">{cand.manifesto}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#dcdcde] space-y-4">
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest text-center">Enter OTP</label>
                      <div className="flex gap-1">
                        <input type="text" maxLength="6" className="flex-1 wp-input text-center font-bold tracking-widest" placeholder="000000" value={votingData.otp} onChange={(e) => setVotingData({...votingData, otp: e.target.value})} />
                        <button onClick={handleVerifyAndVote} disabled={actionLoading || votingData.otp.length !== 6} className="wp-button-primary">Finalize</button>
                      </div>
                    </div>
                    <button onClick={() => { setVoteOtpSent(false); setVotingData({...votingData, otp: ''}); }} className="w-full text-[10px] text-[#2271b1] font-bold hover:underline">WRONG NUMBER? GO BACK</button>
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* EDIT PROFILE MODAL */}
          <Modal
            isOpen={isEditingProfile}
            onClose={() => setIsEditingProfile(false)}
            title="Edit Profile"
            error={error}
            successMessage={successMessage}
          >
            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1d2327]">Full Legal Name</label>
                    <input type="text" required className="w-full wp-input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1d2327]">Postal Pincode</label>
                    <input type="text" className="w-full wp-input" value={editForm.pincode} onChange={(e) => setEditForm({...editForm, pincode: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1d2327]">Residential Address</label>
                  <textarea rows="2" className="w-full wp-input resize-none" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
               </div>
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1d2327]">Country</label>
                    <input type="text" className="w-full wp-input" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1d2327]">State</label>
                    <input type="text" className="w-full wp-input" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1d2327]">District</label>
                    <input type="text" className="w-full wp-input" value={editForm.district} onChange={(e) => setEditForm({...editForm, district: e.target.value})} />
                  </div>
               </div>
               <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="wp-button-secondary">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="wp-button-primary px-8">Update Profile</button>
               </div>
            </form>
          </Modal>

          {/* EDIT PHONE MODAL */}
          <Modal
            isOpen={isEditingPhone}
            onClose={() => setIsEditingPhone(false)}
            title="Update Phone"
            error={error}
            successMessage={successMessage}
          >
            <div className="space-y-6">
               {!phoneOtpSent ? (
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#1d2327]">New WhatsApp Number</label>
                      <input type="tel" className="w-full wp-input" placeholder="91XXXXXXXXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                    </div>
                    <button onClick={handleRequestPhoneOtp} disabled={actionLoading || !newPhone} className="w-full wp-button-primary py-2">Get Verification Code</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#1d2327] text-center block">Enter Code sent to WhatsApp</label>
                      <input type="text" maxLength="6" className="w-full wp-input text-center font-bold tracking-widest text-xl" placeholder="000000" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                    </div>
                    <button onClick={handleVerifyPhone} disabled={actionLoading || phoneOtp.length !== 6} className="w-full wp-button-primary py-2">Verify & Commit</button>
                 </div>
               )}
            </div>
          </Modal>

          {/* CHANGE PASSWORD MODAL */}
          <Modal
            isOpen={isChangingPassword}
            onClose={() => setIsChangingPassword(false)}
            title="Change Password"
            error={error}
            successMessage={successMessage}
          >
             <div className="space-y-6">
                {!passOtpSent ? (
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1d2327]">New Password</label>
                        <input type="password" underline="false" className="w-full wp-input" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1d2327]">Confirm New Password</label>
                        <input type="password" underline="false" className="w-full wp-input" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                     </div>
                     <button onClick={handleRequestPasswordOtp} disabled={actionLoading || !passwords.new} className="w-full wp-button-primary py-2">Initialize Update</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1d2327] text-center block">Enter OTP</label>
                        <input type="text" maxLength="6" className="w-full wp-input text-center font-bold tracking-widest text-xl" placeholder="000000" value={passOtp} onChange={(e) => setPassOtp(e.target.value)} />
                     </div>
                     <button onClick={handleVerifyPassword} disabled={actionLoading || passOtp.length !== 6} className="w-full wp-button-primary py-2">Confirm & Reset</button>
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
