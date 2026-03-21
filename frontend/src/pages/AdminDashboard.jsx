import React, { useState, useEffect } from 'react';
import api from '../services/api';
import authService from '../services/auth.service';
import { User, Shield, Check, X, RefreshCw, Settings, Save, AlertCircle, Globe, Lock, Cpu, Send, CheckCircle, Terminal, ChevronDown, ChevronUp, Users, Plus, Trash2, UserPlus, ShieldAlert, ShieldCheck, MessageSquare, History, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState('');
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [isDebugExpanded, setIsDebugExpanded] = useState(true);

  // Flash Message State
  const [flash, setFlash] = useState(null);

  // New Group Form State
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [addMemberUserId, setAddMemberUserId] = useState('');

  // Message Form State
  const [showMessageForm, setShowMessageForm] = useState(null); // stores member object
  const [customMessage, setCustomMessage] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // WhatsApp-web State
  const [waStatus, setWaStatus] = useState({ status: 'DISCONNECTED', ready: false, qr: null, me: null });
  const [waChats, setWaChats] = useState([]);
  const [waContacts, setWaContacts] = useState([]);
  const [waLoading, setWaLoading] = useState(false);

  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 5000);
  };

  const fetchWaStatus = async () => {
    try {
      const data = await authService.getWhatsappStatus();
      setWaStatus(data);
    } catch (err) {
      console.error('Failed to fetch WA status');
    }
  };

  const fetchWaData = async () => {
    if (!waStatus.ready) return;
    try {
      const [chats, contacts] = await Promise.all([
        authService.getWhatsappChats(),
        authService.getWhatsappContacts()
      ]);
      setWaChats(chats);
      setWaContacts(contacts);
    } catch (err) {
      console.error('Failed to fetch WA data');
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp' && waStatus.ready) {
      fetchWaData();
    }
  }, [activeTab, waStatus.ready]);

  const handleWaLogout = async () => {
    if (!window.confirm('Are you sure you want to logout from WhatsApp?')) return;
    try {
      await authService.logoutWhatsapp();
      showFlash('Logged out from WhatsApp');
      fetchWaStatus();
    } catch (err) {
      showFlash('Logout failed', 'error');
    }
  };

  const handleWaReinit = async () => {
    try {
      await authService.reinitializeWhatsapp();
      showFlash('Re-initialization started');
      setTimeout(fetchWaStatus, 2000);
    } catch (err) {
      showFlash('Failed to reinitialize', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/user/all');
      setUsers(response.data);
    } catch (err) {
      showFlash('Failed to fetch users.', 'error');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/all');
      setSettings(response.data);
    } catch (err) {
      showFlash('Failed to fetch settings.', 'error');
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await authService.getAllGroups();
      setGroups(data);
    } catch (err) {
      showFlash('Failed to fetch groups.', 'error');
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const data = await authService.getGroupMembers(groupId);
      setGroupMembers(data);
    } catch (err) {
      showFlash('Failed to fetch group members.', 'error');
    }
  };

  const fetchMessageHistory = async (userId) => {
    setHistoryLoading(true);
    try {
      const data = await authService.getMessageHistory(userId);
      setMessageHistory(data);
    } catch (err) {
      console.error('Failed to fetch history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchSettings(), fetchGroups(), fetchWaStatus()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll for WA status if disconnected and might be showing QR
    const interval = setInterval(() => {
      fetchWaStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showMessageForm) {
      fetchMessageHistory(showMessageForm.id);
    }
  }, [showMessageForm]);

  const updateStatus = async (userId, newStatus) => {
    try {
      await api.put('/user/status', { userId, status: newStatus });
      showFlash(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      showFlash('Failed to update user status.', 'error');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value, is_dirty: true } : s));
  };

  const saveSetting = async (key, value) => {
    setSaveLoading(true);
    try {
      await api.put('/settings/update', { key, value });
      showFlash(`Setting ${key} saved successfully`);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, is_dirty: false, is_fallback: false } : s));
    } catch (err) {
      showFlash(`Failed to save setting ${key}`, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await authService.createGroup({ name: newGroupName, description: newGroupDesc });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowGroupForm(false);
      showFlash('Group created successfully');
      fetchGroups();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to create group.', 'error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? All memberships will be removed.')) return;
    try {
      await authService.deleteGroup(groupId);
      showFlash('Group deleted successfully');
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setGroupMembers([]);
      }
      fetchGroups();
    } catch (err) {
      showFlash('Failed to delete group.', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !addMemberUserId) return;
    try {
      await authService.addGroupMember(selectedGroup.id, addMemberUserId, 'MEMBER');
      setAddMemberUserId('');
      showFlash('Member added to group');
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to add member.', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove user from group?')) return;
    try {
      await authService.removeGroupMember(selectedGroup.id, userId);
      showFlash('Member removed from group');
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash('Failed to remove member.', 'error');
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await authService.updateMemberRole(selectedGroup.id, userId, newRole);
      showFlash(`Role updated to ${newRole}`);
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash('Failed to update role.', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!showMessageForm || !customMessage) return;
    
    setMsgLoading(true);
    try {
      const user = users.find(u => u.id === showMessageForm.id);
      const phone = user?.phone_number || showMessageForm.phone_number;
      
      if (!phone) {
        showFlash('User has no phone number registered.', 'error');
        return;
      }

      const res = await authService.sendMessage(showMessageForm.id, phone, customMessage);
      if (res.success) {
        showFlash('Message sent successfully!');
        setCustomMessage('');
        fetchMessageHistory(showMessageForm.id);
      } else {
        showFlash('Message failed: ' + (res.result?.data?.message || 'Gateway error'), 'error');
      }
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to send message.', 'error');
    } finally {
      setMsgLoading(false);
    }
  };

  const testOtp = async () => {
    if (!testPhone) return;
    setTestLoading(true);
    setTestSuccess('');
    setError('');
    setGatewayResponse(null);
    setIsDebugExpanded(true);
    try {
      const res = await api.post('/settings/test-otp', { phoneNumber: testPhone });
      setTestSuccess(res.data.message);
      setGatewayResponse(res.data.result?.gatewayResponse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send test OTP.');
      if (err.response?.data?.result?.gatewayResponse) {
        setGatewayResponse(err.response.data.result.gatewayResponse);
      }
    } finally {
      setTestLoading(false);
    }
  };

  const categories = {
    general: { label: 'General', icon: Globe, keys: ['site_name', 'website_domain'] },
    security: { label: 'Security & Auth', icon: Lock, keys: ['otp_enabled', 'otp_expiration_minutes', 'otp_max_retries', 'jwt_secret'] },
    technical: { label: 'Technical / API', icon: Cpu, keys: ['vite_api_base_url', 'otp_gateway_url', 'otp_api_key'] }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 relative">
      {/* Flash Messages */}
      {flash && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${
          flash.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {flash.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <p className="font-bold">{flash.message}</p>
          <button onClick={() => setFlash(null)} className="ml-4 p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="container px-6 mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
            <p className="text-slate-500 mt-2">Manage user accounts, groups, and system settings</p>
          </div>
          <button 
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'groups' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Groups
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            System Settings
          </button>
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'whatsapp' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            WhatsApp Instance
          </button>
          </div>

          {activeTab === 'users' && (
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                            {u.name?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name || 'N/A'}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.phone_number || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                          u.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.status === 'PENDING_APPROVAL' && (
                            <button onClick={() => updateStatus(u.id, 'ACTIVE')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                          )}
                          {u.status === 'ACTIVE' && (
                            <button onClick={() => updateStatus(u.id, 'INACTIVE')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X className="w-5 h-5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Group List */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Groups</h2>
                  <button 
                    onClick={() => setShowGroupForm(!showGroupForm)}
                    className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {showGroupForm && (
                  <form onSubmit={handleCreateGroup} className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-4">
                    <input 
                      type="text" placeholder="Group Name" required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                      value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    />
                    <textarea 
                      placeholder="Description"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                      value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                    />
                    <button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-xl font-bold">Create</button>
                  </form>
                )}

                <div className="space-y-2">
                  {groups.map(g => (
                    <div key={g.id} className="group relative">
                      <button
                        onClick={() => { setSelectedGroup(g); fetchGroupMembers(g.id); }}
                        className={`w-full text-left p-4 pr-12 rounded-2xl transition-all ${selectedGroup?.id === g.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                      >
                        <p className="font-bold">{g.name}</p>
                        <p className={`text-xs ${selectedGroup?.id === g.id ? 'text-primary-100' : 'text-slate-500'}`}>{g.description}</p>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${selectedGroup?.id === g.id ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Group Details / Members */}
            <div className="lg:col-span-2">
              {selectedGroup ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedGroup.name}</h2>
                        <p className="text-slate-500">{selectedGroup.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        Members ({groupMembers.length})
                      </h3>
                    </div>

                    {/* Add Member Form */}
                    <form onSubmit={handleAddMember} className="flex gap-3 mb-8">
                      <select 
                        required
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        value={addMemberUserId}
                        onChange={e => setAddMemberUserId(e.target.value)}
                      >
                        <option value="">Select User to Add</option>
                        {users.filter(u => !groupMembers.find(gm => gm.id === u.id)).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                      <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Add
                      </button>
                    </form>

                    <div className="space-y-4">
                      {groupMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${m.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{m.name}</p>
                              <p className="text-xs text-slate-500">{m.email} • <span className="font-bold text-primary-600 uppercase">{m.role}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowMessageForm(m)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="Send Message"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            {m.role === 'MEMBER' ? (
                              <button 
                                onClick={() => handleUpdateMemberRole(m.id, 'ADMIN')}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Promote to Admin"
                              >
                                <ShieldCheck className="w-5 h-5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateMemberRole(m.id, 'MEMBER')}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                title="Demote to Member"
                              >
                                <ShieldAlert className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Select a group</h3>
                  <p className="text-slate-500">Choose a group from the list to manage its members</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button key={key} onClick={() => setActiveSettingsTab(key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeSettingsTab === key ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <cat.icon className="w-5 h-5" /> {cat.label}
                  </button>
                ))}
              </div>

              {/* OTP TEST HELPER */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <Send className="w-4 h-4 text-primary-600" />
                  Test Gateway
                </h3>
                <div className="space-y-4">
                  <input 
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <button 
                    onClick={testOtp}
                    disabled={!testPhone || testLoading}
                    className="w-full py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {testLoading ? 'Sending...' : 'Send Test OTP'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  {React.createElement(categories[activeSettingsTab].icon, { className: "w-6 h-6 text-primary-600" })}
                  {categories[activeSettingsTab].label} Settings
                </h2>
                <div className="space-y-8">
                  {settings.filter(s => categories[activeSettingsTab].keys.includes(s.key)).map((s) => (
                    <div key={s.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 uppercase tracking-wider text-xs">{s.key.replace(/_/g, ' ')}</label>
                        {s.is_dirty && <span className="text-[10px] font-bold text-amber-600 uppercase">Unsaved</span>}
                      </div>
                      <div className="flex gap-3">
                        <input 
                          type={s.key.includes('secret') || s.key.includes('password') || s.key.includes('api_key') ? 'password' : 'text'}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                          value={s.value} onChange={(e) => handleSettingChange(s.key, e.target.value)}
                        />
                        <button disabled={!s.is_dirty || saveLoading} onClick={() => saveSetting(s.key, s.value)} className={`px-4 rounded-xl ${s.is_dirty ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Save className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {gatewayResponse && (
                <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 mt-6">
                  <button 
                    onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                    className="w-full bg-slate-800 px-6 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Terminal className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Gateway Debug Response</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        gatewayResponse.status >= 200 && gatewayResponse.status < 300 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        STATUS: {gatewayResponse.status}
                      </span>
                      {isDebugExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {isDebugExpanded && (
                    <div className="p-6 overflow-x-auto">
                      <pre className="text-blue-400 font-mono text-sm">
                        {JSON.stringify(gatewayResponse.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  waStatus.status === 'CONNECTED' ? 'bg-green-100 text-green-600 shadow-green-100' : 'bg-slate-100 text-slate-400 shadow-slate-100'
                }`}>
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">WhatsApp Instance</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${waStatus.status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className={`text-sm font-bold uppercase tracking-wider ${waStatus.status === 'CONNECTED' ? 'text-green-600' : 'text-slate-500'}`}>
                      {waStatus.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleWaReinit}
                  className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-initialize
                </button>
                {waStatus.status === 'CONNECTED' && (
                  <button 
                    onClick={handleWaLogout}
                    className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Logout
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Status Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">Client Ready</span>
                    <span className={`text-sm font-bold ${waStatus.ready ? 'text-green-600' : 'text-red-600'}`}>
                      {waStatus.ready ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {waStatus.me && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 text-sm">Connected As</span>
                        <span className="text-sm font-bold text-primary-600">{waStatus.me.pushname} ({waStatus.me.wid.user})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 text-sm">Platform</span>
                        <span className="text-sm font-bold text-slate-700 uppercase">{waStatus.me.platform}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">Session ID</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Unique Global Session</span>
                  </div>
                </div>

                {waStatus.ready && (
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Chats ({waChats.length})</h3>
                      <button onClick={fetchWaData} className="text-primary-600 hover:underline text-xs font-bold uppercase">Refresh List</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {waChats.length > 0 ? waChats.slice(0, 10).map(chat => (
                        <div key={chat.id._serialized} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                              {chat.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{chat.name || chat.id.user}</p>
                              <p className="text-[10px] text-slate-400">{chat.id._serialized}</p>
                            </div>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{chat.unreadCount}</span>
                          )}
                        </div>
                      )) : (
                        <p className="text-center py-8 text-slate-400 text-xs italic">No active chats found</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Quick Test</h4>
                  <div className="flex gap-3">
                    <input 
                      type="tel" 
                      placeholder="919560436836" 
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      id="test-wa-phone"
                    />
                    <button 
                      onClick={async () => {
                        const num = document.getElementById('test-wa-phone').value;
                        if (!num) return alert('Enter number');
                        try {
                          await authService.sendWhatsappTest(num, 'Hello from AppStack Instance!');
                          alert('Test message sent!');
                        } catch (err) {
                          alert('Failed: ' + (err.response?.data?.error || err.message));
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-100"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 min-h-[400px]">
                {waStatus.status === 'CONNECTED' ? (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Authenticated</h3>
                    <p className="text-slate-500">Your WhatsApp instance is active and ready to send messages.</p>
                  </div>
                ) : waStatus.qr ? (
                  <div className="text-center w-full">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-wider">Scan QR Code</h3>
                    <div className="bg-white p-6 rounded-3xl shadow-xl inline-block mb-6 border border-slate-100">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waStatus.qr)}`} 
                        alt="WhatsApp QR Code"
                        className="w-[250px] h-[250px]"
                      />
                    </div>
                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                      Open WhatsApp on your phone, go to Linked Devices, and scan this code to connect.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-primary-600 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Waiting for scan</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-slate-200 animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-bold text-slate-400">Initializing Client...</h3>
                    <p className="text-slate-400 text-sm mt-2">This may take a few seconds.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MESSAGE MODAL */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                  Send Custom Message
                </h3>
                <p className="text-slate-500 text-sm mt-1">To: <span className="font-bold">{showMessageForm.name}</span> ({showMessageForm.email})</p>
              </div>
              <button onClick={() => setShowMessageForm(null)} className="p-2 hover:bg-slate-200 rounded-xl transition">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2">
              {/* Form Side */}
              <div className="p-8 border-r border-slate-100">
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Message Content</label>
                    <p className="text-xs text-slate-400 mb-3 italic">* This message will be sent exactly as typed below.</p>
                    <textarea 
                      required
                      rows="6"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                      placeholder="Type your message here..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={msgLoading || !customMessage}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {msgLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {msgLoading ? 'Sending...' : 'Send Now'}
                  </button>
                </form>
              </div>

              {/* History Side */}
              <div className="p-8 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <History className="w-4 h-4 text-slate-400" />
                  Message History
                </h4>
                
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-slate-200 animate-spin" />
                    </div>
                  ) : messageHistory.length > 0 ? (
                    messageHistory.map(h => (
                      <div key={h.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {h.status}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(h.sent_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{h.message}</p>
                        {h.error_message && (
                          <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg font-mono">
                            {h.error_message}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>No messages sent yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
