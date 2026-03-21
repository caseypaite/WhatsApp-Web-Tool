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

  // WhatsApp Management State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', description: '', participants: '' });
  const [waActionLoading, setWaActionLoading] = useState(false);

  // Deletion State
  const [deleteContext, setDeleteContext] = useState(null); // { id, name, type }
  const [deleteOtp, setDeleteOtp] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);

  // Direct Message State
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [directMessageTarget, setDirectMessageTarget] = useState(null); // { id, name, type }
  const [directMessageContent, setDirectMessageContent] = useState('');
  const [directMessageTemplate, setDirectMessageTemplate] = useState('');
  const [directMediaUrl, setDirectMediaUrl] = useState('');
  const [directMediaType, setDirectMediaType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);

  // Landing Page CMS State
  const [landingContent, setLandingContent] = useState({ hero_text: '', cta_text: '', image_url: '' });
  const [landingLoading, setLandingLoading] = useState(false);

  // Template & Broadcast State
  const [templates, setTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', media_url: '', media_type: 'image' });
  const [selectedTargets, setSelectedTargets] = useState([]); // [{id, name}]
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState('');
  const [broadcastMediaType, setBroadcastMediaType] = useState('image');
  const [isBroadcasting, setIsBroadcastLoading] = useState(false);

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

  const fetchLandingContent = async () => {
    try {
      const data = await authService.getLandingPage();
      setLandingContent(data);
    } catch (err) {
      console.error('Failed to fetch landing content');
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await authService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  };

  const handleFileUpload = async (file, onSuccess) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await authService.uploadFile(file);
      // Determine simplified type
      let type = 'document';
      if (data.type.startsWith('image/')) type = 'image';
      else if (data.type.startsWith('video/')) type = 'video';
      else if (data.type.startsWith('audio/')) type = 'audio';
      
      onSuccess(data.url, type);
      showFlash('File uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      showFlash('File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.createTemplate(newTemplate);
      showFlash('Template created successfully');
      setShowCreateTemplate(false);
      setNewTemplate({ name: '', content: '', media_url: '', media_type: 'image' });
      fetchTemplates();
    } catch (err) {
      showFlash('Failed to create template', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await authService.deleteTemplate(id);
      showFlash('Template deleted');
      fetchTemplates();
    } catch (err) {
      showFlash('Failed to delete template', 'error');
    }
  };

  const handleSendBroadcast = async () => {
    if (selectedTargets.length === 0) return showFlash('No targets selected', 'error');
    if (!selectedTemplate && !broadcastMessage) return showFlash('Message content is empty', 'error');

    setIsBroadcastLoading(true);
    try {
      const targets = selectedTargets.map(t => ({ id: t.id, type: t.type }));
      await authService.sendWaBroadcast(targets, broadcastMessage, selectedTemplate, broadcastMediaUrl, broadcastMediaType);
      showFlash('Broadcast initiated successfully');
      setBroadcastMessage('');
      setBroadcastMediaUrl('');
      setSelectedTargets([]);
      setSelectedTemplate('');
    } catch (err) {
      showFlash('Broadcast failed', 'error');
    } finally {
      setIsBroadcastLoading(false);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!directMessageTemplate && !directMessageContent) return showFlash('Message is empty', 'error');
    
    setWaActionLoading(true);
    try {
      await authService.sendWaBroadcast(
        [{ id: directMessageTarget.id, type: directMessageTarget.type }], 
        directMessageContent, 
        directMessageTemplate,
        directMediaUrl,
        directMediaType
      );
      showFlash('Message sent successfully');
      setShowDirectMessage(false);
      setDirectMessageContent('');
      setDirectMessageTemplate('');
      setDirectMediaUrl('');
    } catch (err) {
      showFlash('Failed to send message', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleCreateWaGroup = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      const parts = newEntity.participants.split(',').map(p => p.trim()).filter(p => p);
      await authService.createWaGroup(newEntity.name, parts);
      showFlash('WhatsApp group created successfully');
      setShowCreateGroup(false);
      setNewEntity({ name: '', description: '', participants: '' });
      fetchWaChats();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to create group', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleCreateWaChannel = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.createWaChannel(newEntity.name, newEntity.description);
      showFlash('WhatsApp channel created successfully');
      setShowCreateChannel(false);
      setNewEntity({ name: '', description: '', participants: '' });
      fetchWaChats();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to create channel', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const initiateDelete = async (id, name, type) => {
    setDeleteContext({ id, name, type });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleRequestWaDeleteOtp = async () => {
    setWaActionLoading(true);
    try {
      await authService.requestWaDeleteOtp();
      setDeleteOtpSent(true);
      showFlash('Deletion OTP sent to your WhatsApp');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleConfirmWaDelete = async () => {
    setWaActionLoading(true);
    try {
      await authService.confirmWaDelete(deleteContext.id, deleteContext.type, deleteOtp);
      showFlash(`${deleteContext.type === 'group' ? 'Group' : 'Channel'} deleted successfully`);
      setShowDeleteModal(false);
      setDeleteContext(null);
      fetchWaChats();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleUpdateLandingPage = async (e) => {
    e.preventDefault();
    setLandingLoading(true);
    try {
      await authService.updateLandingPage(landingContent);
      showFlash('Landing page updated successfully');
    } catch (err) {
      console.error('Landing update error:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.message || err.message || 'Failed to update landing page.';
      showFlash(errorMsg, 'error');
    } finally {
      setLandingLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchSettings(), fetchGroups(), fetchWaStatus(), fetchLandingContent(), fetchTemplates()]);
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
    technical: { label: 'Technical / API', icon: Cpu, keys: ['vite_api_base_url'] }
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
          <button 
            onClick={() => setActiveTab('cms')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'cms' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Landing Page
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'broadcast' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Broadcast
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'templates' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Templates
          </button>
        </div>

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

              <div className="flex flex-col p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 min-h-[400px]">
                {waStatus.status === 'CONNECTED' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Managed Entities</h3>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Groups & Channels</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowCreateGroup(true)}
                          className="px-3 py-1.5 bg-primary-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-primary-700 transition"
                        >
                          New Group
                        </button>
                        <button 
                          onClick={() => setShowCreateChannel(true)}
                          className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-slate-800 transition"
                        >
                          New Channel
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                      {/* Groups Section */}
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Users className="w-3 h-3" /> Managed Groups
                        </h4>
                        <div className="space-y-2">
                          {waChats.filter(c => c.isGroup && c.isAdmin).length > 0 ? (
                            waChats.filter(c => c.isGroup && c.isAdmin).map(group => (
                              <div key={group.id._serialized} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-red-200 transition-all">
                                <div className="flex items-center gap-3">
                                  {group.iconUrl ? (
                                    <img src={group.iconUrl} alt={group.name} className="w-10 h-10 rounded-xl object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-black">
                                      {group.name?.[0] || 'G'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{group.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{group.id._serialized || group.id.user}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setDirectMessageTarget({ id: group.id._serialized, name: group.name, type: 'group' });
                                      setShowDirectMessage(true);
                                    }}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                    title="Send Message"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                  <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg uppercase">Admin</span>
                                  <button 
                                    onClick={() => initiateDelete(group.id._serialized, group.name, 'group')}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Group"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic ml-2">No groups with admin access</p>
                          )}
                        </div>
                      </div>

                      {/* Channels Section */}
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Globe className="w-3 h-3" /> Active Channels
                        </h4>
                        <div className="space-y-2">
                          {waChats.filter(c => c.id.server === 'newsletter' && c.isAdmin).length > 0 ? (
                            waChats.filter(c => c.id.server === 'newsletter' && c.isAdmin).map(channel => (
                              <div key={channel.id._serialized} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-red-200 transition-all">
                                <div className="flex items-center gap-3">
                                  {channel.iconUrl ? (
                                    <img src={channel.iconUrl} alt={channel.name} className="w-10 h-10 rounded-xl object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">
                                      {channel.name?.[0] || 'C'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{channel.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{channel.id._serialized || channel.id.user}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setDirectMessageTarget({ id: channel.id._serialized, name: channel.name, type: 'channel' });
                                      setShowDirectMessage(true);
                                    }}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                    title="Send Message"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                  <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase">Admin</span>
                                  <button 
                                    onClick={() => initiateDelete(channel.id._serialized, channel.name, 'channel')}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Channel"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic ml-2">No channels with admin access</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : waStatus.status === 'AUTHENTICATED' || waStatus.status === 'AUTHENTICATING' ? (
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Finalizing Session...</h3>
                    <p className="text-slate-500 font-medium">Authenticating with WhatsApp. Please wait a moment.</p>
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
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-tight">Initializing Client...</h3>
                    <p className="text-slate-400 text-sm mt-2 font-medium">This may take a few seconds.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in duration-500">
            <header className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900">Bulk Broadcast</h2>
              <p className="text-slate-500 mt-2">Send messages or newsletters to multiple groups and channels at once.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Target Selection */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Available Targets</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {waChats.filter(c => c.isAdmin).map(chat => (
                      <div key={chat.id._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          {chat.iconUrl ? (
                            <img src={chat.iconUrl} alt={chat.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${chat.isGroup ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
                              {chat.name?.[0] || (chat.isGroup ? 'G' : 'C')}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">{chat.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase">{chat.isGroup ? 'Group' : 'Channel'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (!selectedTargets.find(t => t.id === chat.id._serialized)) {
                              setSelectedTargets([...selectedTargets, { id: chat.id._serialized, name: chat.name, type: chat.isGroup ? 'group' : 'channel' }]);
                            }
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Selected Recipients ({selectedTargets.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTargets.map(target => (
                      <span key={target.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm">
                        {target.name}
                        <button onClick={() => setSelectedTargets(selectedTargets.filter(t => t.id !== target.id))}><X className="w-3.5 h-3.5" /></button>
                      </span>
                    ))}
                    {selectedTargets.length === 0 && <p className="text-xs text-slate-400 italic">No targets selected yet</p>}
                  </div>
                </div>
              </div>

              {/* Message Composition */}
              <div className="space-y-8 bg-slate-50 p-8 rounded-[2.5rem]">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Use Template (Optional)</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all appearance-none"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">-- No Template --</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>

                {!selectedTemplate && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Custom Message</label>
                      <textarea 
                        rows="4"
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium transition-all resize-none"
                        placeholder="Type your message here..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Media / Attachment</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs transition-all"
                            placeholder="URL: https://..."
                            value={broadcastMediaUrl}
                            onChange={(e) => setBroadcastMediaUrl(e.target.value)}
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              id="broadcast-file" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => {
                                setBroadcastMediaUrl(url);
                                setBroadcastMediaType(type);
                              })}
                            />
                            <label 
                              htmlFor="broadcast-file"
                              className={`px-4 py-3.5 rounded-2xl font-black text-xs uppercase cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              Upload
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {broadcastMediaUrl && (
                        <>
                          <div className="col-span-1">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                            <select 
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all appearance-none"
                              value={broadcastMediaType}
                              onChange={(e) => setBroadcastMediaType(e.target.value)}
                            >
                              <option value="image">Image</option>
                              <option value="document">Document</option>
                              <option value="audio">Audio</option>
                              <option value="video">Video</option>
                            </select>
                          </div>
                          <div className="col-span-1 flex items-end">
                            <button 
                              onClick={() => { setBroadcastMediaUrl(''); setBroadcastMediaType('image'); }}
                              className="w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition text-xs uppercase"
                            >
                              Reset Media
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedTemplate && (
                  <div className="p-6 bg-white rounded-2xl border border-primary-100">
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-2">Template Content</p>
                    <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-4">
                      {templates.find(t => t.id.toString() === selectedTemplate.toString())?.content}
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting || (selectedTargets.length === 0) || (!selectedTemplate && !broadcastMessage)}
                  className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-xl shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  {isBroadcasting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {isBroadcasting ? 'Broadcasting...' : `Send Broadcast to ${selectedTargets.length} Targets`}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in duration-500">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Message Templates</h2>
                <p className="text-slate-500 mt-2">Create reusable messages with media attachments for quick broadcasting.</p>
              </div>
              <button 
                onClick={() => setShowCreateTemplate(true)}
                className="px-6 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Template
              </button>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length > 0 ? (
                templates.map(tpl => (
                  <div key={tpl.id} className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 flex flex-col group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary-600">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <button 
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{tpl.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">{tpl.content}</p>
                    {tpl.media_url && (
                      <div className="pt-4 border-t border-slate-200/50 flex items-center gap-2">
                        <span className="text-[10px] font-black bg-white text-slate-400 px-2 py-1 rounded-lg uppercase border border-slate-100">
                          {tpl.media_type || 'Media'} Included
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">No Templates Found</h3>
                  <p className="text-slate-400 mt-2">Create your first template to start broadcasting</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cms' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <header className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900">Landing Page Configuration</h2>
              <p className="text-slate-500 mt-2">Edit the main content of your public landing page</p>
            </header>

            <div className="grid md:grid-cols-2 gap-12">
              <form onSubmit={handleUpdateLandingPage} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Hero Headline</label>
                  <textarea 
                    required
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none font-bold text-lg"
                    placeholder="Main headline for the hero section"
                    value={landingContent.hero_text}
                    onChange={(e) => setLandingContent({ ...landingContent, hero_text: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">CTA Button Text</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="Text for the main action button"
                    value={landingContent.cta_text}
                    onChange={(e) => setLandingContent({ ...landingContent, cta_text: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Hero Image URL</label>
                  <input 
                    type="url"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                    placeholder="https://images.unsplash.com/..."
                    value={landingContent.image_url}
                    onChange={(e) => setLandingContent({ ...landingContent, image_url: e.target.value })}
                  />
                  <p className="mt-2 text-xs text-slate-400">Provide a high-quality image URL (Unsplash recommended)</p>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={landingLoading}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {landingLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {landingLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Live Preview</h3>
                <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
                  <div className="p-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-4">
                      {landingContent.hero_text || 'Headline Preview'}
                    </h1>
                    <button className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl text-sm mb-6 pointer-events-none">
                      {landingContent.cta_text || 'CTA Preview'}
                    </button>
                    <img 
                      src={landingContent.image_url || 'https://via.placeholder.com/800x600'} 
                      alt="Preview" 
                      className="rounded-2xl w-full aspect-video object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DIRECT MESSAGE MODAL */}
      {showDirectMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Send Message</h3>
              <p className="text-slate-500 font-medium mt-1">To: <span className="text-primary-600 font-bold">{directMessageTarget?.name}</span></p>
            </header>
            <form onSubmit={handleSendDirectMessage} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Use Template (Optional)</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all appearance-none"
                  value={directMessageTemplate}
                  onChange={(e) => setDirectMessageTemplate(e.target.value)}
                >
                  <option value="">-- No Template --</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>

              {!directMessageTemplate && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Message Content</label>
                    <textarea 
                      rows="4"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium transition-all resize-none"
                      placeholder="Type your message here..."
                      value={directMessageContent}
                      onChange={(e) => setDirectMessageContent(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Media / Attachment</label>
                      <div className="flex gap-2">
                        <input 
                          type="url"
                          className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs transition-all"
                          placeholder="URL: https://..."
                          value={directMediaUrl}
                          onChange={(e) => setDirectMediaUrl(e.target.value)}
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            id="direct-file" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => {
                              setDirectMediaUrl(url);
                              setDirectMediaType(type);
                            })}
                          />
                          <label 
                            htmlFor="direct-file"
                            className={`px-4 py-3.5 rounded-2xl font-black text-xs uppercase cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                          >
                            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Upload
                          </label>
                        </div>
                      </div>
                    </div>
                    {directMediaUrl && (
                      <>
                        <div className="col-span-1">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                          <select 
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all appearance-none"
                            value={directMediaType}
                            onChange={(e) => setDirectMediaType(e.target.value)}
                          >
                            <option value="image">Image</option>
                            <option value="document">Document</option>
                            <option value="audio">Audio</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        <div className="col-span-1 flex items-end">
                          <button 
                            onClick={() => { setDirectMediaUrl(''); setDirectMediaType('image'); }}
                            className="w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition text-xs uppercase"
                          >
                            Reset Media
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {directMessageTemplate && (
                <div className="p-6 bg-primary-50/50 rounded-2xl border border-primary-100">
                  <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-2">Template Preview</p>
                  <p className="text-sm text-slate-600 italic">
                    {templates.find(t => t.id.toString() === directMessageTemplate.toString())?.content}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={waActionLoading || (!directMessageTemplate && !directMessageContent)}
                  className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {waActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {waActionLoading ? 'Sending...' : 'Send Message'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowDirectMessage(false);
                    setDirectMessageContent('');
                    setDirectMessageTemplate('');
                  }}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create WhatsApp Group</h3>
              <p className="text-slate-500 font-medium mt-1">Start a new organizational group</p>
            </header>
            <form onSubmit={handleCreateWaGroup} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Group Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all"
                  placeholder="e.g. Sales Team"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Participants (Optional)</label>
                <textarea 
                  rows="2"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs transition-all resize-none"
                  placeholder="919876543210, 918887776665..."
                  value={newEntity.participants}
                  onChange={(e) => setNewEntity({...newEntity, participants: e.target.value})}
                />
                <p className="text-[10px] text-slate-400 mt-2 ml-1">Comma-separated phone numbers with country code</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={waActionLoading}
                  className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 disabled:opacity-50"
                >
                  {waActionLoading ? 'Creating...' : 'Create Group'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP CREATE CHANNEL MODAL */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create WhatsApp Channel</h3>
              <p className="text-slate-500 font-medium mt-1">Start a new broadcast channel</p>
            </header>
            <form onSubmit={handleCreateWaChannel} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Channel Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all"
                  placeholder="e.g. Official Updates"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  rows="3"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-sm transition-all"
                  placeholder="Channel purpose and details..."
                  value={newEntity.description}
                  onChange={(e) => setNewEntity({...newEntity, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={waActionLoading}
                  className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
                >
                  {waActionLoading ? 'Creating...' : 'Create Channel'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete {deleteContext?.type === 'group' ? 'Group' : 'Channel'}?</h3>
              <p className="text-slate-500 font-medium mt-1 leading-relaxed">
                You are about to delete <span className="text-slate-900 font-bold">"{deleteContext?.name}"</span>. This action is permanent and requires WhatsApp verification.
              </p>
            </header>

            {!deleteOtpSent ? (
              <div className="flex gap-3">
                <button 
                  onClick={handleRequestWaDeleteOtp}
                  disabled={waActionLoading}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {waActionLoading ? 'Requesting...' : 'Verify & Delete'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
                    <button onClick={() => setDeleteOtpSent(false)} className="text-[10px] font-black text-primary-600 uppercase hover:underline">Resend</button>
                  </div>
                  <input 
                    type="text" 
                    maxLength="6"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-black tracking-[0.8em] text-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
                    placeholder="000000"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                  />
                  <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-black tracking-widest">Enter the code sent to admin WhatsApp</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleConfirmWaDelete}
                    disabled={waActionLoading || deleteOtp.length !== 6}
                    className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-50"
                  >
                    {waActionLoading ? 'Confirming...' : 'Confirm Deletion'}
                  </button>
                  <button 
                    onClick={() => { setShowDeleteModal(false); setDeleteOtpSent(false); }}
                    className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Message Template</h3>
              <p className="text-slate-500 font-medium mt-1">Define a reusable message with media</p>
            </header>
            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Template Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all"
                  placeholder="e.g. Welcome Message"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Message Content</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium transition-all resize-none"
                  placeholder="Type the message body..."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Media / Attachment</label>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs transition-all"
                      placeholder="URL: https://..."
                      value={newTemplate.media_url}
                      onChange={(e) => setNewTemplate({...newTemplate, media_url: e.target.value})}
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        id="template-file" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => {
                          setNewTemplate({ ...newTemplate, media_url: url, media_type: type });
                        })}
                      />
                      <label 
                        htmlFor="template-file"
                        className={`px-4 py-3.5 rounded-2xl font-black text-xs uppercase cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                      >
                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Upload
                      </label>
                    </div>
                  </div>
                </div>
                
                {newTemplate.media_url && (
                  <>
                    <div className="col-span-1">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold transition-all appearance-none"
                        value={newTemplate.media_type}
                        onChange={(e) => setNewTemplate({...newTemplate, media_type: e.target.value})}
                      >
                        <option value="image">Image</option>
                        <option value="document">Document</option>
                        <option value="audio">Audio</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button 
                        type="button"
                        onClick={() => setNewTemplate({ ...newTemplate, media_url: '', media_type: 'image' })}
                        className="w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition text-xs uppercase"
                      >
                        Reset Media
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={waActionLoading}
                  className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-100 disabled:opacity-50"
                >
                  {waActionLoading ? 'Saving...' : 'Save Template'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateTemplate(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
