import React, { useState, useEffect } from 'react';
import api from '../services/api';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { 
  User, Shield, Check, X, RefreshCw, Settings, Save, AlertCircle, 
  Globe, Lock, Cpu, Send, Plus, Trash2, History, ChevronDown, 
  ChevronUp, Terminal, MessageSquare, ShieldCheck, Users, 
  Layout, Smartphone, FileText, Menu, LogOut, Activity, BarChart2,
  Image as ImageIcon, File as FileIcon, Music, Video, Search
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg', flash }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-[2.5rem] w-full ${maxWidth} p-12 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tightest uppercase">{title}</h3>
            {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </header>
        
        {/* In-Modal Flash */}
        {flash && (
          <div className={`p-4 mb-8 rounded-xl border flex items-center gap-3 animate-in fade-in duration-300 ${
            flash.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'
          }`}>
            {flash.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <p className="text-xs font-bold">{flash.message}</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { updateSiteName } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  // WhatsApp Management State
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
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', media_url: '', media_type: 'image' });
  const [selectedTargets, setSelectedTargets] = useState([]); // [{id, name}]
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState('');
  const [broadcastMediaType, setBroadcastMediaType] = useState('image');
  const [isBroadcasting, setIsBroadcastLoading] = useState(false);

  // Advanced WhatsApp Management State
  const [showGroupManage, setShowGroupManage] = useState(false);
  const [managingGroup, setManagingGroup] = useState(null); // { id, name, metadata }
  const [joinRequests, setJoinRequests] = useState([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], allowMultiple: false });

  // Auto-Responder State
  const [responders, setResponders] = useState([]);
  const [newResponder, setNewResponder] = useState({ keyword: '', response: '', match_type: 'EXACT' });

  // Scheduled Messages State
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingResponder, setEditingResponder] = useState(null);
  const [editingScheduled, setEditingScheduled] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showResponderForm, setShowResponderForm] = useState(false);
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [showWaEntityForm, setShowWaEntityForm] = useState(false);
  const [waEntityType, setWaEntityType] = useState('group'); // 'group' or 'channel'
  const [newScheduled, setNewScheduled] = useState({ targets: [], message: '', media_url: '', media_type: 'image', scheduled_for: '' });

  // Audit & Poll Results State
  const [auditLogs, setAuditLogs] = useState([]);
  const [pollResults, setPollResults] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ phoneNumber: '', status: '' });

  // Flash Message State
  const [flash, setFlash] = useState(null);

  // New Group Form State
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [showMemberMessageModal, setShowMemberMessageModal] = useState(false);
  const [selectedMemberForMessage, setSelectedMemberForMessage] = useState(null);
  const [memberMessageContent, setMemberMessageContent] = useState('');
  const [memberMediaUrl, setMemberMediaUrl] = useState('');
  const [memberMediaType, setMemberMediaType] = useState('image');

  const handleUpdateMemberRole = async (userId, role) => {
    try {
      await authService.updateMemberRole(selectedGroup.id, userId, role);
      showFlash(`Member role updated to ${role}.`, 'success');
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash('Failed to update member role.', 'error');
    }
  };

  const handleSendMemberMessage = async (e) => {
    e.preventDefault();
    if (!selectedMemberForMessage?.phone_number) {
      showFlash('Member does not have a phone number registered.', 'error');
      return;
    }
    setWaActionLoading(true);
    try {
      const mediaOptions = memberMediaUrl ? { url: memberMediaUrl, type: memberMediaType } : null;
      const res = await authService.sendMessage(selectedMemberForMessage.id, selectedMemberForMessage.phone_number, memberMessageContent, mediaOptions);
      setGatewayResponse(res);
      showFlash('Message sent successfully!', 'success');
      setShowMemberMessageModal(false);
      setMemberMessageContent('');
      setMemberMediaUrl('');
    } catch (err) {
      showFlash('Failed to send message.', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  // WhatsApp Runtime State
  const [waStatus, setWaStatus] = useState({ status: 'DISCONNECTED', ready: false, qr: null, pairingCode: null, me: null });
  const [waChats, setWaChats] = useState([]);
  const [waContacts, setWaContacts] = useState([]);
  const [showPairingForm, setShowPairingForm] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');

  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 5000);
  };

  const fetchWaStatus = async () => {
    try {
      const status = await authService.getWhatsappStatus();
      setWaStatus(status || { status: 'DISCONNECTED', ready: false, qr: null, me: null });
    } catch (err) {
      console.error('Failed to fetch WhatsApp status');
    }
  };

  const fetchWaChats = async () => {
    try {
      const chats = await authService.getWhatsappChats();
      setWaChats(chats || []);
    } catch (err) {
      console.error('Failed to fetch chats');
    }
  };

  const fetchWaData = async () => {
    try {
      const [chats, contacts] = await Promise.all([
        authService.getWhatsappChats(),
        authService.getWhatsappContacts()
      ]);
      console.log('[DEBUG] Fetched WA Chats:', chats);
      setWaChats(chats || []);
      setWaContacts(contacts || []);
    } catch (err) {
      console.error('Failed to fetch WhatsApp data');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authService.getAllUsers();
      setUsers(response || []);
    } catch (err) {
      showFlash('Failed to fetch users.', 'error');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/all');
      setSettings(response.data || []);
    } catch (err) {
      showFlash('Failed to fetch settings.', 'error');
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await authService.getAllGroups();
      setGroups(data || []);
    } catch (err) {
      showFlash('Failed to fetch groups.', 'error');
    }
  };

  const fetchLandingContent = async () => {
    try {
      const data = await authService.getLandingPage();
      setLandingContent(data || { hero_text: '', cta_text: '', image_url: '' });
    } catch (err) {
      console.error('Failed to fetch landing content');
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await authService.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  };

  const fetchResponders = async () => {
    try {
      const data = await authService.getResponders();
      setResponders(data || []);
    } catch (err) {
      console.error('Failed to fetch responders');
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      const data = await authService.getScheduledMessages();
      setScheduledMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch scheduled messages');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await authService.getAuditLogs(auditFilters);
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    }
  };

  const fetchPollResults = async () => {
    try {
      const data = await authService.getPollResults();
      setPollResults(data || []);
    } catch (err) {
      console.error('Failed to fetch poll results');
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const data = await authService.getGroupMembers(groupId);
      setGroupMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch group members');
    }
  };

  const loadData = async () => {
    setLoading(true);
    // Fetch ALL data for all tabs in parallel on load
    try {
      await Promise.all([
        fetchWaStatus(),
        fetchWaData(),
        fetchUsers(),
        fetchSettings(),
        fetchGroups(),
        fetchLandingContent(),
        fetchTemplates(),
        fetchResponders(),
        fetchScheduledMessages(),
        fetchAuditLogs(),
        fetchPollResults()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(fetchWaStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Specifically for WhatsApp data which requires the engine to be ready
    if (waStatus.ready && waChats.length === 0) {
      fetchWaData();
    }
  }, [waStatus.ready]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  // Handlers
  const handleFileUpload = async (file, onSuccess) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await authService.uploadFile(file);
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

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await authService.createGroup(newGroupName, newGroupDesc);
      showFlash('Group created successfully');
      setNewGroupName('');
      setNewGroupDesc('');
      setShowGroupForm(false);
      fetchGroups();
    } catch (err) {
      showFlash('Failed to create group.', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await authService.addGroupMember(selectedGroup.id, addMemberUserId);
      showFlash('Member added to group');
      setAddMemberUserId('');
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash('Failed to add member', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await authService.removeGroupMember(selectedGroup.id, userId);
      showFlash('Member removed');
      fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      showFlash('Failed to remove member', 'error');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.createTemplate(newTemplate);
      showFlash('Template created successfully');
      setShowTemplateForm(false);
      setNewTemplate({ name: '', content: '', media_url: '', media_type: 'image' });
      fetchTemplates();
    } catch (err) {
      showFlash('Failed to create template', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.updateTemplate(editingTemplate.id, editingTemplate);
      showFlash('Template updated successfully');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      showFlash('Failed to update template', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    setDeleteContext({ id, name, entityType: 'template' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleDeleteGroup = async (id, name) => {
    setDeleteContext({ id, name, entityType: 'group' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleSendBroadcast = async () => {
    if (selectedTargets.length === 0) return showFlash('No targets selected', 'error');
    if (!selectedTemplate && !broadcastMessage) return showFlash('Message content is empty', 'error');

    setIsBroadcastLoading(true);
    try {
      const targets = selectedTargets.map(t => ({ id: t.id, type: t.type }));
      await authService.sendWaBroadcast(targets, broadcastMessage, selectedTemplate, broadcastMediaUrl, broadcastMediaType);
      showFlash('Broadcast sent successfully');
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
      showFlash('WhatsApp group created');
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
      showFlash('WhatsApp channel created');
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
      showFlash('OTP sent to your WhatsApp');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleConfirmWaDelete = async () => {
    setWaActionLoading(true);
    try {
      if (deleteContext.entityType === 'group' || deleteContext.entityType === 'channel') {
        // These are WhatsApp entities
        await authService.confirmWaDelete(deleteContext.id, deleteContext.entityType, deleteOtp);
        showFlash('WhatsApp entity deleted');
        fetchWaChats();
      } else {
        // System entities
        switch (deleteContext.entityType) {
          case 'template':
            await authService.deleteTemplate(deleteContext.id, deleteOtp);
            showFlash('Template deleted');
            fetchTemplates();
            break;
          case 'responder':
            await authService.deleteResponder(deleteContext.id, deleteOtp);
            showFlash('Responder deleted');
            fetchResponders();
            break;
          case 'scheduled':
            await authService.deleteScheduledMessage(deleteContext.id, deleteOtp);
            showFlash('Task deleted');
            fetchScheduledMessages();
            break;
          case 'group':
            await authService.deleteGroup(deleteContext.id, deleteOtp);
            showFlash('System group deleted');
            fetchGroups();
            setSelectedGroup(null);
            break;
          case 'poll':
            await authService.deleteAdvancedPoll(deleteContext.id, deleteOtp);
            showFlash('Poll deleted');
            fetchPollResults();
            break;
          case 'history':
            await authService.clearAuditHistory(deleteOtp);
            showFlash('History cleared');
            fetchAuditLogs();
            break;
          default:
            throw new Error('Unknown entity type');
        }
      }
      setShowDeleteModal(false);
      setDeleteContext(null);
      setDeleteOtp('');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const openGroupManage = async (id, name) => {
    setWaActionLoading(true);
    try {
      const metadata = await authService.getGroupMetadata(id);
      setManagingGroup({ id, name, metadata });
      setShowGroupManage(true);
      
      // Fetch join requests separately as it might fail if not admin or not supported
      try {
        const requests = await authService.getJoinRequests(id);
        setJoinRequests(requests || []);
      } catch (e) {
        console.warn('Failed to load join requests:', e.message);
        setJoinRequests([]);
      }
    } catch (err) {
      showFlash('Failed to load group metadata', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handlePromoteAdmin = async (participantId) => {
    try {
      await authService.promoteAdmin(managingGroup.id, participantId);
      showFlash('Promoted successfully');
      openGroupManage(managingGroup.id, managingGroup.name);
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleDemoteAdmin = async (participantId) => {
    try {
      await authService.demoteAdmin(managingGroup.id, participantId);
      showFlash('Demoted successfully');
      openGroupManage(managingGroup.id, managingGroup.name);
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm('Remove this participant?')) return;
    try {
      await authService.removeParticipant(managingGroup.id, participantId);
      showFlash('Removed successfully');
      openGroupManage(managingGroup.id, managingGroup.name);
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleApproveJoin = async (participantId) => {
    try {
      await authService.approveJoinRequest(managingGroup.id, participantId);
      showFlash('Approved successfully');
      openGroupManage(managingGroup.id, managingGroup.name);
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleRejectJoin = async (participantId) => {
    try {
      await authService.rejectJoinRequest(managingGroup.id, participantId);
      showFlash('Rejected successfully');
      openGroupManage(managingGroup.id, managingGroup.name);
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleSendPoll = async (e) => {
    e.preventDefault();
    const validOptions = pollData.options.filter(o => o.trim());
    if (validOptions.length < 2) return showFlash('At least 2 options required', 'error');
    
    setWaActionLoading(true);
    try {
      await authService.sendPoll(
        directMessageTarget.id, 
        pollData.question, 
        validOptions, 
        pollData.allowMultiple
      );
      showFlash('Poll sent successfully');
      setShowPollModal(false);
      setPollData({ question: '', options: ['', ''], allowMultiple: false });
    } catch (err) {
      showFlash('Failed to send poll', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleCreateResponder = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.createResponder(newResponder);
      showFlash('Responder created');
      setShowResponderForm(false);
      setNewResponder({ keyword: '', response: '', match_type: 'EXACT' });
      fetchResponders();
    } catch (err) {
      showFlash('Failed to create responder', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleUpdateResponder = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      await authService.updateResponder(editingResponder.id, editingResponder);
      showFlash('Responder updated');
      setEditingResponder(null);
      fetchResponders();
    } catch (err) {
      showFlash('Failed to update responder', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleToggleResponder = async (id) => {
    try {
      await authService.toggleResponder(id);
      fetchResponders();
    } catch (err) {
      showFlash('Action failed', 'error');
    }
  };

  const handleDeleteResponder = async (id, keyword) => {
    setDeleteContext({ id, name: keyword, entityType: 'responder' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleCreateScheduled = async (e) => {
    e.preventDefault();
    if (newScheduled.targets.length === 0) return showFlash('No targets selected', 'error');
    setWaActionLoading(true);
    try {
      await authService.createScheduledMessage(newScheduled);
      showFlash('Message scheduled');
      setShowCreateScheduled(false);
      setNewScheduled({ targets: [], message: '', media_url: '', media_type: 'image', scheduled_for: '' });
      fetchScheduledMessages();
    } catch (err) {
      showFlash('Failed to schedule', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleCancelScheduled = async (id) => {
    try {
      await authService.cancelScheduledMessage(id);
      showFlash('Canceled');
      fetchScheduledMessages();
    } catch (err) {
      showFlash('Failed to cancel', 'error');
    }
  };

  const deleteScheduledMessage = async (id) => {
    setDeleteContext({ id, name: 'Scheduled Task', entityType: 'scheduled' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleDeletePoll = async (id, title) => {
    setDeleteContext({ id, name: title, entityType: 'poll' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleClearAuditHistory = () => {
    setDeleteContext({ id: 'all', name: 'Global Message History', entityType: 'history' });
    setShowDeleteModal(true);
    setDeleteOtpSent(false);
    setDeleteOtp('');
  };

  const handleUpdateLandingPage = async (e) => {
    e.preventDefault();
    setLandingLoading(true);
    try {
      await authService.updateLandingPage(landingContent);
      showFlash('Landing page updated');
    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.message || err.message || 'Failed to update landing page.';
      showFlash(errorMsg, 'error');
    } finally {
      setLandingLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      await api.post('/user/update-status', { userId, status });
      showFlash('User status updated');
      fetchUsers();
    } catch (err) {
      showFlash('Failed to update status', 'error');
    }
  };

  const handleUpdateSetting = async (key, value) => {
    setSaveLoading(true);
    try {
      await api.put('/settings/update', { key, value });
      showFlash('Setting updated');
      if (key === 'site_name') {
        updateSiteName(value);
      }
      fetchSettings();
    } catch (err) {
      showFlash('Failed to update setting', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    setTestSuccess('');
    setGatewayResponse(null);
    try {
      const response = await api.post('/settings/test-otp', { phone_number: testPhone });
      setTestSuccess('Test message sent');
      if (response.data.gatewayResponse) setGatewayResponse(response.data.gatewayResponse);
    } catch (err) {
      showFlash(err.response?.data?.error || 'Test failed', 'error');
      if (err.response?.data?.gatewayResponse) setGatewayResponse(err.response.data.gatewayResponse);
    } finally {
      setTestLoading(false);
    }
  };

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

  const handleRequestPairingCode = async (e) => {
    e.preventDefault();
    setWaActionLoading(true);
    try {
      const res = await authService.requestWaPairingCode(pairingPhone);
      setPairingCode(res.code);
      showFlash('Pairing code generated');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to generate code', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const handleWaReinit = async () => {
    try {
      await authService.reinitializeWhatsapp();
      showFlash('Initialization started');
      setTimeout(fetchWaStatus, 2000);
    } catch (err) {
      showFlash('Failed to reinitialize', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'users', label: 'User Directory', icon: User },
    { id: 'groups', label: 'System Groups', icon: Users },
    { id: 'whatsapp', label: 'WhatsApp Status', icon: Smartphone },
    { id: 'broadcast', label: 'Bulk Broadcast', icon: Send },
    { id: 'templates', label: 'Message Templates', icon: FileText },
    { id: 'responders', label: 'Auto-Responders', icon: MessageSquare },
    { id: 'scheduled', label: 'Scheduled Tasks', icon: RefreshCw },
    { id: 'history', label: 'Message History', icon: History },
    { id: 'polls', label: 'Poll Results', icon: BarChart2 },
    { id: 'cms', label: 'Landing Page', icon: Layout },
    { id: 'settings', label: 'Global Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-800 font-sans selection:bg-primary-100">
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 flex flex-col sticky top-0 h-screen z-30 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {!isSidebarCollapsed && <h1 className="text-lg font-bold text-white tracking-tight">Admin<span className="text-primary-400">Portal</span></h1>}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isSidebarCollapsed ? item.label : ''}
              className={`w-full flex items-center rounded-xl font-semibold transition-all duration-200 group ${
                isSidebarCollapsed ? 'justify-center py-4' : 'px-4 py-3 gap-3'
              } ${
                activeTab === item.id 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!isSidebarCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
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
          {!isSidebarCollapsed && (
            <button onClick={() => authService.logout()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Management Console</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
            </div>
            
            {activeTab === 'whatsapp' && (
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  waStatus.status === 'CONNECTED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {waStatus.status}
                </span>
                <button onClick={fetchWaStatus} className="p-1.5 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </header>

          {/* Flash Messages */}
          {flash && !showDirectMessage && !showWaEntityForm && !showTemplateForm && !showResponderForm && !showScheduledForm && !showDeleteModal && (
            <div className={`p-4 mb-8 rounded-xl border flex items-center gap-3 animate-in fade-in duration-300 ${
              flash.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'
            }`}>
              {flash.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <p className="text-xs font-bold">{flash.message}</p>
              <button onClick={() => setFlash(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* USERS */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Roles</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{u.name || 'User'}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                            <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase">{u.phone_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles?.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[9px] font-black rounded border border-primary-100 uppercase">{r}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                              u.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-100' :
                              u.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {u.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select 
                              className="bg-slate-100 border border-slate-200 text-[10px] font-black rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 uppercase tracking-widest appearance-none cursor-pointer outline-none"
                              value={u.status}
                              onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                            >
                              <option value="PENDING_VERIFICATION">Verify</option>
                              <option value="PENDING_APPROVAL">Approve</option>
                              <option value="ACTIVE">Activate</option>
                              <option value="INACTIVE">Deactivate</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SYSTEM GROUPS */}
            {activeTab === 'groups' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Directory</h3>
                      <button onClick={() => setShowGroupForm(!showGroupForm)} className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition shadow-sm">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {showGroupForm && (
                      <form onSubmit={handleCreateGroup} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                        <input type="text" required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                        <textarea className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Description" rows="2" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                        <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Create Group</button>
                      </form>
                    )}
                    <div className="space-y-2">
                      {groups.map(g => (
                        <button key={g.id} onClick={() => setSelectedGroup(g)} className={`w-full p-4 rounded-xl text-left transition-all border ${selectedGroup?.id === g.id ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                          <div className="font-bold text-slate-900 text-sm">{g.name}</div>
                          <div className="text-[9px] text-slate-500 font-medium mt-1 truncate uppercase tracking-widest">{g.description || 'General Group'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  {selectedGroup ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                      <header className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedGroup.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-widest">{selectedGroup.description || 'Organizational Unit'}</p>
                        </div>
                        <button onClick={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                      </header>
                      <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                          <Users className="w-5 h-5 text-primary-600" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Registry</h4>
                        </div>
                        <form onSubmit={handleAddMember} className="flex gap-3 mb-10">
                          <input type="text" className="flex-1 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Enter User ID..." value={addMemberUserId} onChange={(e) => setAddMemberUserId(e.target.value)} />
                          <button type="submit" className="px-6 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md">Add</button>
                        </form>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {groupMembers.map(m => (
                            <div key={m.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 group shadow-sm hover:bg-white hover:shadow-md transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                  {m.name?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-800 truncate">{m.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${m.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-white text-slate-400 border-slate-200'}`}>{m.role}</span>
                                    {m.phone_number && <span className="text-[9px] font-mono text-slate-400">{m.phone_number}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setSelectedMemberForMessage(m); setShowMemberMessageModal(true); }} 
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                  title="Send Message"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                {m.role === 'ADMIN' ? (
                                  <button onClick={() => handleUpdateMemberRole(m.id, 'MEMBER')} title="Demote to Member" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><ChevronDown className="w-4 h-4" /></button>
                                ) : (
                                  <button onClick={() => handleUpdateMemberRole(m.id, 'ADMIN')} title="Promote to Admin" className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"><ChevronUp className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => handleRemoveMember(m.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove from Group"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                      <div>
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Selection Required</h3>
                        <p className="text-slate-400 text-[10px] mt-2 uppercase font-bold tracking-tighter opacity-60">Select a group to manage membership</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHATSAPP STATUS */}
            {activeTab === 'whatsapp' && (
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <Smartphone className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Service Status</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">WhatsApp Web Connectivity</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Link</span>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${waStatus.status === 'CONNECTED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{waStatus.status}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready Status</span>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${waStatus.ready ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{waStatus.ready ? 'READY' : 'WAITING'}</span>
                      </div>
                      {waStatus.me && (
                        <div className="mt-6 p-5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-5 shadow-2xl">
                          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-primary-900/50">{waStatus.me.pushname?.[0]}</div>
                          <div>
                            <p className="text-sm font-black text-white">{waStatus.me.pushname}</p>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{waStatus.me.wid.user}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-10">
                      <button onClick={handleWaReinit} className="py-4 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-slate-800 transition shadow-xl">Reconnect</button>
                      <button onClick={handleWaLogout} className="py-4 bg-red-50 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-red-100 transition border border-red-100">Logout</button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Linking Method</h3>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setShowPairingForm(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!showPairingForm ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>QR Code</button>
                        <button onClick={() => setShowPairingForm(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${showPairingForm ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>Phone Number</button>
                      </div>
                    </div>

                    {showPairingForm ? (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Link your account by entering your phone number and receiving an 8-character pairing code to enter on your mobile device.</p>
                        {!pairingCode ? (
                          <form onSubmit={handleRequestPairingCode} className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number (International Format)</label>
                              <input 
                                type="text" 
                                required 
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" 
                                placeholder="919876543210" 
                                value={pairingPhone} 
                                onChange={(e) => setPairingPhone(e.target.value)} 
                              />
                            </div>
                            <button type="submit" disabled={waActionLoading} className="w-full py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-3">
                              {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                              Generate Code
                            </button>
                          </form>
                        ) : (
                          <div className="text-center space-y-8 py-6">
                            <div className="flex flex-wrap justify-center gap-3">
                              {pairingCode.split('').map((char, i) => (
                                <div key={i} className="w-10 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center text-2xl font-black shadow-2xl border border-primary-500/20">{char}</div>
                              ))}
                            </div>
                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Next Steps:</h4>
                              <ol className="text-[11px] text-amber-800 font-bold space-y-2 list-decimal ml-4">
                                <li>Open WhatsApp on your mobile phone</li>
                                <li>Go to Linked Devices {'>'} Link a Device</li>
                                <li>Tap "Link with phone number instead"</li>
                                <li>Enter the 8-character code displayed above</li>
                              </ol>
                            </div>
                            <button onClick={() => setPairingCode('')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all underline">Reset Linking Request</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic mb-8">Standard QR protocol. Scan the dynamic packet using your mobile device's built-in WhatsApp scanner.</p>
                        {waStatus.qr ? (
                          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 relative group inline-block">
                            <div className="absolute inset-0 bg-primary-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waStatus.qr)}`} className="w-[200px] h-[200px] relative z-10" alt="Link" />
                          </div>
                        ) : (
                          <div className="py-20 animate-pulse">
                            <RefreshCw className="w-12 h-12 text-slate-200 animate-spin mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Generating QR Vector...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
                  {waStatus.status === 'CONNECTED' ? (
                    <div className="flex flex-col h-full animate-in fade-in">
                      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">{showWaEntityForm ? `Initialize ${waEntityType}` : `Managed Entities (${waChats.filter(c => c?.isAdmin).length})`}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{showWaEntityForm ? 'Direct Engine API Activation' : 'Administered Groups & Channels'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setWaEntityType('group'); setShowWaEntityForm(!showWaEntityForm); }} className={`p-2.5 ${showWaEntityForm && waEntityType === 'group' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'} rounded-xl hover:bg-primary-100 transition shadow-sm`} title="New Group"><Users className="w-5 h-5" /></button>
                          <button onClick={() => { setWaEntityType('channel'); setShowWaEntityForm(!showWaEntityForm); }} className={`p-2.5 ${showWaEntityForm && waEntityType === 'channel' ? 'bg-primary-600 text-white' : 'bg-slate-900 text-white'} rounded-xl hover:bg-slate-800 transition shadow-sm`} title="New Channel"><Send className="w-5 h-5" /></button>
                        </div>
                      </div>

                      {showWaEntityForm ? (
                        <div className="flex-1 animate-in slide-in-from-top-4 duration-500">
                          <form onSubmit={waEntityType === 'group' ? handleCreateWaGroup : handleCreateWaChannel} className="space-y-8 max-w-md mx-auto">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{waEntityType} Name</label>
                              <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" placeholder="Enter name..." value={newEntity.name} onChange={(e) => setNewEntity({...newEntity, name: e.target.value})} />
                            </div>
                            {waEntityType === 'group' ? (
                              <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone List (Comma-Separated)</label>
                                <textarea rows="3" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[10px] outline-none focus:ring-4 focus:ring-primary-100 resize-none shadow-inner" placeholder="919876543210, 91..." value={newEntity.participants} onChange={(e) => setNewEntity({...newEntity, participants: e.target.value})} />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                                <textarea rows="3" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-primary-100 resize-none shadow-inner" placeholder="Channel context..." value={newEntity.description} onChange={(e) => setNewEntity({...newEntity, description: e.target.value})} />
                              </div>
                            )}
                            <div className="flex gap-4 pt-6">
                              <button type="submit" disabled={waActionLoading} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl active:scale-95 transform transition-all">
                                {waActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Launch Engine'}
                              </button>
                              <button type="button" onClick={() => setShowWaEntityForm(false)} className="px-8 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                          {/* GROUPS CATEGORY */}
                        {waChats.filter(c => c?.isAdmin && c?.isGroup).length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Groups ({waChats.filter(c => c?.isAdmin && c?.isGroup).length})</h4>
                            </div>
                            <div className="space-y-3">
                              {waChats.filter(c => c?.isAdmin && c?.isGroup).map(chat => (
                                <div key={chat?.id?._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100">
                                  <div className="flex items-center gap-4">
                                    {chat?.iconUrl ? <img src={chat.iconUrl} className="w-11 h-11 rounded-xl object-cover shadow-sm" alt="" /> : <div className="w-11 h-11 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 shadow-inner">{chat?.name?.[0]}</div>}
                                    <div>
                                      <p className="text-sm font-black text-slate-800 leading-none mb-1">{chat?.name}</p>
                                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{chat?.id?._serialized}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => openGroupManage(chat.id?._serialized, chat.name)}
                                      className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm"
                                      title="Administer Group"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'group' });
                                        setShowPollModal(true);
                                      }}
                                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm"
                                      title="Send Poll"
                                    >
                                      <BarChart2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'group' }); setShowDirectMessage(true); }} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm"><MessageSquare className="w-4 h-4" /></button>
                                    <button onClick={() => initiateDelete(chat.id?._serialized, chat.name, 'group')} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CHANNELS CATEGORY */}
                        {waChats.filter(c => c?.isAdmin && !c?.isGroup).length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Broadcast Channels ({waChats.filter(c => c?.isAdmin && !c?.isGroup).length})</h4>
                            </div>
                            <div className="space-y-3">
                              {waChats.filter(c => c?.isAdmin && !c?.isGroup).map(chat => (
                                <div key={chat?.id?._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100">
                                  <div className="flex items-center gap-4">
                                    {chat?.iconUrl ? <img src={chat.iconUrl} className="w-11 h-11 rounded-xl object-cover shadow-sm" alt="" /> : <div className="w-11 h-11 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 shadow-inner">{chat?.name?.[0]}</div>}
                                    <div>
                                      <p className="text-sm font-black text-slate-800 leading-none mb-1">{chat?.name}</p>
                                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{chat?.id?._serialized}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'channel' });
                                        setShowPollModal(true);
                                      }}
                                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm"
                                      title="Send Poll"
                                    >
                                      <BarChart2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'channel' }); setShowDirectMessage(true); }} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm"><MessageSquare className="w-4 h-4" /></button>
                                    <button onClick={() => initiateDelete(chat.id?._serialized, chat.name, 'channel')} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {waChats.filter(c => c?.isAdmin).length === 0 && (
                          <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Activity className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Managed Entities Detected</p>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  ) : waStatus.qr ? (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                      <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 mb-10 relative group">
                        <div className="absolute inset-0 bg-primary-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waStatus.qr)}`} className="w-[250px] h-[250px] relative z-10" alt="Link" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Protocol Authorization</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Scan using an authorized device</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-pulse">
                      <RefreshCw className="w-12 h-12 text-slate-200 animate-spin mb-6" />
                      <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">Connecting to Engine...</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BROADCAST */}
            {activeTab === 'broadcast' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 animate-in zoom-in-95 duration-500">
                <div className="grid lg:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-1 bg-primary-600 rounded-full"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Targets</h3>
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {waChats.filter(c => c?.isAdmin).map(chat => (
                          <button key={chat?.id?._serialized} onClick={() => !selectedTargets.find(t => t.id === chat?.id?._serialized) && setSelectedTargets([...selectedTargets, { id: chat?.id?._serialized, name: chat?.name, type: chat?.isGroup ? 'group' : 'channel' }])} className="w-full p-4 bg-slate-50 rounded-2xl flex items-center justify-between hover:bg-primary-600 hover:text-white transition-all group border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                              {chat?.iconUrl ? <img src={chat.iconUrl} className="w-10 h-10 rounded-xl shadow-sm" alt="" /> : <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black group-hover:text-primary-600 shadow-inner">{chat?.name?.[0]}</div>}
                              <div className="text-left">
                                <p className="text-sm font-black tracking-tight">{chat?.name}</p>
                                <p className="text-[9px] font-mono uppercase opacity-60 tracking-widest">{chat?.isGroup ? 'Group' : 'Channel'}</p>
                              </div>
                            </div>
                            <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Current Selection ({selectedTargets.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTargets.map(t => (
                          <span key={t.id} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-lg animate-in scale-95 uppercase tracking-widest">
                            {t.name}
                            <button onClick={() => setSelectedTargets(selectedTargets.filter(st => st.id !== t.id))} className="hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full border border-slate-800">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 space-y-8 flex flex-col h-full">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Template</label>
                        <div className="relative">
                          <select className="w-full px-6 py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary-500" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                            <option value="">-- Manual Message --</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Content</label>
                        <textarea rows="8" className="w-full px-6 py-5 bg-slate-800 border border-slate-700 text-white rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-primary-500 resize-none custom-scrollbar" placeholder="Compose message here..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                      </div>

                      <button onClick={handleSendBroadcast} disabled={isBroadcasting || selectedTargets.length === 0} className="w-full py-6 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/50 flex items-center justify-center gap-4 hover:bg-primary-500 transition-all active:scale-95 transform">
                        {isBroadcasting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        Send Broadcast
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="space-y-10">
                <header className="flex justify-between items-center px-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Response Hub</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pre-defined Broadcast Content</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowTemplateForm(!showTemplateForm);
                      setEditingTemplate(null);
                    }} 
                    className={`px-8 py-4 ${showTemplateForm ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'} text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transform transition-all`}
                  >
                    {showTemplateForm ? 'Cancel' : 'Create New Template'}
                  </button>
                </header>

                {(showTemplateForm || editingTemplate) && (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><Plus className="w-6 h-6" /></div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingTemplate ? 'Modify Template' : 'Initialize New Template'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{editingTemplate ? 'Updating existing protocol' : 'Standardize your broadcast transmission'}</p>
                      </div>
                    </div>
                    <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Identifier</label>
                          <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none" placeholder="e.g. Welcome Message" value={editingTemplate ? editingTemplate.name : newTemplate.name} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, name: e.target.value}) : setNewTemplate({ ...newTemplate, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Protocol</label>
                          <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none appearance-none" value={editingTemplate ? editingTemplate.media_type : newTemplate.media_type} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, media_type: e.target.value}) : setNewTemplate({ ...newTemplate, media_type: e.target.value })}>
                            <option value="image">Image Attachment</option>
                            <option value="video">Video Stream</option>
                            <option value="document">Document Packet</option>
                            <option value="audio">Audio Payload</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Payload (Content)</label>
                        <textarea required rows="5" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary-100 outline-none resize-none" placeholder="Enter message body..." value={editingTemplate ? editingTemplate.content : newTemplate.content} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, content: e.target.value}) : setNewTemplate({ ...newTemplate, content: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remote Media URL (Optional)</label>
                        <input type="url" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-primary-100 outline-none" placeholder="https://external-storage.com/file.jpg" value={editingTemplate ? editingTemplate.media_url || '' : newTemplate.media_url} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, media_url: e.target.value}) : setNewTemplate({ ...newTemplate, media_url: e.target.value })} />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={waActionLoading} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl shadow-primary-900/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                          {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          {editingTemplate ? 'Execute Update' : 'Finalize Template'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowTemplateForm(false);
                            setEditingTemplate(null);
                          }} 
                          className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200"
                        >
                          Abort
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {templates.map(t => (
                    <div key={t.id} className={`bg-white p-8 rounded-3xl shadow-sm border ${editingTemplate?.id === t.id ? 'border-primary-600 ring-4 ring-primary-100' : 'border-slate-200'} flex flex-col group hover:shadow-2xl hover:border-primary-100 transition-all duration-500`}>
                      <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 ${editingTemplate?.id === t.id ? 'bg-primary-600 text-white' : 'bg-slate-50 text-primary-600'} rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner transition-colors duration-500`}>
                          <FileText className="w-7 h-7" />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingTemplate(t);
                              setShowTemplateForm(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="p-3 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(t.id, t.name)} 
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{t.name}</h4>
                      <p className="text-sm text-slate-500 font-medium line-clamp-4 leading-relaxed mb-10">{t.content}</p>
                      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Type: {t.media_type || 'TEXT'}</span>
                        {t.media_url && <ImageIcon className="w-4 h-4 text-slate-300" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUTO-RESPONDERS */}
            {activeTab === 'responders' && (
              <div className="space-y-10">
                <header className="flex justify-between items-center px-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Auto-Responders</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Keyword-Based Automated Replies</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowResponderForm(!showResponderForm);
                      setEditingResponder(null);
                    }} 
                    className={`px-8 py-4 ${showResponderForm ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'} text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transform transition-all`}
                  >
                    {showResponderForm ? 'Cancel' : 'New Responder'}
                  </button>
                </header>

                {(showResponderForm || editingResponder) && (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><Plus className="w-6 h-6" /></div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingResponder ? 'Modify Responder' : 'Initialize Auto-Response'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{editingResponder ? 'Recalibrating keyword node' : 'Define new autonomous reply parameters'}</p>
                      </div>
                    </div>
                    <form onSubmit={editingResponder ? handleUpdateResponder : handleCreateResponder} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trigger Keyword</label>
                          <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none" placeholder="e.g. HELP" value={editingResponder ? editingResponder.keyword : newResponder.keyword} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, keyword: e.target.value}) : setNewResponder({ ...newResponder, keyword: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Match Algorithm</label>
                          <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none appearance-none" value={editingResponder ? editingResponder.match_type : newResponder.match_type} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, match_type: e.target.value}) : setNewResponder({ ...newResponder, match_type: e.target.value })}>
                            <option value="EXACT">Exact Match (Case Sensitive)</option>
                            <option value="CONTAINS">Contains Keyword</option>
                            <option value="STARTS_WITH">Starts With Keyword</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Automated Response Content</label>
                        <textarea required rows="5" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary-100 outline-none resize-none" placeholder="Enter auto-reply text..." value={editingResponder ? editingResponder.response : newResponder.response} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, response: e.target.value}) : setNewResponder({ ...newResponder, response: e.target.value })} />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={waActionLoading} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl shadow-primary-900/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                          {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          {editingResponder ? 'Execute Update' : 'Establish Responder'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowResponderForm(false);
                            setEditingResponder(null);
                          }} 
                          className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200"
                        >
                          Abort
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {responders.map(r => (
                    <div key={r.id} className={`bg-white p-8 rounded-3xl shadow-sm border flex flex-col group hover:shadow-2xl transition-all duration-500 ${editingResponder?.id === r.id ? 'border-primary-600 ring-4 ring-primary-100' : (r.is_active ? 'border-slate-200' : 'border-slate-100 grayscale opacity-60')}`}>
                      <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-colors duration-500 ${editingResponder?.id === r.id ? 'bg-primary-600 text-white border-primary-600' : (r.is_active ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-slate-50 text-slate-400 border-slate-200')}`}><MessageSquare className="w-7 h-7" /></div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingResponder(r);
                              setShowResponderForm(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleToggleResponder(r.id)} className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"><RefreshCw className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteResponder(r.id, r.keyword)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-1 tracking-tight uppercase">{r.keyword}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Match: {r.match_type}</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{r.response}</p>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${r.is_active ? 'text-green-600' : 'text-slate-400'}`}>{r.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCHEDULED TASKS */}
            {activeTab === 'scheduled' && (
              <div className="space-y-10">
                <header className="flex justify-between items-center px-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Scheduled Tasks</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Automation Pipeline</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowScheduledForm(!showScheduledForm);
                      setEditingScheduled(null);
                    }} 
                    className={`px-8 py-4 ${showScheduledForm ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'} text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transform transition-all`}
                  >
                    {showScheduledForm ? 'Cancel' : 'Schedule Message'}
                  </button>
                </header>

                {showScheduledForm && (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><RefreshCw className="w-6 h-6" /></div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">New Scheduled Transmission</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Queued automated broadcast protocol</p>
                      </div>
                    </div>
                    <form onSubmit={handleCreateScheduled} className="space-y-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Recipients</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[60px]">
                          {newScheduled.targets.map(t => (
                            <span key={t.id} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                              {t.name}
                              <button type="button" onClick={() => setNewScheduled({ ...newScheduled, targets: newScheduled.targets.filter(st => st.id !== t.id) })} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          <select className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-primary-600 cursor-pointer" onChange={(e) => {
                            if (!e.target.value) return;
                            const chat = waChats.find(c => c.id?._serialized === e.target.value);
                            if (chat && !newScheduled.targets.find(t => t.id === chat.id?._serialized)) {
                              setNewScheduled({ ...newScheduled, targets: [...newScheduled.targets, { id: chat.id?._serialized, name: chat.name, type: chat.isGroup ? 'group' : 'channel' }] });
                            }
                            e.target.value = '';
                          }}>
                            <option value="">+ Add Target</option>
                            {waChats.filter(c => c.isAdmin).map(chat => <option key={chat.id?._serialized} value={chat.id?._serialized}>{chat.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Execution Timestamp</label>
                          <input type="datetime-local" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none" value={newScheduled.scheduled_for} onChange={(e) => setNewScheduled({ ...newScheduled, scheduled_for: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Type</label>
                          <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none appearance-none" value={newScheduled.media_type} onChange={(e) => setNewScheduled({ ...newScheduled, media_type: e.target.value })}>
                            <option value="image">Image Attachment</option>
                            <option value="video">Video Stream</option>
                            <option value="document">Document Packet</option>
                            <option value="audio">Audio Payload</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                        <textarea required rows="4" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary-100 outline-none resize-none" placeholder="Transmission content..." value={newScheduled.message} onChange={(e) => setNewScheduled({ ...newScheduled, message: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Resource URL</label>
                        <input type="url" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-primary-100 outline-none" placeholder="https://..." value={newScheduled.media_url} onChange={(e) => setNewScheduled({ ...newScheduled, media_url: e.target.value })} />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={waActionLoading} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl shadow-primary-900/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                          {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          Confirm Schedule
                        </button>
                        <button type="button" onClick={() => setShowScheduledForm(false)} className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled For</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Targets</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Payload</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scheduledMessages.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-8 py-6">
                            <div className="text-sm font-black text-slate-900">{m?.scheduled_for ? new Date(m.scheduled_for).toLocaleString() : 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {m.id}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex -space-x-2">
                              {m.targets.map((t, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white" title={t.name || t.id}>{t.name?.[0] || 'T'}</div>
                              ))}
                              {m.targets.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500">+{m.targets.length - 3}</div>}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-medium text-slate-600 line-clamp-1 max-w-xs">{m.message}</p>
                            {m.media_url && <span className="text-[9px] font-black text-primary-600 uppercase tracking-tighter">Media Attached</span>}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                              m.status === 'SENT' ? 'bg-green-50 text-green-600 border-green-100' :
                              m.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              m.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>{m.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {m.status === 'PENDING' && <button onClick={() => handleCancelScheduled(m.id)} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm"><X className="w-4 h-4" /></button>}
                              <button onClick={() => deleteScheduledMessage(m.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MESSAGE HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-10">
                <header className="px-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Transmission History</p>
                  </div>
                  <button 
                    onClick={handleClearAuditHistory}
                    className="px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Clear History
                  </button>
                </header>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Payload</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="text-xs font-bold text-slate-900">{log?.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">{log.phone_number}</div>
                              {log.user_name && <div className="text-[9px] text-primary-600 font-bold uppercase tracking-widest mt-0.5">{log.user_name}</div>}
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs font-medium text-slate-500 line-clamp-1 max-w-md">{log.message}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                log.status === 'SUCCESS' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                              }`}>{log.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* POLL RESULTS */}
            {activeTab === 'polls' && (
              <div className="space-y-10">
                <header className="px-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Poll Intelligence</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Interaction Data</p>
                </header>
                <div className="grid md:grid-cols-2 gap-8">
                  {pollResults.map(poll => (
                    <div key={poll.id} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><BarChart2 className="w-6 h-6" /></div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-none">{poll.question || poll.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Type: {poll.type || 'WhatsApp'} | Chat: {poll.chat_id || 'System'}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeletePoll(poll.id, poll.question || poll.title)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <div className="space-y-4">
                        {poll.options && !Array.isArray(poll.options) ? Object.entries(poll.options).map(([opt, count]) => {
                          const total = Object.values(poll.options).reduce((a, b) => a + (Number(b) || 0), 0);
                          const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
                          return (
                            <div key={opt} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-600">{opt}</span>
                                <span className="text-primary-600">{count} Votes</span>
                              </div>
                              <div className="h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
                                <div className="h-full bg-primary-600 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="text-xs text-slate-400 italic">Voting data format incompatible or no options defined.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS */}
            {activeTab === 'cms' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 animate-in fade-in duration-500">
                <div className="grid lg:grid-cols-2 gap-16">
                  <form onSubmit={handleUpdateLandingPage} className="space-y-10">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hero Headline</label>
                      <textarea required rows="4" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-black text-2xl leading-tight resize-none shadow-inner" value={landingContent.hero_text} onChange={(e) => setLandingContent({ ...landingContent, hero_text: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CTA Label</label>
                      <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none font-bold text-lg" value={landingContent.cta_text} onChange={(e) => setLandingContent({ ...landingContent, cta_text: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Background Image URL</label>
                      <div className="flex gap-3">
                        <input type="url" required className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none font-mono text-xs" value={landingContent.image_url} onChange={(e) => setLandingContent({ ...landingContent, image_url: e.target.value })} />
                        <button type="button" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-lg"><ImageIcon className="w-6 h-6" /></button>
                      </div>
                    </div>
                    <button type="submit" disabled={landingLoading} className="w-full py-6 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl shadow-primary-900/20 flex items-center justify-center gap-4 disabled:opacity-50">
                      {landingLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                      Update Landing Page
                    </button>
                  </form>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Live Preview</h3>
                    <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 bg-white relative group">
                      <div className="p-12">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight mb-6">{landingContent.hero_text || 'Preview...'}</h1>
                        <button className="px-8 py-3 bg-primary-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest mb-10 shadow-lg shadow-primary-900/20">{landingContent.cta_text || 'ACTION'}</button>
                        <img src={landingContent.image_url} className="rounded-3xl w-full aspect-video object-cover shadow-2xl transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl animate-in fade-in">
                <div className="flex border-b border-slate-100 bg-slate-50/30">
                  {['general', 'ai', 'security', 'otp'].map(t => (
                    <button key={t} onClick={() => setActiveSettingsTab(t)} className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeSettingsTab === t ? 'border-primary-600 text-primary-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t}</button>
                  ))}
                </div>
                <div className="p-12">
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Application Name</label>
                        <div className="flex gap-3">
                          <input type="text" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={settings.find(s => s.key === 'site_name')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'site_name' ? {...s, value: e.target.value} : s))} />
                          <button onClick={() => handleUpdateSetting('site_name', settings.find(s => s.key === 'site_name')?.value)} className="px-10 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Website Domain</label>
                        <div className="flex gap-3">
                          <input type="text" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={settings.find(s => s.key === 'website_domain')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'website_domain' ? {...s, value: e.target.value} : s))} />
                          <button onClick={() => handleUpdateSetting('website_domain', settings.find(s => s.key === 'website_domain')?.value)} className="px-10 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Backend API URL</label>
                        <div className="flex gap-3">
                          <input type="text" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={settings.find(s => s.key === 'vite_api_base_url')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'vite_api_base_url' ? {...s, value: e.target.value} : s))} />
                          <button onClick={() => handleUpdateSetting('vite_api_base_url', settings.find(s => s.key === 'vite_api_base_url')?.value)} className="px-10 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-2">Caution: Changing this may require a frontend rebuild or reload to take full effect in all components.</p>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-inner">
                        <div>
                          <p className="text-base font-black text-slate-800 uppercase tracking-tighter">Enable WhatsApp OTP</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global 2-Factor Authentication Node</p>
                        </div>
                        <button onClick={() => handleUpdateSetting('otp_enabled', settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'false' : 'true')} className={`w-16 h-10 rounded-full transition-all relative ${settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'bg-primary-600 shadow-lg shadow-primary-900/30' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all shadow-md ${settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'left-7.5 ml-0.5' : 'left-1.5'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'ai' && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-inner">
                        <div>
                          <p className="text-base font-black text-slate-800 uppercase tracking-tighter">Enable AI Assistant</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Autonomous LLM Query Resolution</p>
                        </div>
                        <button onClick={() => handleUpdateSetting('ai_enabled', settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'false' : 'true')} className={`w-16 h-10 rounded-full transition-all relative ${settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'bg-primary-600 shadow-lg shadow-primary-900/30' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all shadow-md ${settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'left-7.5 ml-0.5' : 'left-1.5'}`} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">AI Provider</label>
                            <select 
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black appearance-none outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" 
                              value={settings.find(s => s.key === 'ai_provider')?.value || 'gemini'} 
                              onChange={(e) => {
                                handleUpdateSetting('ai_provider', e.target.value);
                                // Set a default model when provider changes
                                const defaultModel = e.target.value === 'mistral' ? 'mistral-tiny' : 'gemini-1.5-flash';
                                handleUpdateSetting('ai_model', defaultModel);
                              }}
                            >
                              <option value="gemini">Google Gemini</option>
                              <option value="mistral">Mistral AI</option>
                            </select>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Model Selection</label>
                            <select 
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black appearance-none outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" 
                              value={settings.find(s => s.key === 'ai_model')?.value || (settings.find(s => s.key === 'ai_provider')?.value === 'mistral' ? 'mistral-tiny' : 'gemini-1.5-flash')} 
                              onChange={(e) => handleUpdateSetting('ai_model', e.target.value)}
                            >
                              {settings.find(s => s.key === 'ai_provider')?.value === 'mistral' ? (
                                <>
                                  <option value="mistral-tiny">Mistral Tiny</option>
                                  <option value="mistral-small">Mistral Small</option>
                                  <option value="mistral-medium">Mistral Medium</option>
                                  <option value="mistral-large-latest">Mistral Large (Latest)</option>
                                  <option value="open-mistral-7b">Open Mistral 7B</option>
                                  <option value="open-mixtral-8x7b">Open Mixtral 8x7B</option>
                                </>
                              ) : (
                                <>
                                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next Gen)</option>
                                  <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Experimental)</option>
                                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Balanced)</option>
                                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Capable)</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Gemini API Key</label>
                          <div className="flex gap-3">
                            <input type="password" placeholder="AIza..." className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={settings.find(s => s.key === 'gemini_api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'gemini_api_key' ? {...s, value: e.target.value} : s))} />
                            <button onClick={() => handleUpdateSetting('gemini_api_key', settings.find(s => s.key === 'gemini_api_key')?.value)} className="px-10 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mistral API Key</label>
                          <div className="flex gap-3">
                            <input type="password" placeholder="mistral-..." className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={settings.find(s => s.key === 'mistral_api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'mistral_api_key' ? {...s, value: e.target.value} : s))} />
                            <button onClick={() => handleUpdateSetting('mistral_api_key', settings.find(s => s.key === 'mistral_api_key')?.value)} className="px-10 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Custom Instruction Prompt</label>
                          <div className="space-y-3">
                            <textarea rows="4" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary-100 resize-none shadow-inner" placeholder="You are a helpful community assistant..." value={settings.find(s => s.key === 'ai_custom_prompt')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'ai_custom_prompt' ? {...s, value: e.target.value} : s))} />
                            <button onClick={() => handleUpdateSetting('ai_custom_prompt', settings.find(s => s.key === 'ai_custom_prompt')?.value)} className="w-full py-4 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Save System Prompt</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in">
                      <div className="p-8 bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden border border-slate-800">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
                        <h4 className="text-white font-black text-sm uppercase tracking-[0.3em] mb-8">System Credentials</h4>
                        <div className="space-y-4">
                          {['Simple Auth Hash', 'JWT Signature Token'].map(l => (
                            <div key={l} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{l}</span>
                              <span className="text-[10px] font-mono text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity">••••••••••••••••••••</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'otp' && (
                    <div className="space-y-8 animate-in fade-in">
                      <form onSubmit={handleSendTest} className="space-y-8">
                        <div className="p-10 bg-primary-50/50 rounded-[2.5rem] border border-primary-100 relative overflow-hidden shadow-inner">
                          <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-primary-600/5 rotate-12" />
                          <h4 className="text-lg font-black text-primary-900 tracking-tightest mb-2 uppercase">Delivery Diagnostic</h4>
                          <p className="text-xs text-primary-700 font-medium leading-relaxed mb-10 max-w-sm">Validate the messaging pipeline by triggering a verification packet to an external device.</p>
                          <div className="flex gap-3">
                            <input type="tel" required className="flex-1 px-6 py-4 bg-white border border-primary-200 rounded-2xl text-lg font-black placeholder:text-primary-200 outline-none focus:ring-4 focus:ring-primary-100 shadow-sm" placeholder="919876543210" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
                            <button type="submit" disabled={testLoading} className="px-10 bg-primary-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-primary-900/30 flex items-center gap-3 active:scale-95 transform transition-all">
                              {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Fire Packet
                            </button>
                          </div>
                        </div>
                      </form>
                      {testSuccess && <div className="p-5 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-left-4 shadow-sm"><Check className="w-5 h-5" /> Transmission Acknowledged</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <Modal 
        isOpen={showDirectMessage} 
        onClose={() => { setShowDirectMessage(false); setDirectMessageContent(''); setDirectMessageTemplate(''); setDirectMediaUrl(''); }}
        title="Direct Transmission"
        subtitle={`To: ${directMessageTarget?.name}`}
        flash={flash}
      >
        <form onSubmit={handleSendDirectMessage} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Template (Optional)</label>
            <div className="relative">
              <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black appearance-none outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" value={directMessageTemplate} onChange={(e) => setDirectMessageTemplate(e.target.value)}>
                <option value="">-- Custom Message --</option>
                {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>
          {!directMessageTemplate && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Message Content</label>
                <textarea rows="4" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium outline-none focus:ring-4 focus:ring-primary-100 resize-none shadow-inner" placeholder="Enter message payload..." value={directMessageContent} onChange={(e) => setDirectMessageContent(e.target.value)} />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Media Attachment URL</label>
                  <div className="flex gap-2">
                    <input type="url" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" placeholder="https://..." value={directMediaUrl} onChange={(e) => setDirectMediaUrl(e.target.value)} />
                    <div className="relative">
                      <input type="file" id="direct-file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => { setDirectMediaUrl(url); setDirectMediaType(type); })} />
                      <label htmlFor="direct-file" className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase cursor-pointer flex items-center gap-2 transition-all shadow-md ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} UPLOAD</label>
                    </div>
                  </div>
                </div>
                {directMediaUrl && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none shadow-inner" value={directMediaType} onChange={(e) => setDirectMediaType(e.target.value)}>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                    </select>
                    <button type="button" onClick={() => { setDirectMediaUrl(''); setDirectMediaType('image'); }} className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-red-100 shadow-sm">Reset</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {directMessageTemplate && (
            <div className="p-8 bg-primary-50/50 rounded-3xl border border-primary-100 animate-in zoom-in-95 shadow-inner">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mb-4">Template Synthesis</p>
              <p className="text-sm text-slate-600 italic leading-relaxed font-medium">"{templates.find(t => t.id.toString() === directMessageTemplate.toString())?.content}"</p>
            </div>
          )}
          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={waActionLoading || (!directMessageTemplate && !directMessageContent)} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/30 flex items-center justify-center gap-3 active:scale-95 transform transition-all">
              {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} EXECUTE
            </button>
            <button type="button" onClick={() => { setShowDirectMessage(false); setDirectMessageContent(''); setDirectMessageTemplate(''); setDirectMediaUrl(''); }} className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 shadow-sm">CANCEL</button>
          </div>
        </form>
      </Modal>

      {/* CREATE MODALS REPLACED BY INLINE FORMS */}

      {/* POLL MODAL */}
      <Modal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        title="Send WhatsApp Poll"
        subtitle={`Target: ${directMessageTarget?.name}`}
        flash={flash}
      >
        <form onSubmit={handleSendPoll} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Poll Question</label>
            <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" placeholder="Enter question..." value={pollData.question} onChange={(e) => setPollData({...pollData, question: e.target.value})} />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Options (Min 2)</label>
            {pollData.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-inner" placeholder={`Option ${i+1}`} value={opt} onChange={(e) => {
                  const opts = [...pollData.options];
                  opts[i] = e.target.value;
                  setPollData({...pollData, options: opts});
                }} />
                {pollData.options.length > 2 && (
                  <button type="button" onClick={() => setPollData({...pollData, options: pollData.options.filter((_, idx) => idx !== i)})} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPollData({...pollData, options: [...pollData.options, '']})} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">+ Add Option</button>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between shadow-inner">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allow Multiple Selection</label>
            <button type="button" onClick={() => setPollData({...pollData, allowMultiple: !pollData.allowMultiple})} className={`w-12 h-7 rounded-full transition-all relative ${pollData.allowMultiple ? 'bg-primary-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${pollData.allowMultiple ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={waActionLoading || pollData.options.filter(o => o.trim()).length < 2} className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/30 active:scale-95 transform transition-all">Send Poll</button>
            <button type="button" onClick={() => setShowPollModal(false)} className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 shadow-sm">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* MEMBER DIRECT MESSAGE MODAL */}
      <Modal
        isOpen={showMemberMessageModal}
        onClose={() => setShowMemberMessageModal(false)}
        title="Direct Transmission"
        subtitle={`To: ${selectedMemberForMessage?.name} (${selectedMemberForMessage?.phone_number})`}
        flash={flash}
      >
        <form onSubmit={handleSendMemberMessage} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payload Content</label>
            <textarea 
              required 
              rows="5" 
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium outline-none focus:ring-4 focus:ring-primary-100 resize-none shadow-inner" 
              placeholder="Synthesize message payload" 
              value={memberMessageContent} 
              onChange={(e) => setMemberMessageContent(e.target.value)} 
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-amber-500 rounded-full"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional Attachment</h3>
            </div>
            <div className="flex gap-3">
              <input type="url" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-primary-100 shadow-inner" placeholder="Attachment URL: https://..." value={memberMediaUrl} onChange={(e) => setMemberMediaUrl(e.target.value)} />
              <div className="relative">
                <input type="file" id="member-file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => { setMemberMediaUrl(url); setMemberMediaType(type); })} />
                <label htmlFor="member-file" className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase cursor-pointer flex items-center gap-2 transition-all shadow-md ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} UPLOAD</label>
              </div>
            </div>
            {memberMediaUrl && (
              <div className="flex gap-3 animate-in slide-in-from-top-2 duration-300">
                <select className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none shadow-inner" value={memberMediaType} onChange={(e) => setMemberMediaType(e.target.value)}>
                  <option value="image">Image (JPEG/PNG)</option>
                  <option value="document">Document (PDF/DOCX)</option>
                  <option value="video">Video (MP4)</option>
                  <option value="audio">Audio (MP3/OGG)</option>
                </select>
                <button type="button" onClick={() => { setMemberMediaUrl(''); setMemberMediaType('image'); }} className="px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-red-100 shadow-sm">Discard</button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={waActionLoading || !memberMessageContent.trim()} 
              className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/30 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {waActionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} EXECUTE
            </button>
            <button 
              type="button" 
              onClick={() => setShowMemberMessageModal(false)} 
              className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200"
            >
              Abort
            </button>
          </div>
        </form>
      </Modal>

      {/* GROUP MANAGEMENT MODAL */}
      <Modal
        isOpen={showGroupManage}
        onClose={() => setShowGroupManage(false)}
        title="Group Administration"
        subtitle={managingGroup?.name}
        maxWidth="max-w-3xl"
        flash={flash}
      >
        <div className="space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Participants ({managingGroup?.metadata?.participants?.length || 0})</h4>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {managingGroup?.metadata?.participants?.map(p => (
                  <div key={p.id._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
                        {p.id.user[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.id.user}</p>
                        {p.isAdmin && <span className="text-[8px] font-black text-primary-600 uppercase">Admin</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.isAdmin ? (
                        <button onClick={() => handleDemoteAdmin(p.id._serialized)} title="Demote" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><ChevronDown className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => handlePromoteAdmin(p.id._serialized)} title="Promote" className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><ChevronUp className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleRemoveParticipant(p.id._serialized)} title="Remove" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Join Requests ({joinRequests.length})</h4>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {joinRequests.length > 0 ? joinRequests.map(r => (
                  <div key={r.id._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.id.user}</p>
                      <p className="text-[9px] text-slate-400">{new Date(r.timestamp * 1000).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveJoin(r.id._serialized)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleRejectJoin(r.id._serialized)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[9px] font-black text-slate-300 uppercase">No Pending Requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setShowGroupManage(false)} className="w-full py-4 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest">Close Panel</button>
        </div>
      </Modal>

      {/* GROUP MANAGEMENT MODAL */}
      <Modal
        isOpen={showGroupManage}
        onClose={() => setShowGroupManage(false)}
        title="Group Administration"
        subtitle={managingGroup?.name}
        maxWidth="max-w-4xl"
        flash={flash}
      >
        <div className="space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Participants ({managingGroup?.metadata?.participants?.length || 0})</h4>
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {managingGroup?.metadata?.participants?.map(p => (
                  <div key={p.id._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      {p.profilePic ? (
                        <img src={p.profilePic} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                      ) : (
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-300 border border-slate-100 shadow-inner">{p.name?.[0]}</div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-800 leading-none">{p.name}</p>
                          {(p.isAdmin || p.isSuperAdmin) && (
                            <Shield className={`w-3.5 h-3.5 ${p.isSuperAdmin ? 'text-amber-500' : 'text-primary-500'}`} />
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter mt-1">+{p.number}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setDirectMessageTarget({ id: p.id._serialized, name: p.name, type: 'contact' });
                          setShowDirectMessage(true);
                        }}
                        className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {p.isAdmin ? (
                        <button onClick={() => handleDemoteAdmin(p.id._serialized)} title="Demote" className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><ChevronDown className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => handlePromoteAdmin(p.id._serialized)} title="Promote" className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><ChevronUp className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleRemoveParticipant(p.id._serialized)} title="Remove" className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Join Requests ({joinRequests.length})</h4>
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {joinRequests.length > 0 ? joinRequests.map(r => (
                  <div key={r.id._serialized} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-800">{r.name || r.id.user}</p>
                      <p className="text-[9px] font-mono text-slate-400">+{r.id.user}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveJoin(r.id._serialized)} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 shadow-sm transition-all"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleRejectJoin(r.id._serialized)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 shadow-sm transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Pending Requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setShowGroupManage(false)} className="w-full py-5 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">Close Administration Panel</button>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteOtpSent(false); }}
        title="Delete Entity?"
        subtitle={`Permanently remove "${deleteContext?.name}". Action is irreversible.`}
        maxWidth="max-w-md"
        flash={flash}
      >
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner"><AlertCircle className="w-10 h-10" /></div>
        {!deleteOtpSent ? (
          <div className="flex gap-4">
            <button onClick={handleRequestWaDeleteOtp} disabled={waActionLoading} className="flex-1 py-5 bg-red-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 hover:bg-red-700 transition-all active:scale-95 transform">Request OTP</button>
            <button onClick={() => setShowDeleteModal(false)} className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">Abort</button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="space-y-3 text-center">
              <label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest">Enter Verification Packet</label>
              <input type="text" maxLength="6" className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-center font-black tracking-[1em] text-4xl focus:ring-8 focus:ring-red-100 outline-none shadow-inner" placeholder="000000" value={deleteOtp} onChange={(e) => setDeleteOtp(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <button onClick={handleConfirmWaDelete} disabled={waActionLoading || deleteOtp.length !== 6} className="flex-1 py-5 bg-red-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 active:scale-95 transform transition-all">Confirm Delete</button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteOtpSent(false); }} className="px-10 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* GATEWAY DEBUG AREA */}
      {gatewayResponse && (
        <div className="fixed bottom-6 right-6 w-96 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 z-50 animate-in slide-in-from-right-4">
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
  );
};

export default AdminDashboard;
