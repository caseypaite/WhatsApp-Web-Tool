import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { 
  User, Shield, Check, X, RefreshCw, Settings, Save, AlertCircle, 
  Globe, Lock, Cpu, Send, Plus, Trash2, History, ChevronDown, 
  ChevronUp, Terminal, MessageSquare, ShieldCheck, Users, 
  Layout, Smartphone, FileText, Menu, LogOut, Activity, BarChart2, Edit2, Link,
  ImageIcon, FileIcon, Music, Video, Search, CheckCircle, Home, Play
} from 'lucide-react';
import Modal from '../components/Admin/Modal';
import APIEndpointEntry from '../components/Admin/APIEndpointEntry';
import APIEndpointModal from '../components/Admin/APIEndpointModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { updateSiteName, siteName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [activeTab, setActiveTab] = useState('users');
  const [automationTab, setAutomationTab] = useState('responders');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);

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
  const [landingContent, setLandingContent] = useState({ hero_text: '', cta_text: '', image_url: '', html_content: '' });
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

  // System Update State
  const [updateFile, setUpdateFile] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateCountdown, setUpdateCountdown] = useState(null);

  // Audit & Poll Results State
  const [auditLogs, setAuditLogs] = useState([]);
  const [pollResults, setPollResults] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ phoneNumber: '', status: '' });
  const [showPollResultModal, setShowPollResultModal] = useState(false);
  const [selectedPollForResults, setSelectedPollForResults] = useState(null);
  const [pollPreviewData, setPollPreviewData] = useState(null);
  const [pollPreviewLoading, setPollPreviewLoading] = useState(false);

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
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }

    if (successful) {
      showFlash('Poll link copied to clipboard!');
    } else {
      showFlash('Manual copy required: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
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

  const fetchPollPreview = async (poll) => {
    setSelectedPollForResults(poll);
    setShowPollResultModal(true);
    setPollPreviewLoading(true);
    try {
      const data = await authService.getAdvancedPollResults(poll.id);
      setPollPreviewData(data);
    } catch (err) {
      showFlash('Failed to fetch poll results.', 'error');
    } finally {
      setPollPreviewLoading(false);
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

  const fetchTabContent = async (tab) => {
    switch (tab) {
      case 'users': await fetchUsers(); break;
      case 'groups': await fetchGroups(); break;
      case 'whatsapp': await fetchWaData(); break;
      case 'templates': await fetchTemplates(); break;
      case 'automation': 
        await fetchResponders();
        await fetchScheduledMessages();
        break;
      case 'history': await fetchAuditLogs(); break;
      case 'polls': await fetchPollResults(); break;
      case 'cms': await fetchLandingContent(); break;
      case 'settings': await fetchSettings(); break;
      default: break;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWaStatus(),
        fetchSettings()
      ]);
      // Lazy load current active tab
      await fetchTabContent(activeTab);
    } catch (err) {
      console.error('Initial data fetch error:', err);
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
    if (!loading) {
      fetchTabContent(activeTab);
    }
  }, [activeTab]);

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
      setShowWaEntityForm(false);
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
      setShowWaEntityForm(false);
      setNewEntity({ name: '', description: '', participants: '' });
      fetchWaChats();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Failed to create channel', 'error');
    } finally {
      setWaActionLoading(false);
    }
  };

  const initiateDelete = async (id, name, entityType) => {
    setDeleteContext({ id, name, entityType });
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

  const handleToggleGreetings = async (groupId) => {
    // Optimistic UI update
    const previousChats = [...waChats];
    setWaChats(prev => prev.map(chat => {
      if ((chat.id?._serialized || chat.id) === groupId) {
        const current = chat.greetingsEnabled;
        let next;
        if (current === null) {
          const globalEnabled = settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true';
          next = !globalEnabled;
        } else {
          next = !current;
        }
        return { ...chat, greetingsEnabled: next };
      }
      return chat;
    }));

    try {
      await authService.toggleGreetings(groupId);
      showFlash('Group greeting setting updated');
      await Promise.all([
        fetchWaChats(),
        fetchSettings()
      ]);
    } catch (err) {
      setWaChats(previousChats); // Rollback
      showFlash('Failed to toggle greetings', 'error');
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
      setShowScheduledForm(false);
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
      await api.put('/user/status', { userId, status });
      showFlash('User status updated');
      fetchUsers();
    } catch (err) {
      showFlash('Failed to update status', 'error');
    }
  };

  const generateUUID = () => {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleUpdateSetting = async (key, value) => {
    // 1. Update local state immediately
    setSettings(prev => {
      const exists = prev.find(s => s.key === key);
      if (exists) {
        return prev.map(s => s.key === key ? { ...s, value: String(value), is_fallback: false } : s);
      } else {
        return [...prev, { key, value: String(value), is_fallback: false }];
      }
    });

    setSaveLoading(true);
    try {
      await api.put('/settings/update', { key, value });
      showFlash('Setting updated');
      
      if (key === 'site_name') {
        updateSiteName(value);
      }
      
      // 2. Fetch fresh settings from server to ensure sync
      const response = await api.get('/settings/all');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      showFlash('Failed to save setting to server', 'error');
      // Refetch on error to restore correct state
      fetchSettings();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSystemUpdate = async () => {
    if (!updateFile) {
      showFlash('Please select a release package (.tar.gz) first.', 'error');
      return;
    }

    if (!window.confirm('WARNING: This will replace system source code and sync the database. The system will be temporarily offline during restart. Proceed?')) {
      return;
    }

    setUpdateLoading(true);
    setUpdateStatus('Transmitting package and applying patches...');
    
    try {
      const res = await authService.updateSystem(updateFile);
      setUpdateStatus(res.message);
      showFlash('System patched successfully!', 'success');
      setUpdateCountdown(30); // Start 30s countdown for restart
    } catch (err) {
      setUpdateStatus('');
      showFlash(err.response?.data?.details || err.response?.data?.error || 'System update failed.', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (updateCountdown !== null && updateCountdown > 0) {
      timer = setTimeout(() => setUpdateCountdown(updateCountdown - 1), 1000);
    } else if (updateCountdown === 0) {
      window.location.reload();
    }
    return () => clearTimeout(timer);
  }, [updateCountdown]);

  const handleTestEndpoint = async (apiTarget) => {
    setApiTestLoading(true);
    setApiTestResult(null);
    try {
      const config = {};
      if (apiTarget.k) {
        const fullApiKey = settings.find(s => s.key === 'api_key')?.value;
        const moApiKey = settings.find(s => s.key === 'messaging_api_key')?.value;
        const apiKey = (apiTarget.mo && moApiKey) ? moApiKey : fullApiKey;

        if (apiKey) config.headers = { 'x-api-key': apiKey };
      }
      let res;
      const path = apiTarget.p.startsWith('/') ? apiTarget.p : `/${apiTarget.p}`;
      
      if (apiTarget.m === 'GET') {
        res = await api.get(path, config);
      } else if (apiTarget.m === 'POST') {
        res = await api.post(path, JSON.parse(apiTarget.b || '{}'), config);
      } else if (apiTarget.m === 'PUT') {
        res = await api.put(path, JSON.parse(apiTarget.b || '{}'), config);
      }

      setApiTestResult({ status: res.status, data: res.data, success: true });
    } catch (err) {
      setApiTestResult({ 
        status: err.response?.status || 'ERROR', 
        data: err.response?.data || err.message,
        success: false 
      });
    } finally {
      setApiTestLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    setTestSuccess('');
    setGatewayResponse(null);
    try {
     const response = await api.post('/settings/test-otp', { phoneNumber: testPhone });
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
      <div className="flex items-center justify-center min-h-screen bg-[#f0f0f1]">
        <div className="w-8 h-8 border-4 border-[#dcdcde] border-t-[#2271b1] rounded-full animate-spin"></div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'users', label: 'Users', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
    { id: 'broadcast', label: 'Broadcast', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'automation', label: 'Automation', icon: RefreshCw },
    { id: 'history', label: 'Logs', icon: History },
    { id: 'polls', label: 'Polls', icon: BarChart2 },
    { id: 'cms', label: 'CMS', icon: Layout },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans">
      {/* SIDEBAR */}
      <aside className={`bg-[#1d2327] transition-all duration-200 z-40 fixed lg:static h-full shadow-lg ${isSidebarCollapsed ? 'w-12' : 'w-48'}`}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="py-4 px-3 mb-2 flex items-center gap-2 border-b border-[#2c3338]">
            <ShieldCheck className="w-5 h-5 text-[#72aee6]" />
            {!isSidebarCollapsed && <h1 className="text-sm font-bold text-white uppercase tracking-tight">{siteName}</h1>}
          </div>

          <nav className="flex-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full wp-sidebar-link ${activeTab === item.id ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={item.label}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-[#2c3338]">
              <button 
                onClick={() => navigate('/dashboard')}
                className={`w-full wp-sidebar-link ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="User Dashboard"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>User Dashboard</span>}
              </button>
              <button
                onClick={handleLogout}
                className={`w-full wp-sidebar-link hover:text-[#d63638] ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="Logout"
              >                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Logout</span>}
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

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* WP Topbar */}
        <header className="bg-white border-b border-[#dcdcde] px-4 py-2 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-[#1d2327]">
              {sidebarItems.find(t => t.id === activeTab)?.label}
            </h2>
            {activeTab === 'whatsapp' && (
              <div className="flex items-center gap-2 px-2 py-1 bg-[#f6f7f7] border border-[#dcdcde] rounded-sm ml-4">
                <div className={`w-2 h-2 rounded-full ${waStatus.status === 'CONNECTED' ? 'bg-[#00a32a]' : 'bg-[#d63638]'}`}></div>
                <span className="text-[11px] font-medium text-[#646970] uppercase tracking-tighter">{waStatus.status}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1d2327]">
              <span>Howdy, Admin</span>
              <div className="w-7 h-7 rounded-sm bg-[#dcdcde] flex items-center justify-center font-bold text-[#1d2327] text-xs">A</div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {flash && !showDirectMessage && !showWaEntityForm && !showTemplateForm && !showResponderForm && !showScheduledForm && !showDeleteModal && (
            <div className={`p-3 mb-6 border-l-4 shadow-sm animate-in fade-in duration-200 ${
              flash.type === 'error' ? 'bg-[#fcf0f1] border-[#d63638] text-[#d63638]' : 'bg-[#edfaef] border-[#00a32a] text-[#00a32a]'
            }`}>
              <div className="flex items-center gap-2">
                {flash.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <p className="text-sm font-medium">{flash.message}</p>
                <button onClick={() => setFlash(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div className="animate-in fade-in duration-500">
            {/* USERS */}
            {activeTab === 'users' && (
              <div className="wp-card">
                <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-between">
                  <h3 className="text-sm font-semibold">User Management</h3>
                  <span className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">{users.length} Nodes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="wp-list-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                        <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Identity</th>
                        <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">System Authorization</th>
                        <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Operational Status</th>
                        <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#2271b1] text-sm">{u.name || 'User'}</div>
                            <div className="text-xs text-[#646970]">{u.email}</div>
                            <div className="text-[9px] font-mono text-[#a7aaad] mt-1">+{u.phone_number}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles?.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#f6f7f7] text-[#1d2327] border border-[#dcdcde] text-[10px] font-semibold uppercase tracking-tighter">{r}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter border rounded-sm ${
                              u.status === 'ACTIVE' ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' :
                              u.status === 'PENDING_APPROVAL' ? 'bg-[#fcf9e8] text-[#dba617] border-[#dba617]' : 'bg-[#f6f7f7] text-[#646970] border-[#dcdcde]'
                            }`}>
                              {u.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <select 
                              className="wp-input text-[10px] font-bold py-1 appearance-none cursor-pointer pr-8"
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
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="wp-card">
                    <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Groups</h3>
                      <button onClick={() => setShowGroupForm(!showGroupForm)} className="wp-button-secondary p-1">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {showGroupForm && (
                      <form onSubmit={handleCreateGroup} className="p-4 bg-[#f6f7f7] border-b border-[#dcdcde] space-y-3 animate-in slide-in-from-top-2">
                        <input type="text" required className="w-full wp-input" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                        <textarea className="w-full wp-input resize-none" placeholder="Description" rows="2" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                        <button type="submit" className="w-full wp-button-primary">Create Group</button>
                      </form>
                    )}
                    <div className="p-2 space-y-1">
                      {groups.map(g => (
                        <button key={g.id} onClick={() => setSelectedGroup(g)} className={`w-full px-3 py-2 text-left transition-colors text-sm font-medium rounded-sm ${selectedGroup?.id === g.id ? 'bg-[#2271b1] text-white' : 'hover:bg-[#f6f7f7] text-[#2271b1]'}`}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  {selectedGroup ? (
                    <div className="wp-card">
                      <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold">{selectedGroup.name}</h3>
                          <p className="text-[10px] text-[#646970] font-medium italic">{selectedGroup.description || 'Group'}</p>
                        </div>
                        <button onClick={() => initiateDelete(selectedGroup.id, selectedGroup.name, 'group')} className="p-1 text-[#d63638] hover:bg-[#fcf0f1] transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="p-4">
                        <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                          <input type="text" className="flex-1 wp-input" placeholder="User Identifier (ID)..." value={addMemberUserId} onChange={(e) => setAddMemberUserId(e.target.value)} />
                          <button type="submit" className="wp-button-primary">Add Member</button>
                        </form>
                        
                        <div className="wp-list-table border border-[#dcdcde]">
                           <div className="grid grid-cols-2 gap-px bg-[#dcdcde]">
                            {groupMembers.map(m => (
                              <div key={m.id} className="bg-white p-3 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#f6f7f7] text-[#1d2327] border border-[#dcdcde] flex items-center justify-center text-xs font-bold">
                                    {m.name?.[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#1d2327] truncate">{m.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] font-bold uppercase px-1 py-0.5 border ${m.role === 'ADMIN' ? 'bg-[#fcf9e8] text-[#dba617] border-[#dba617]' : 'bg-[#f6f7f7] text-[#646970] border-[#dcdcde]'}`}>{m.role}</span>
                                      <span className="text-[9px] font-mono text-[#a7aaad]">+{m.phone_number}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setSelectedMemberForMessage(m); setShowMemberMessageModal(true); }} className="p-1 text-[#2271b1] hover:underline"><MessageSquare className="w-3.5 h-3.5" /></button>
                                  {m.role === 'ADMIN' ? (
                                    <button onClick={() => handleUpdateMemberRole(m.id, 'MEMBER')} className="p-1 text-[#dba617] hover:underline"><ChevronDown className="w-3.5 h-3.5" /></button>
                                  ) : (
                                    <button onClick={() => handleUpdateMemberRole(m.id, 'ADMIN')} className="p-1 text-[#2271b1] hover:underline"><ChevronUp className="w-3.5 h-3.5" /></button>
                                  )}
                                  <button onClick={() => handleRemoveMember(m.id)} className="p-1 text-[#d63638] hover:underline"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] flex items-center justify-center bg-white border border-[#dcdcde] shadow-sm italic text-[#a7aaad] text-sm">
                      Select an group to manage membership registry.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHATSAPP STATUS */}
            {activeTab === 'whatsapp' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="wp-card">
                    <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7]">
                      <h3 className="text-sm font-semibold">Engine Status Protocol</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#f6f7f7] border border-[#dcdcde]">
                        <span className="text-xs font-semibold text-[#646970]">Network Link</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${waStatus.status === 'CONNECTED' ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' : 'bg-[#fcf0f1] text-[#d63638] border-[#d63638]'}`}>{waStatus.status}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#f6f7f7] border border-[#dcdcde]">
                        <span className="text-xs font-semibold text-[#646970]">Runtime Status</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${waStatus.ready ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' : 'bg-[#fcf9e8] text-[#dba617] border-[#dba617]'}`}>{waStatus.ready ? 'READY' : 'INITIALIZING'}</span>
                      </div>
                      
                      {waStatus.me && (
                        <div className="p-3 bg-[#1d2327] border border-[#2c3338] flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#2271b1] text-white flex items-center justify-center font-bold text-lg">{waStatus.me.pushname?.[0]}</div>
                          <div>
                            <p className="text-sm font-bold text-[#f0f0f1]">{waStatus.me.pushname}</p>
                            <p className="text-[10px] font-mono text-[#a7aaad]">+{waStatus.me.wid.user}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={handleWaReinit} className="wp-button-primary">Re-initialize</button>
                        <button onClick={handleWaLogout} className="wp-button-secondary border-[#d63638] text-[#d63638]">Terminate Link</button>
                      </div>
                    </div>
                  </div>

                  <div className="wp-card min-h-[300px] flex flex-col items-center justify-center">
                    {waStatus.status === 'CONNECTED' ? (
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-[#edfaef] text-[#00a32a] border-2 border-[#00a32a] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-[#1d2327] mb-2 uppercase">Protocol Active</h4>
                        <p className="text-xs text-[#646970] italic">The communication engine is currently synchronized with an external device.</p>
                      </div>
                    ) : (
                      <div className="w-full p-8">
                        <div className="flex items-center justify-center gap-2 mb-8">
                          <button onClick={() => setShowPairingForm(false)} className={`flex-1 py-2 text-[10px] font-bold uppercase border-b-2 transition-all ${!showPairingForm ? 'border-[#2271b1] text-[#2271b1]' : 'border-transparent text-[#a7aaad]'}`}>QR Matrix</button>
                          <button onClick={() => setShowPairingForm(true)} className={`flex-1 py-2 text-[10px] font-bold uppercase border-b-2 transition-all ${showPairingForm ? 'border-[#2271b1] text-[#2271b1]' : 'border-transparent text-[#a7aaad]'}`}>Pairing Code</button>
                        </div>

                        {showPairingForm ? (
                          <div className="space-y-6">
                            {!(pairingCode || waStatus.pairingCode) ? (
                              <form onSubmit={handleRequestPairingCode} className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Phone Number</label>
                                  <input type="text" required className="w-full wp-input text-lg font-bold" placeholder="91XXXXXXXXXX" value={pairingPhone} onChange={(e) => setPairingPhone(e.target.value)} />
                                </div>
                                <button type="submit" disabled={waActionLoading} className="w-full wp-button-primary py-3">Generate Code</button>
                              </form>
                            ) : (
                              <div className="text-center py-4">
                                <div className="flex justify-center gap-2 mb-8">
                                  {(pairingCode || waStatus.pairingCode).split('').map((char, i) => (
                                    <div key={i} className="w-8 h-12 bg-[#1d2327] text-white flex items-center justify-center text-xl font-black shadow-md">{char}</div>
                                  ))}
                                </div>
                                <p className="text-xs text-[#646970] italic mb-4">Enter this code in WhatsApp {'>'} Linked Devices {'>'} Link with phone number.</p>
                                <button onClick={() => { setPairingCode(''); waStatus.pairingCode = null; }} className="text-[10px] text-[#2271b1] font-bold hover:underline">Reset Request</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            {waStatus.qr ? (
                              <div className="p-4 bg-white border border-[#dcdcde] shadow-inner mb-6">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waStatus.qr)}`} className="w-[180px] h-[180px]" alt="Scan" />
                              </div>
                            ) : (
                              <div className="py-12 flex flex-col items-center opacity-30">
                                <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase">Awaiting Vector...</p>
                              </div>
                            )}
                            <p className="text-[10px] text-[#646970] italic text-center">Scan the dynamic matrix with your mobile device scanner.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="wp-card min-h-[500px] flex flex-col">
                  <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{showWaEntityForm ? `Create ${waEntityType}` : 'Managed Phones'}</h3>
                    <div className="flex gap-1">
                       <button onClick={() => { setWaEntityType('group'); setShowWaEntityForm(!showWaEntityForm); }} className={`p-1 border rounded-sm transition-all ${showWaEntityForm && waEntityType === 'group' ? 'bg-[#2271b1] text-white border-[#2271b1]' : 'bg-white text-[#2271b1] border-[#2271b1]'}`} title="New Group"><Users className="w-4 h-4" /></button>
                       <button onClick={() => { setWaEntityType('channel'); setShowWaEntityForm(!showWaEntityForm); }} className={`p-1 border rounded-sm transition-all ${showWaEntityForm && waEntityType === 'channel' ? 'bg-[#1d2327] text-white border-[#1d2327]' : 'bg-white text-[#1d2327] border-[#1d2327]'}`} title="New Channel"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {showWaEntityForm ? (
                    <div className="p-6">
                      <form onSubmit={waEntityType === 'group' ? handleCreateWaGroup : handleCreateWaChannel} className="space-y-6 max-w-sm mx-auto">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Display Name</label>
                            <input type="text" required className="w-full wp-input" placeholder="Poll Title..." value={newEntity.name} onChange={(e) => setNewEntity({...newEntity, name: e.target.value})} />
                         </div>
                         {waEntityType === 'group' ? (
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Participants (Comma-Separated)</label>
                              <textarea rows="3" className="w-full wp-input font-mono text-[10px] resize-none" placeholder="91XXXXXXXXXX, ..." value={newEntity.participants} onChange={(e) => setNewEntity({...newEntity, participants: e.target.value})} />
                           </div>
                         ) : (
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Context Metadata</label>
                              <textarea rows="3" className="w-full wp-input resize-none" placeholder="Group description..." value={newEntity.description} onChange={(e) => setNewEntity({...newEntity, description: e.target.value})} />
                           </div>
                         )}
                         <div className="flex gap-2 pt-2">
                            <button type="submit" disabled={waActionLoading} className="flex-1 wp-button-primary">{waActionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Node'}</button>
                            <button type="button" onClick={() => setShowWaEntityForm(false)} className="px-6 wp-button-secondary">Abort</button>
                         </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                       <div className="p-2 space-y-4">
                          {/* GROUPS */}
                          {waChats.filter(c => c?.isAdmin && c?.isGroup).length > 0 && (
                            <div className="space-y-2">
                               <h4 className="px-2 text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest border-l-2 border-[#2271b1]">Managed Groups</h4>
                               <div className="space-y-1">
                                  {waChats.filter(c => c?.isAdmin && c?.isGroup).map(chat => (
                                    <div key={chat?.id?._serialized} className="p-3 bg-white border border-[#dcdcde] flex items-center justify-between group hover:bg-[#f6f7f7] transition-all">
                                       <div className="flex items-center gap-3">
                                          {chat?.iconUrl ? <img src={chat.iconUrl} className="w-10 h-10 object-cover rounded-sm" alt="" /> : <div className="w-10 h-10 bg-[#f6f7f7] text-[#a7aaad] border border-[#dcdcde] flex items-center justify-center font-bold">{chat?.name?.[0]}</div>}
                                          <div className="min-w-0">
                                             <p className="text-sm font-bold text-[#1d2327] truncate leading-none mb-1">{chat?.name}</p>
                                             <div className="flex items-center gap-2">
                                                <p className="text-[9px] font-mono text-[#a7aaad] truncate">{chat?.id?._serialized}</p>
                                                <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${chat.greetingsEnabled === true ? 'text-[#00a32a]' : chat.greetingsEnabled === false ? 'text-[#d63638]' : 'text-[#a7aaad]'}`}>
                                                   <div className={`w-1 h-1 rounded-full ${chat.greetingsEnabled === true ? 'bg-[#00a32a]' : chat.greetingsEnabled === false ? 'bg-[#d63638]' : 'bg-[#a7aaad]'}`} />
                                                   Greetings: {chat.greetingsEnabled === true ? 'ON' : chat.greetingsEnabled === false ? 'OFF' : `DEF (${settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true' ? 'ON' : 'OFF'})`}
                                                </span>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleToggleGreetings(chat.id?._serialized)} className={`p-1.5 transition-colors ${chat.greetingsEnabled === true ? 'text-[#00a32a]' : chat.greetingsEnabled === false ? 'text-[#d63638]' : 'text-[#a7aaad]'}`} title={`Switch to ${chat.greetingsEnabled === null ? (settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true' ? 'Explicit OFF' : 'Explicit ON') : (chat.greetingsEnabled === true ? 'OFF' : 'ON')}`}>
                                             <CheckCircle className={`w-4 h-4 ${chat.greetingsEnabled === true ? 'fill-[#edfaef]' : ''}`} />
                                          </button>
                                          <button onClick={() => openGroupManage(chat.id?._serialized, chat.name)} className="p-1.5 text-[#2271b1] hover:underline" title="Administer"><Shield className="w-4 h-4" /></button>
                                          <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'group' }); setShowPollModal(true); }} className="p-1.5 text-[#dba617] hover:underline" title="Poll"><BarChart2 className="w-4 h-4" /></button>
                                          <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'group' }); setShowDirectMessage(true); }} className="p-1.5 text-[#2271b1] hover:underline" title="Message"><MessageSquare className="w-4 h-4" /></button>
                                          <button onClick={() => initiateDelete(chat.id?._serialized, chat.name, 'group')} className="p-1.5 text-[#d63638] hover:underline" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}

                          {/* CHANNELS */}
                          {waChats.filter(c => c?.isAdmin && c?.isNewsletter).length > 0 && (
                            <div className="space-y-2">
                               <h4 className="px-2 text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest border-l-2 border-[#1d2327]">Managed Channels</h4>
                               <div className="space-y-1">
                                  {waChats.filter(c => c?.isAdmin && c?.isNewsletter).map(chat => (
                                    <div key={chat?.id?._serialized} className="p-3 bg-white border border-[#dcdcde] flex items-center justify-between group hover:bg-[#f6f7f7] transition-all">
                                       <div className="flex items-center gap-3">
                                          {chat?.iconUrl ? <img src={chat.iconUrl} className="w-10 h-10 object-cover rounded-sm" alt="" /> : <div className="w-10 h-10 bg-[#f6f7f7] text-[#a7aaad] border border-[#dcdcde] flex items-center justify-center font-bold">{chat?.name?.[0]}</div>}
                                          <div className="min-w-0">
                                             <p className="text-sm font-bold text-[#1d2327] truncate leading-none mb-1">{chat?.name}</p>
                                             <p className="text-[9px] font-mono text-[#a7aaad] truncate">{chat?.id?._serialized}</p>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'channel' }); setShowPollModal(true); }} className="p-1.5 text-[#dba617] hover:underline" title="Poll"><BarChart2 className="w-4 h-4" /></button>
                                          <button onClick={() => { setDirectMessageTarget({ id: chat.id?._serialized, name: chat.name, type: 'channel' }); setShowDirectMessage(true); }} className="p-1.5 text-[#2271b1] hover:underline" title="Message"><MessageSquare className="w-4 h-4" /></button>
                                          <button onClick={() => initiateDelete(chat.id?._serialized, chat.name, 'channel')} className="p-1.5 text-[#d63638] hover:underline" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BROADCAST */}
            {activeTab === 'broadcast' && (
              <div className="wp-card max-w-5xl">
                <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7]">
                  <h3 className="text-sm font-semibold">Bulk Broadcast</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-px bg-[#dcdcde]">
                   <div className="bg-white p-6 space-y-6">
                      <div className="space-y-2">
                         <h4 className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Target Selection</h4>
                         <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {waChats.filter(c => c?.isAdmin && (c?.isGroup || c?.isNewsletter)).map(chat => (
                              <button key={chat?.id?._serialized} onClick={() => !selectedTargets.find(t => t.id === chat?.id?._serialized) && setSelectedTargets([...selectedTargets, { id: chat?.id?._serialized, name: chat?.name, type: chat?.isGroup ? 'group' : 'channel' }])} className="w-full p-2 bg-[#f6f7f7] border border-[#dcdcde] flex items-center justify-between hover:border-[#2271b1] transition-all group">
                                <span className="text-xs font-bold text-[#1d2327] truncate">{chat?.name}</span>
                                <Plus className="w-3 h-3 text-[#2271b1]" />
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-2">
                         <h4 className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Queued Targets ({selectedTargets.length})</h4>
                         <div className="flex flex-wrap gap-1">
                            {selectedTargets.map(t => (
                              <span key={t.id} className="px-2 py-1 bg-[#1d2327] text-white text-[9px] font-bold flex items-center gap-2">
                                {t.name}
                                <button onClick={() => setSelectedTargets(selectedTargets.filter(st => st.id !== t.id))}><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                         </div>
                      </div>
                   </div>
                   
                   <div className="bg-[#f6f7f7] p-6 space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Message Template</label>
                        <select className="w-full wp-input appearance-none" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                          <option value="">-- Manual Synthesis --</option>
                          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Payload Content</label>
                        <textarea rows="6" className="w-full wp-input resize-none" placeholder="Enter message text..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                      </div>
                      <button onClick={handleSendBroadcast} disabled={isBroadcasting || selectedTargets.length === 0} className="w-full wp-button-primary py-4">
                        {isBroadcasting ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Launch Broadcast'}
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                   <h3 className="text-xl font-medium text-[#1d2327]">Message Templates</h3>
                   <button onClick={() => { setShowTemplateForm(!showTemplateForm); setEditingTemplate(null); }} className="wp-button-primary">
                     {showTemplateForm ? 'Abort' : 'Create Template'}
                   </button>
                </div>

                {(showTemplateForm || editingTemplate) && (
                  <div className="wp-card max-w-2xl mx-auto p-6 animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-semibold mb-6 border-b border-[#dcdcde] pb-2">{editingTemplate ? 'Modify Protocol' : 'Initialize Protocol'}</h4>
                    <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Identifier</label>
                            <input type="text" required className="w-full wp-input" value={editingTemplate ? editingTemplate.name : newTemplate.name} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, name: e.target.value}) : setNewTemplate({ ...newTemplate, name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Payload Type</label>
                            <select className="w-full wp-input appearance-none" value={editingTemplate ? editingTemplate.media_type : newTemplate.media_type} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, media_type: e.target.value}) : setNewTemplate({ ...newTemplate, media_type: e.target.value })}>
                                <option value="image">Static Image</option>
                                <option value="video">Video Stream</option>
                                <option value="document">Document</option>
                                <option value="audio">Audio Waveform</option>
                            </select>
                          </div>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Message Content</label>
                         <textarea rows="4" className="w-full wp-input resize-none" value={editingTemplate ? editingTemplate.content : newTemplate.content} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, content: e.target.value}) : setNewTemplate({ ...newTemplate, content: e.target.value })} />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Media Resource URL</label>
                         <input type="url" className="w-full wp-input font-mono text-[10px]" value={editingTemplate ? editingTemplate.media_url || '' : newTemplate.media_url} onChange={(e) => editingTemplate ? setEditingTemplate({...editingTemplate, media_url: e.target.value}) : setNewTemplate({ ...newTemplate, media_url: e.target.value })} />
                       </div>
                       <div className="flex gap-2 pt-2">
                         <button type="submit" className="flex-1 wp-button-primary">Synthesize Protocol</button>
                         <button type="button" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} className="px-6 wp-button-secondary">Cancel</button>
                       </div>
                    </form>
                  </div>
                )}

                <div className="wp-card">
                  <div className="overflow-x-auto">
                    <table className="wp-list-table w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                          <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Protocol Node</th>
                          <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Content Synthesis</th>
                          <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map(t => (
                          <tr key={t.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors group">
                            <td className="px-4 py-4">
                               <div className="text-sm font-bold text-[#2271b1]">{t.name}</div>
                               <div className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-tighter mt-1">{t.media_type || 'TEXT'}</div>
                            </td>
                            <td className="px-4 py-4">
                               <p className="text-xs text-[#3c434a] line-clamp-2 max-w-lg leading-relaxed italic">"{t.content}"</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                               <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingTemplate(t); setShowTemplateForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-[#2271b1] hover:underline" title="Modify"><Save className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteTemplate(t.id, t.name)} className="p-1.5 text-[#d63638] hover:underline" title="Destroy"><Trash2 className="w-4 h-4" /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AUTOMATION ENGINE */}
            {activeTab === 'automation' && (
              <div className="space-y-6">
                <div className="wp-card">
                   <div className="flex border-b border-[#dcdcde] bg-[#f6f7f7]">
                      <button onClick={() => setAutomationTab('responders')} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${automationTab === 'responders' ? 'border-[#2271b1] text-[#2271b1] bg-white' : 'border-transparent text-[#a7aaad] hover:text-[#1d2327]'}`}>Auto-Responders</button>
                      <button onClick={() => setAutomationTab('scheduled')} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${automationTab === 'scheduled' ? 'border-[#2271b1] text-[#2271b1] bg-white' : 'border-transparent text-[#a7aaad] hover:text-[#1d2327]'}`}>Scheduled Tasks</button>
                   </div>
                   <div className="p-4 flex justify-end">
                      {automationTab === 'responders' ? (
                        <button onClick={() => { setShowResponderForm(!showResponderForm); setEditingResponder(null); }} className="wp-button-primary">Initialize Responder</button>
                      ) : (
                        <button onClick={() => { setShowScheduledForm(!showScheduledForm); setEditingScheduled(null); }} className="wp-button-primary">Queue Task</button>
                      )}
                   </div>
                </div>

                {automationTab === 'responders' && (
                   <div className="space-y-6">
                      {(showResponderForm || editingResponder) && (
                        <div className="wp-card max-w-2xl mx-auto p-6 animate-in slide-in-from-top-4">
                           <h4 className="text-sm font-semibold mb-6 border-b border-[#dcdcde] pb-2">Responder Parameters</h4>
                           <form onSubmit={editingResponder ? handleUpdateResponder : handleCreateResponder} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Trigger Node (Keyword)</label>
                                  <input type="text" required className="w-full wp-input" value={editingResponder ? editingResponder.keyword : newResponder.keyword} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, keyword: e.target.value}) : setNewResponder({ ...newResponder, keyword: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Match Algorithm</label>
                                  <select className="w-full wp-input appearance-none" value={editingResponder ? editingResponder.match_type : newResponder.match_type} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, match_type: e.target.value}) : setNewResponder({ ...newResponder, match_type: e.target.value })}>
                                      <option value="EXACT">Exact (Case Sensitive)</option>
                                      <option value="CONTAINS">Substring Inclusion</option>
                                      <option value="STARTS_WITH">Prefix Alignment</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Response Synthesis</label>
                                <textarea rows="4" className="w-full wp-input resize-none" value={editingResponder ? editingResponder.response : newResponder.response} onChange={(e) => editingResponder ? setEditingResponder({...editingResponder, response: e.target.value}) : setNewResponder({ ...newResponder, response: e.target.value })} />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 wp-button-primary">Deploy Responder</button>
                                <button type="button" onClick={() => { setShowResponderForm(false); setEditingResponder(null); }} className="px-6 wp-button-secondary">Cancel</button>
                              </div>
                           </form>
                        </div>
                      )}
                      <div className="wp-card">
                         <table className="wp-list-table w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                                <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Trigger Node</th>
                                <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Autonomous Reply</th>
                                <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Status</th>
                                <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                               {responders.map(r => (
                                 <tr key={r.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors group">
                                    <td className="px-4 py-4">
                                       <div className="text-sm font-bold text-[#2271b1]">{r.keyword}</div>
                                       <div className="text-[9px] font-bold text-[#a7aaad] uppercase mt-1">Mode: {r.match_type}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                       <p className="text-xs text-[#3c434a] line-clamp-2 max-w-md leading-relaxed italic">"{r.response}"</p>
                                    </td>
                                    <td className="px-4 py-4">
                                       <span className={`px-2 py-0.5 text-[9px] font-bold border ${r.is_active ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' : 'bg-[#f6f7f7] text-[#a7aaad] border-[#dcdcde]'}`}>{r.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleToggleResponder(r.id)} className="p-1.5 text-[#2271b1] hover:underline" title="Toggle"><RefreshCw className="w-4 h-4" /></button>
                                          <button onClick={() => { setEditingResponder(r); setShowResponderForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-[#2271b1] hover:underline" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                          <button onClick={() => handleDeleteResponder(r.id, r.keyword)} className="p-1.5 text-[#d63638] hover:underline" title="Destroy"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}

                {automationTab === 'scheduled' && (
                  <div className="space-y-6">
                    {showScheduledForm && (
                      <div className="wp-card max-w-2xl mx-auto p-6 animate-in slide-in-from-top-4">
                         <h4 className="text-sm font-semibold mb-6 border-b border-[#dcdcde] pb-2">Task Parameters</h4>
                         <form onSubmit={handleCreateScheduled} className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Target Groups</label>
                               <div className="p-2 border border-[#dcdcde] bg-[#f6f7f7] flex flex-wrap gap-1 min-h-[40px]">
                                  {newScheduled.targets.map(t => (
                                    <span key={t.id} className="px-2 py-1 bg-[#1d2327] text-white text-[9px] font-bold flex items-center gap-2">
                                      {t.name}
                                      <button type="button" onClick={() => setNewScheduled({ ...newScheduled, targets: newScheduled.targets.filter(st => st.id !== t.id) })}><X className="w-3 h-3" /></button>
                                    </span>
                                  ))}
                                  <select className="bg-transparent border-none outline-none text-[10px] font-bold text-[#2271b1] cursor-pointer" onChange={(e) => {
                                    if (!e.target.value) return;
                                    const chat = waChats.find(c => c.id?._serialized === e.target.value);
                                    if (chat && !newScheduled.targets.find(t => t.id === chat.id?._serialized)) {
                                      setNewScheduled({ ...newScheduled, targets: [...newScheduled.targets, { id: chat.id?._serialized, name: chat.name, type: chat.isGroup ? 'group' : 'channel' }] });
                                    }                                    e.target.value = '';
                                  }}>
                                    <option value="">+ Add Group</option>
                                    {waChats.filter(c => c.isAdmin && (c.isGroup || c.isNewsletter)).map(chat => <option key={chat.id?._serialized} value={chat.id?._serialized}>{chat.name}</option>)}
                                  </select>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Execution Pipeline (Date/Time)</label>
                                <input type="datetime-local" required className="w-full wp-input" value={newScheduled.scheduled_for} onChange={(e) => setNewScheduled({ ...newScheduled, scheduled_for: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Media Protocol</label>
                                <select className="w-full wp-input appearance-none" value={newScheduled.media_type} onChange={(e) => setNewScheduled({ ...newScheduled, media_type: e.target.value })}>
                                    <option value="image">Static Image</option>
                                    <option value="video">Video Stream</option>
                                    <option value="document">Document</option>
                                    <option value="audio">Audio Waveform</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Transmission Payload</label>
                               <textarea rows="3" className="w-full wp-input resize-none" value={newScheduled.message} onChange={(e) => setNewScheduled({ ...newScheduled, message: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Remote Media Resource</label>
                               <input type="url" className="w-full wp-input font-mono text-[10px]" value={newScheduled.media_url} onChange={(e) => setNewScheduled({ ...newScheduled, media_url: e.target.value })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                               <button type="submit" className="flex-1 wp-button-primary">Queue Task</button>
                               <button type="button" onClick={() => setShowScheduledForm(false)} className="px-6 wp-button-secondary">Cancel</button>
                            </div>
                         </form>
                      </div>
                    )}
                    <div className="wp-card">
                       <table className="wp-list-table w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Pipeline Entry</th>
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Target Nodes</th>
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Transmission Protocol</th>
                              <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                             {scheduledMessages.map(m => (
                               <tr key={m.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors group">
                                  <td className="px-4 py-4">
                                     <div className="text-sm font-bold text-[#1d2327]">{new Date(m.scheduled_for).toLocaleString()}</div>
                                     <div className={`text-[10px] font-bold mt-1 uppercase ${m.status === 'SENT' ? 'text-[#00a32a]' : m.status === 'PENDING' ? 'text-[#dba617]' : 'text-[#d63638]'}`}>{m.status}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                     <div className="flex -space-x-1">
                                        {m.targets.map((t, i) => (
                                          <div key={i} className="w-6 h-6 bg-[#1d2327] text-white border border-white text-[8px] font-bold flex items-center justify-center uppercase" title={t.name}>{t.name?.[0] || 'T'}</div>
                                        ))}
                                     </div>
                                  </td>
                                  <td className="px-4 py-4">
                                     <p className="text-xs text-[#646970] truncate max-w-xs leading-relaxed italic">"{m.message}"</p>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {m.status === 'PENDING' && <button onClick={() => handleCancelScheduled(m.id)} className="p-1.5 text-[#dba617] hover:underline" title="Abort"><X className="w-4 h-4" /></button>}
                                        <button onClick={() => deleteScheduledMessage(m.id)} className="p-1.5 text-[#d63638] hover:underline" title="Destroy"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INTERACTION LOG */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center px-4">
                    <h3 className="text-xl font-medium text-[#1d2327]">Message Logs</h3>
                    <button onClick={handleClearAuditHistory} className="wp-button-secondary border-[#d63638] text-[#d63638]">Clear Registry</button>
                 </div>
                 <div className="wp-card">
                    <div className="overflow-x-auto">
                      <table className="wp-list-table w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f6f7f7] border-b border-[#dcdcde]">
                            <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Timestamp</th>
                            <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Terminal / Node</th>
                            <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase">Transmission Payload</th>
                            <th className="px-4 py-2 text-xs font-bold text-[#1d2327] uppercase text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                           {auditLogs.map(log => (
                             <tr key={log.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors">
                                <td className="px-4 py-4 text-xs font-bold text-[#646970]">{new Date(log.sent_at).toLocaleString()}</td>
                                <td className="px-4 py-4">
                                   <div className="text-xs font-bold text-[#2271b1]">+{log.phone_number}</div>
                                   {log.user_name && <div className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-tighter">{log.user_name}</div>}
                                </td>
                                <td className="px-4 py-4">
                                   <p className="text-xs text-[#3c434a] max-w-xl truncate italic leading-relaxed">"{log.message}"</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                   <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter border ${log.status === 'SUCCESS' ? 'bg-[#edfaef] text-[#00a32a] border-[#00a32a]' : 'bg-[#fcf0f1] text-[#d63638] border-[#d63638]'}`}>{log.status}</span>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {/* DECISION DATA */}
            {activeTab === 'polls' && (
              <div className="space-y-6">
                 <h3 className="text-xl font-medium text-[#1d2327] px-4">Poll Results</h3>
                 {pollResults.length > 0 ? (
                   <div className="grid md:grid-cols-2 gap-6">
                      {pollResults.map(poll => (
                        <div key={poll.id} className="wp-card group flex flex-col">
                           <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex justify-between items-center">
                              <h4 className="text-sm font-semibold truncate max-w-[200px]">{poll.question || poll.title}</h4>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => copyPollLink(poll.id)} title="Copy Link" className="p-1 text-[#2271b1] hover:underline"><Link className="w-3.5 h-3.5" /></button>
                                 {poll.type && <button onClick={() => navigate(`/poll/edit/${poll.id}`)} title="Edit Poll" className="p-1 text-[#2271b1] hover:underline"><Edit2 className="w-3.5 h-3.5" /></button>}
                                 <button onClick={() => handleDeletePoll(poll.id, poll.question || poll.title)} title="Delete Poll" className="p-1 text-[#d63638] hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                           </div>
                           <div className="p-5 flex-1 flex flex-col space-y-4">
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <p className="text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">Type: {poll.type || 'WhatsApp Sync'}</p>
                                    <p className="text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">Access: {poll.access_type || 'N/A'}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">Status: <span className={poll.status === 'OPEN' ? 'text-[#00a32a]' : 'text-[#d63638]'}>{poll.status}</span></p>
                                    <p className="text-[10px] text-[#a7aaad] font-bold uppercase tracking-widest">ID: {poll.id}</p>
                                 </div>
                              </div>

                              {poll.description && (
                                 <p className="text-xs text-[#646970] italic line-clamp-2 leading-relaxed border-l-2 border-[#dcdcde] pl-3 py-1">
                                    {poll.description}
                                 </p>
                              )}

                              <div className="bg-[#f6f7f7] p-3 border border-[#dcdcde] flex justify-between items-center">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-[#3c434a]">Vote Summary</span>
                                 <span className="text-xs font-black text-[#2271b1]">{poll.total_votes || 0} Total Casts</span>
                              </div>

                              <div className="pt-2 mt-auto space-y-2">
                                 <button 
                                    onClick={() => fetchPollPreview(poll)} 
                                    className="w-full wp-button-secondary py-3 flex items-center justify-center gap-2"
                                 >
                                    <BarChart2 className="w-4 h-4" />
                                    <span>Preview Live Results</span>
                                 </button>
                                 {poll.type && (
                                    <button 
                                       onClick={() => navigate(`/poll/${poll.id}`)} 
                                       className="w-full wp-button-primary py-3 flex items-center justify-center gap-2"
                                    >
                                       <Activity className="w-4 h-4" />
                                       <span>Public Result Page</span>
                                    </button>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="wp-card p-20 flex flex-col items-center opacity-40">
                      <BarChart2 className="w-12 h-12 mb-4" />
                      <p className="text-sm font-semibold uppercase">No polls registered.</p>
                   </div>
                 )}
              </div>
            )}

            {/* LANDING CMS */}
            {activeTab === 'cms' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="wp-card flex-1 w-full lg:max-w-2xl">
                   <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-widest">Advanced Landing Vector (CMS)</h3>
                      <div className="flex items-center gap-2">
                         <Globe className="w-4 h-4 text-[#2271b1]" />
                         <span className="text-[10px] font-black text-[#2271b1] uppercase tracking-tighter">Live Protocol</span>
                      </div>
                   </div>
                   <div className="p-8">
                      <form onSubmit={handleUpdateLandingPage} className="space-y-8">
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Hero Headline</label>
                               <textarea rows="2" required className="w-full wp-input text-lg font-bold resize-none" value={landingContent.hero_text} onChange={(e) => setLandingContent({ ...landingContent, hero_text: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">CTA Button Label</label>
                               <input type="text" required className="w-full wp-input font-bold" value={landingContent.cta_text} onChange={(e) => setLandingContent({ ...landingContent, cta_text: e.target.value })} />
                            </div>
                         </div>

                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Background Vector URL</label>
                            <div className="flex gap-2">
                               <input type="url" required className="flex-1 wp-input font-mono text-[10px]" value={landingContent.image_url} onChange={(e) => setLandingContent({ ...landingContent, image_url: e.target.value })} />
                               <div className="relative">
                                  <input type="file" id="landing-bg-file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setLandingContent({ ...landingContent, image_url: url }))} />
                                  <label htmlFor="landing-bg-file" className="wp-button-secondary py-1 cursor-pointer">
                                     {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'UPLOAD'}
                                  </label>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-2">
                            <div className="flex items-center justify-between">
                               <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Advanced HTML Matrix</label>
                               <span className="text-[9px] font-bold text-[#dba617] uppercase tracking-widest bg-[#fcf9e8] px-2 py-0.5 border border-[#dba617]/20 rounded-sm">Variable Support Active</span>
                            </div>
                            <textarea 
                               rows="12" 
                               className="w-full wp-input font-mono text-xs leading-relaxed" 
                               placeholder="Enter custom HTML structure here... Use {{site_name}} for dynamic data injection."
                               value={landingContent.html_content || ''} 
                               onChange={(e) => setLandingContent({ ...landingContent, html_content: e.target.value })} 
                            />
                            <p className="text-[10px] text-[#646970] italic leading-relaxed">
                               This matrix allows for full structural customization of the secondary landing section. All standard HTML5 tags and TailwindCSS utility classes are supported.
                            </p>
                         </div>

                         <button type="submit" disabled={landingLoading} className="w-full wp-button-primary py-4 text-sm font-black uppercase tracking-[0.2em] shadow-lg">
                            {landingLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Commit CMS Synthesis'}
                         </button>
                      </form>
                   </div>
                </div>

                <div className="wp-card flex-1 w-full lg:max-w-xs h-[750px] flex flex-col">
                   <div className="p-4 border-b border-[#dcdcde] bg-[#f6f7f7]">
                      <h3 className="text-sm font-bold text-[#1d2327] uppercase tracking-widest">Variable Protocol Map</h3>
                      <p className="text-[10px] text-[#646970] mt-1 italic">Active Placeholders</p>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                      <div className="space-y-4">
                         {[
                            { k: '{{site_name}}', d: 'System-wide Application Identifier' },
                            { k: '{{website_domain}}', d: 'Root access domain address' },
                            { k: '{{hero_text}}', d: 'Current Hero Headline vector' },
                            { k: '{{cta_text}}', d: 'Current CTA Button string' }
                         ].map(v => (
                            <div key={v.k} className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-sm space-y-1 group hover:border-[#2271b1] transition-all cursor-help" onClick={() => { navigator.clipboard.writeText(v.k); showFlash(`${v.k} copied to clipboard`); }}>
                               <code className="text-xs font-black text-[#2271b1] group-hover:text-[#135e96]">{v.k}</code>
                               <p className="text-[9px] font-bold text-[#646970] uppercase tracking-tighter">{v.d}</p>
                            </div>
                         ))}
                      </div>
                      <div className="p-4 bg-[#fcf9e8] border border-[#dba617] rounded-sm shadow-inner">
                         <h4 className="text-[10px] font-black text-[#dba617] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            Security Protocol
                         </h4>
                         <p className="text-[10px] text-[#646970] leading-relaxed italic">
                            HTML nodes are strictly sanitized. Ensure valid structure to prevent rendering failures in the public vector.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* GLOBAL SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="wp-card flex-1 w-full lg:max-w-2xl">
                   <div className="flex border-b border-[#dcdcde] bg-[#f6f7f7]">
                      {['general', 'ai', 'security', 'otp'].map(t => (
                        <button key={t} onClick={() => setActiveSettingsTab(t)} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeSettingsTab === t ? 'border-[#2271b1] text-[#2271b1] bg-white' : 'border-transparent text-[#a7aaad] hover:text-[#1d2327]'}`}>{t}</button>
                      ))}
                   </div>
                   <div className="p-8">
                      {activeSettingsTab === 'general' && (
                        <div className="space-y-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Application Identifier (Site Name)</label>
                              <div className="flex gap-2">
                                 <input type="text" className="flex-1 wp-input" value={settings.find(s => s.key === 'site_name')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'site_name' ? {...s, value: e.target.value} : s))} />
                                 <button onClick={() => handleUpdateSetting('site_name', settings.find(s => s.key === 'site_name')?.value)} className="px-6 wp-button-primary">Save</button>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Vite Backend Vector (API URL)</label>
                              <div className="flex gap-2">
                                 <input type="text" className="flex-1 wp-input font-mono" value={settings.find(s => s.key === 'vite_api_base_url')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'vite_api_base_url' ? {...s, value: e.target.value} : s))} />
                                 <button onClick={() => handleUpdateSetting('vite_api_base_url', settings.find(s => s.key === 'vite_api_base_url')?.value)} className="px-6 wp-button-primary">Save</button>
                              </div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-[#f6f7f7] border border-[#dcdcde]">
                             <div>
                                <p className="text-sm font-bold text-[#1d2327]">WhatsApp OTP Node</p>
                                <p className="text-[10px] text-[#646970] italic">Enable 2FA via WhatsApp Engine.</p>
                             </div>
                             <button onClick={() => handleUpdateSetting('otp_enabled', settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'false' : 'true')} className={`w-12 h-6 rounded-full relative transition-all ${settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'bg-[#2271b1]' : 'bg-[#dcdcde]'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.find(s => s.key === 'otp_enabled')?.value === 'true' ? 'left-7' : 'left-1'}`} />
                             </button>
                           </div>

                           <div className="flex items-center justify-between p-4 bg-[#f6f7f7] border border-[#dcdcde]">
                             <div>
                                <p className="text-sm font-bold text-[#1d2327]">Global Group Greetings</p>
                                <p className="text-[10px] text-[#646970] italic">Automatically greet new group members.</p>
                             </div>
                             <button onClick={() => handleUpdateSetting('group_greeting_enabled', settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true' ? 'false' : 'true')} className={`w-12 h-6 rounded-full relative transition-all ${settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true' ? 'bg-[#2271b1]' : 'bg-[#dcdcde]'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.find(s => s.key === 'group_greeting_enabled')?.value === 'true' ? 'left-7' : 'left-1'}`} />
                             </button>
                           </div>

                           <div className="pt-6 border-t border-[#dcdcde] mt-8">
                              <h4 className="text-xs font-bold text-[#1d2327] uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <RefreshCw className={`w-3.5 h-3.5 ${updateLoading ? 'animate-spin' : ''}`} />
                                 System Pulse & Update
                              </h4>
                              
                              <div className="bg-[#fcf9e8] border border-[#dba617]/30 p-4 rounded-sm space-y-4">
                                 <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-[#dba617] mt-0.5" />
                                    <div className="space-y-1">
                                       <p className="text-xs font-bold text-[#1d2327]">Hot Patch Protocol</p>
                                       <p className="text-[10px] text-[#646970] leading-relaxed">
                                          Upload an official <strong>.tar.gz</strong> release package to patch system source code and synchronize database schemas. Existing data will be retained.
                                       </p>
                                    </div>
                                 </div>

                                 {updateCountdown !== null ? (
                                    <div className="p-4 bg-[#2271b1] text-white text-center rounded-sm animate-pulse">
                                       <p className="text-sm font-black uppercase tracking-widest">Restarting System...</p>
                                       <p className="text-[10px] mt-1 opacity-80">Re-entry in {updateCountdown} seconds</p>
                                    </div>
                                 ) : (
                                    <div className="space-y-3">
                                       <div className="flex flex-col sm:flex-row gap-2">
                                          <div className="flex-1 relative">
                                             <input 
                                                type="file" 
                                                id="system-update-file" 
                                                className="hidden" 
                                                accept=".tar.gz" 
                                                onChange={(e) => setUpdateFile(e.target.files[0])} 
                                             />
                                             <label 
                                                htmlFor="system-update-file" 
                                                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-[#dcdcde] rounded-sm cursor-pointer hover:border-[#2271b1] transition-all"
                                             >
                                                <span className="text-[10px] font-mono text-[#646970] truncate">
                                                   {updateFile ? updateFile.name : 'Select release-vX.X.X.tar.gz'}
                                                </span>
                                                <FileText className="w-3.5 h-3.5 text-[#a7aaad]" />
                                             </label>
                                          </div>
                                          <button 
                                             onClick={handleSystemUpdate}
                                             disabled={updateLoading || !updateFile}
                                             className="wp-button-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                          >
                                             {updateLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                             Apply Patch
                                          </button>
                                       </div>
                                       
                                       {updateStatus && (
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#2271b1] bg-white/50 p-2 border border-[#2271b1]/10 rounded-sm">
                                             <Terminal className="w-3 h-3" />
                                             {updateStatus}
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      )}

                      {activeSettingsTab === 'ai' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-[#f6f7f7] border border-[#dcdcde]">
                              <div>
                                 <p className="text-sm font-bold text-[#1d2327]">Autonomous Assistant</p>
                                 <p className="text-[10px] text-[#646970] italic">Enable LLM-driven query resolution.</p>
                              </div>
                              <button onClick={() => handleUpdateSetting('ai_enabled', settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'false' : 'true')} className={`w-12 h-6 rounded-full relative transition-all ${settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'bg-[#2271b1]' : 'bg-[#dcdcde]'}`}>
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.find(s => s.key === 'ai_enabled')?.value === 'true' ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-[#a7aaad] uppercase">AI Provider</label>
                                 <select className="w-full wp-input appearance-none" value={settings.find(s => s.key === 'ai_provider')?.value || 'gemini'} onChange={(e) => { handleUpdateSetting('ai_provider', e.target.value); const def = e.target.value === 'mistral' ? 'mistral-tiny' : 'gemini-1.5-flash'; handleUpdateSetting('ai_model', def); }}>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="mistral">Mistral AI</option>
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-[#a7aaad] uppercase">LLM Model Node</label>
                                 <select className="w-full wp-input appearance-none" value={settings.find(s => s.key === 'ai_model')?.value || ''} onChange={(e) => handleUpdateSetting('ai_model', e.target.value)}>
                                    {settings.find(s => s.key === 'ai_provider')?.value === 'mistral' ? (
                                      <>
                                        <option value="mistral-tiny">Tiny</option>
                                        <option value="mistral-medium">Medium</option>
                                        <option value="mistral-large-latest">Large</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="gemini-1.5-flash">1.5 Flash</option>
                                        <option value="gemini-1.5-pro">1.5 Pro</option>
                                      </>
                                    )}
                                  </select>
                              </div>
                           </div>

                           {settings.find(s => s.key === 'ai_provider')?.value === 'mistral' ? (
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Mistral API Key</label>
                                <div className="flex gap-2">
                                   <input type="password" underline="false" className="flex-1 wp-input font-mono" value={settings.find(s => s.key === 'mistral_api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'mistral_api_key' ? {...s, value: e.target.value} : s))} />
                                   <button onClick={() => handleUpdateSetting('mistral_api_key', settings.find(s => s.key === 'mistral_api_key')?.value)} className="px-6 wp-button-primary">Save</button>
                                </div>
                             </div>
                           ) : (
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Gemini API Key</label>
                                <div className="flex gap-2">
                                   <input type="password" underline="false" className="flex-1 wp-input font-mono" value={settings.find(s => s.key === 'gemini_api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'gemini_api_key' ? {...s, value: e.target.value} : s))} />
                                   <button onClick={() => handleUpdateSetting('gemini_api_key', settings.find(s => s.key === 'gemini_api_key')?.value)} className="px-6 wp-button-primary">Save</button>
                                </div>
                             </div>
                           )}

                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#a7aaad] uppercase">System Instruction Prompt</label>
                              <textarea rows="4" className="w-full wp-input resize-none italic" value={settings.find(s => s.key === 'ai_custom_prompt')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'ai_custom_prompt' ? {...s, value: e.target.value} : s))} />
                              <button onClick={() => handleUpdateSetting('ai_custom_prompt', settings.find(s => s.key === 'ai_custom_prompt')?.value)} className="w-full wp-button-primary py-3">Update System Prompt</button>
                           </div>
                        </div>
                      )}
                      
                      {activeSettingsTab === 'security' && (
                        <div className="space-y-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#2271b1] uppercase">Full Access API Key</label>
                              <div className="flex gap-2">
                                 <input type="text" className="flex-1 wp-input font-mono" value={settings.find(s => s.key === 'api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'api_key' ? {...s, value: e.target.value} : s))} placeholder="Enter custom API key..." />
                                 <button onClick={() => { const key = generateUUID(); handleUpdateSetting('api_key', key); }} className="px-4 wp-button-secondary flex items-center gap-2"><Plus className="w-3 h-3" /> Generate</button>
                                 <button onClick={() => handleUpdateSetting('api_key', settings.find(s => s.key === 'api_key')?.value)} className="px-6 wp-button-primary">Save</button>
                              </div>
                              <p className="text-[10px] text-[#646970] italic font-bold">WARNING: This key grants full administrative access to all system endpoints.</p>
                           </div>

                           <div className="space-y-1 pt-4 border-t border-[#dcdcde]">
                              <label className="text-[10px] font-bold text-[#00a32a] uppercase tracking-widest">Messaging-Only API Key</label>
                              <div className="flex gap-2">
                                 <input type="text" className="flex-1 wp-input font-mono" value={settings.find(s => s.key === 'messaging_api_key')?.value || ''} onChange={(e) => setSettings(settings.map(s => s.key === 'messaging_api_key' ? {...s, value: e.target.value} : s))} placeholder="Enter messaging API key..." />
                                 <button onClick={() => { const key = generateUUID(); handleUpdateSetting('messaging_api_key', key); }} className="px-4 wp-button-secondary flex items-center gap-2"><Plus className="w-3 h-3" /> Generate</button>
                                 <button onClick={() => handleUpdateSetting('messaging_api_key', settings.find(s => s.key === 'messaging_api_key')?.value)} className="px-6 wp-button-primary">Save</button>
                              </div>
                              <p className="text-[10px] text-[#646970] italic">This key is restricted to messaging operations (Broadcasts, Group Messages, Polls). It cannot access management or system configuration endpoints.</p>
                           </div>
                        </div>
                      )}
                      {activeSettingsTab === 'otp' && (
                        <div className="space-y-6">
                          <div className="p-6 bg-[#fcf9e8] border border-[#dba617]">
                             <h4 className="text-xs font-bold text-[#dba617] uppercase mb-4">Transmission Diagnostic</h4>
                             <form onSubmit={handleSendTest} className="flex gap-2">
                                <input type="tel" required className="flex-1 wp-input" placeholder="91XXXXXXXXXX" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
                                <button type="submit" disabled={testLoading} className="px-6 wp-button-primary">{testLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Send Test OTP'}</button>
                             </form>
                          </div>
                          {testSuccess && <div className="p-3 bg-[#edfaef] text-[#00a32a] text-xs font-bold uppercase tracking-widest border-l-4 border-[#00a32a]">Acknowledge: OTP Delivered</div>}
                        </div>
                      )}
                   </div>
                </div>

                {/* API ENDPOINT REFERENCE */}
                <div className="wp-card flex-1 w-full lg:max-w-md h-[600px] flex flex-col">
                  <div className="p-4 border-b border-[#dcdcde] bg-[#f6f7f7]">
                    <h3 className="text-sm font-bold text-[#1d2327] uppercase tracking-widest">System API Reference</h3>
                    <p className="text-[10px] text-[#646970] mt-1 font-bold italic uppercase tracking-tighter">Unified Vector Diagnostics</p>
                  </div>                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    <section className="space-y-3">
                      <h4 className="text-xs font-bold text-[#2271b1] uppercase tracking-widest border-l-2 border-[#2271b1] pl-2">WhatsApp Engine</h4>
                      <div className="space-y-1">
                        {[
                          { n: 'System Status', m: 'GET', p: '/whatsapp/status', k: true, d: 'Check connection status' },
                          { n: 'Broadcast Node', m: 'POST', p: '/whatsapp/broadcast', k: true, mo: true, d: 'Send message to multiple targets', b: '{"targets": [{"id": "91XXXXXXXXXX@c.us", "type": "individual"}], "message": "Broadcast content", "mediaUrl": "", "mediaType": "image"}' },
                          { n: 'Group Node Message', m: 'POST', p: '/whatsapp/group/message', k: true, mo: true, d: 'Direct message to a group node', b: '{"groupId": "120363XXXXXXXXXXXX@g.us", "message": "Group update", "mediaUrl": "", "mediaType": "image"}' },
                          { n: 'Channel Publication', m: 'POST', p: '/whatsapp/channel/post', k: true, mo: true, d: 'Publish to a channel newsletter', b: '{"channelId": "120363XXXXXXXXXXXX@newsletter", "message": "Channel publication", "mediaUrl": "", "mediaType": "image"}' },
                          { n: 'Deploy Poll', m: 'POST', p: '/whatsapp/poll', k: true, mo: true, d: 'Deploy a native WhatsApp poll', b: '{"chatId": "91XXXXXXXXXX@c.us", "question": "Are you ready?", "options": ["Yes", "No"], "allowMultiple": false}' },
                          { n: 'Chat Registry', m: 'GET', p: '/whatsapp/chats', k: true, d: 'Retrieve all managed chats' },
                          { n: 'Initialize Group', m: 'POST', p: '/whatsapp/groups', k: true, d: 'Create a new group node', b: '{"name": "New Team", "participants": ["91XXXXXXXXXX"]}' },
                          { n: 'Initialize Channel', m: 'POST', p: '/whatsapp/channels', k: true, d: 'Create a new channel newsletter', b: '{"name": "System News", "description": "Official updates"}' }
                        ].map(endpoint => (
                          <APIEndpointEntry key={endpoint.p} endpoint={endpoint} onClick={setActiveEndpoint} />
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-xs font-bold text-[#2271b1] uppercase tracking-widest border-l-2 border-[#2271b1] pl-2">Identity Hub</h4>
                      <div className="space-y-1">
                        {[
                          { n: 'Node Auth', m: 'POST', p: '/user/login', d: 'Authenticate and receive JWT token', b: '{"email": "admin@site.com", "password": "..."}' },
                          { n: 'Node Registration', m: 'POST', p: '/user/register', d: 'Register a new identity node', b: '{"email": "...", "password": "...", "full_name": "...", "phone_number": "..."}' },
                          { n: 'Node Profile', m: 'GET', p: '/user/profile', d: 'Get authenticated user data' },
                          { n: 'Registry List', m: 'GET', p: '/user/all', d: 'List all registered nodes (Admin)' }
                        ].map(endpoint => (
                          <APIEndpointEntry key={endpoint.p} endpoint={endpoint} onClick={setActiveEndpoint} />
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-xs font-bold text-[#2271b1] uppercase tracking-widest border-l-2 border-[#2271b1] pl-2">System Core</h4>
                      <div className="space-y-1">
                        {[
                          { n: 'System Config', m: 'GET', p: '/settings/all', d: 'Retrieve system parameters' },
                          { n: 'Node Update', m: 'PUT', p: '/settings/update', d: 'Modify system configuration', b: '{"key": "site_name", "value": "New Name"}' },
                          { n: 'Vector Upload', m: 'POST', p: '/upload', d: 'Vectorize static assets', b: '--form "file=@/path/to/asset.jpg"' },
                          { n: 'System Audit', m: 'GET', p: '/audit/messages', d: 'Fetch system transmission logs' },
                          { n: 'CMS Content', m: 'GET', p: '/cms/landing', d: 'Fetch landing page content' }
                        ].map(endpoint => (
                          <APIEndpointEntry key={endpoint.p} endpoint={endpoint} onClick={setActiveEndpoint} />
                        ))}
                      </div>
                    </section>
                  </div>
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
        title="Direct Node Transmission"
        subtitle={`Target: ${directMessageTarget?.name}`}
        flash={flash}
      >
        <form onSubmit={handleSendDirectMessage} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Standard Template</label>
            <select className="w-full wp-input appearance-none" value={directMessageTemplate} onChange={(e) => setDirectMessageTemplate(e.target.value)}>
              <option value="">-- Custom Synthesis --</option>
              {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
          </div>
          {!directMessageTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Payload Content</label>
                <textarea rows="4" className="w-full wp-input resize-none" value={directMessageContent} onChange={(e) => setDirectMessageContent(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Media Vector URL</label>
                <div className="flex gap-2">
                  <input type="url" className="flex-1 wp-input font-mono text-[10px]" value={directMediaUrl} onChange={(e) => setDirectMediaUrl(e.target.value)} />
                  <div className="relative">
                    <input type="file" id="direct-file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => { setDirectMediaUrl(url); setDirectMediaType(type); })} />
                    <label htmlFor="direct-file" className="wp-button-secondary py-1 cursor-pointer">{isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'UPLOAD'}</label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 wp-button-primary">Execute</button>
            <button type="button" onClick={() => setShowDirectMessage(false)} className="px-6 wp-button-secondary">Abort</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteOtpSent(false); }}
        title="Destroy Entity?"
        subtitle={`Permanently remove "${deleteContext?.name}". Operation is irreversible.`}
        maxWidth="max-w-md"
        flash={flash}
      >
        <div className="p-4 bg-[#fcf0f1] text-[#d63638] border border-[#d63638] text-sm mb-6 flex items-center gap-3">
           <AlertCircle className="w-6 h-6" />
           <p className="font-bold uppercase tracking-tighter">Confirmation Required</p>
        </div>
        {!deleteOtpSent ? (
          <div className="flex gap-2">
            <button onClick={handleRequestWaDeleteOtp} className="flex-1 wp-button-primary bg-[#d63638] border-[#d63638]">Request OTP</button>
            <button onClick={() => setShowDeleteModal(false)} className="px-6 wp-button-secondary">Cancel</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#a7aaad] uppercase text-center block">Enter OTP</label>
              <input type="text" maxLength="6" className="w-full wp-input text-center text-2xl font-black tracking-widest" value={deleteOtp} onChange={(e) => setDeleteOtp(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirmWaDelete} disabled={deleteOtp.length !== 6} className="flex-1 wp-button-primary bg-[#d63638] border-[#d63638]">Confirm Delete</button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteOtpSent(false); }} className="px-6 wp-button-secondary">Abort</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPollResultModal}
        onClose={() => { setShowPollResultModal(false); setPollPreviewData(null); }}
        title="Live Result Preview"
        subtitle={`Poll: ${selectedPollForResults?.question || selectedPollForResults?.title}`}
        maxWidth="max-w-2xl"
        flash={flash}
      >
        <div className="space-y-6">
          {pollPreviewLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-8 h-8 text-[#2271b1] animate-spin" />
              <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Synchronizing Live Data...</p>
            </div>
          ) : pollPreviewData ? (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="wp-card p-4 bg-[#f6f7f7] text-center border-[#dcdcde]">
                  <p className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-widest mb-1">Total Votes</p>
                  <p className="text-2xl font-black text-[#2271b1]">{pollPreviewData.totalVotes}</p>
                </div>
                <div className="wp-card p-4 bg-[#f6f7f7] text-center border-[#dcdcde]">
                  <p className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-black uppercase text-[#1d2327]">{selectedPollForResults?.status}</p>
                </div>
                <div className="wp-card p-4 bg-[#f6f7f7] text-center border-[#dcdcde]">
                  <p className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-widest mb-1">Access Type</p>
                  <p className="text-sm font-black uppercase text-[#1d2327]">{selectedPollForResults?.access_type}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-[#1d2327] uppercase tracking-widest border-l-2 border-[#2271b1] pl-3">Vote Distribution</h3>
                <div className="space-y-4">
                  {pollPreviewData.results.map((res, i) => {
                    const percentage = pollPreviewData.totalVotes > 0 ? (res.votes / pollPreviewData.totalVotes) * 100 : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-[#3c434a] uppercase">{res.name || res.option_selected || `Option ${i+1}`}</span>
                          <span className="text-[10px] font-black text-[#2271b1]">{res.votes} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-4 bg-[#f6f7f7] border border-[#dcdcde] shadow-inner relative overflow-hidden">
                          <div 
                            className="h-full bg-[#2271b1] transition-all duration-1000 ease-out relative group"
                            style={{ width: `${percentage}%` }}
                          >
                             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-[#fcfcfc] border border-[#dcdcde] flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedPollForResults?.status === 'OPEN' ? 'bg-[#00a32a] animate-pulse' : 'bg-[#d63638]'}`} />
                    <span className="text-[9px] font-bold text-[#646970] uppercase">Live Matrix Active</span>
                 </div>
                 <button 
                    onClick={() => { setShowPollResultModal(false); setPollPreviewData(null); }} 
                    className="wp-button-secondary py-1.5 px-6 text-[10px]"
                 >
                    Close Preview
                 </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-[#d63638]">
               <AlertCircle className="w-8 h-8 mx-auto mb-2" />
               <p className="text-xs font-bold uppercase">Critical Error: Result Set Null</p>
            </div>
          )}
        </div>
      </Modal>

      {/* GATEWAY DEBUG */}
      {gatewayResponse && (
        <div className="fixed bottom-0 right-8 w-80 bg-[#1d2327] border-x border-t border-[#2c3338] z-[100] shadow-2xl">
          <button onClick={() => setIsDebugExpanded(!isDebugExpanded)} className="w-full px-3 py-2 flex items-center justify-between text-white hover:bg-[#2c3338]">
             <div className="flex items-center gap-2 text-[#72aee6]"><Terminal className="w-4 h-4" /><span className="text-[10px] font-bold uppercase">Gateway Log</span></div>
             {isDebugExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {isDebugExpanded && (
            <div className="p-3 bg-black/50 border-t border-[#2c3338] max-h-60 overflow-y-auto custom-scrollbar">
               <pre className="text-[9px] font-mono text-[#edfaef] whitespace-pre-wrap">{JSON.stringify(gatewayResponse.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      
      {/* POLL MODAL (Used in Groups/Channels) */}
      <Modal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        title="Initialize Sync Poll"
        subtitle={`Target: ${directMessageTarget?.name}`}
        flash={flash}
      >
        <form onSubmit={handleSendPoll} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Question</label>
            <input type="text" required className="w-full wp-input" value={pollData.question} onChange={(e) => setPollData({...pollData, question: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Selection Options</label>
            {pollData.options.map((opt, i) => (
              <div key={i} className="flex gap-1">
                <input type="text" className="flex-1 wp-input py-1.5" placeholder={`Option ${i+1}`} value={opt} onChange={(e) => {
                  const opts = [...pollData.options];
                  opts[i] = e.target.value;
                  setPollData({...pollData, options: opts});
                }} />
                {pollData.options.length > 2 && (
                  <button type="button" onClick={() => setPollData({...pollData, options: pollData.options.filter((_, idx) => idx !== i)})} className="p-1 text-[#d63638]"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPollData({...pollData, options: [...pollData.options, '']})} className="text-[10px] font-bold text-[#2271b1] hover:underline uppercase">+ Add Selection</button>
          </div>
          <button type="submit" className="w-full wp-button-primary py-3">Deploy Poll</button>
        </form>
      </Modal>

      {/* MEMBER MESSAGE MODAL (Used in Group Member list) */}
      <Modal
        isOpen={showMemberMessageModal}
        onClose={() => setShowMemberMessageModal(false)}
        title="Direct Node Transmission"
        subtitle={`Target: ${selectedMemberForMessage?.name}`}
        flash={flash}
      >
        <form onSubmit={handleSendMemberMessage} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Payload Content</label>
            <textarea rows="4" required className="w-full wp-input resize-none" value={memberMessageContent} onChange={(e) => setMemberMessageContent(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Attachment Vector URL</label>
            <div className="flex gap-2">
              <input type="url" className="flex-1 wp-input font-mono text-[10px]" value={memberMediaUrl} onChange={(e) => setMemberMediaUrl(e.target.value)} />
              <div className="relative">
                <input type="file" id="member-file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => { setMemberMediaUrl(url); setMemberMediaType(type); })} />
                <label htmlFor="member-file" className="wp-button-secondary py-1 cursor-pointer">UPLOAD</label>
              </div>
            </div>
          </div>
          <button type="submit" disabled={waActionLoading} className="w-full wp-button-primary py-3">Execute Transmission</button>
        </form>
      </Modal>

      {/* WHATSAPP GROUP MANAGEMENT MODAL */}
      <Modal
        isOpen={showGroupManage}
        onClose={() => setShowGroupManage(false)}
        title="WhatsApp Group Administration"
        subtitle={`Managing: ${managingGroup?.name}`}
        maxWidth="max-w-4xl"
        flash={flash}
      >
        <div className="space-y-8">
          {/* Join Requests */}
          {joinRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#dba617] uppercase tracking-widest border-l-2 border-[#dba617] pl-2">Pending Join Requests</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {joinRequests.map(req => (
                  <div key={req.id._serialized} className="p-3 bg-[#fcf9e8] border border-[#dba617] flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1d2327] truncate">{req.name || req.id.user}</p>
                      <p className="text-[9px] font-mono text-[#646970]">+{req.id.user}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleApproveJoin(req.id._serialized)} className="p-1 bg-[#00a32a] text-white rounded-sm hover:bg-[#008a20]"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleRejectJoin(req.id._serialized)} className="p-1 bg-[#d63638] text-white rounded-sm hover:bg-[#b32d2e]"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participant Registry */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#2271b1] uppercase tracking-widest border-l-2 border-[#2271b1] pl-2">Participant Registry</h3>
            <div className="border border-[#dcdcde] bg-[#f6f7f7] max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f0f0f1] border-b border-[#dcdcde] sticky top-0 z-10">
                    <th className="px-4 py-2 text-[10px] font-bold text-[#1d2327] uppercase tracking-tighter">Identity</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-[#1d2327] uppercase tracking-tighter text-right">Operational Control</th>
                  </tr>
                </thead>
                <tbody>
                  {managingGroup?.metadata?.participants?.map(p => (
                    <tr key={p.id._serialized} className="bg-white border-b border-[#f0f0f1] hover:bg-[#fcfcfc] group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#f6f7f7] border border-[#dcdcde] flex items-center justify-center font-bold text-xs">
                            {p.profilePic ? <img src={p.profilePic} className="w-full h-full object-cover" /> : (p.name?.[0] || 'U')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1d2327]">
                              {p.name}
                              {p.pushname && p.pushname !== p.name && (
                                <span className="ml-2 text-[9px] font-normal text-[#646970]">(@{p.pushname})</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold uppercase px-1 py-0.5 border ${p.isAdmin ? 'bg-[#fcf9e8] text-[#dba617] border-[#dba617]' : 'bg-[#f6f7f7] text-[#646970] border-[#dcdcde]'}`}>{p.isAdmin ? 'Admin' : 'Participant'}</span>
                              <span className="text-[9px] font-mono text-[#a7aaad]">+{p.phoneNumber || p.id.user}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.isAdmin ? (
                            <button onClick={() => handleDemoteAdmin(p.id._serialized)} className="px-2 py-1 bg-[#f0f0f1] text-[#1d2327] border border-[#dcdcde] text-[9px] font-bold uppercase hover:bg-[#dcdcde]" title="Demote">Demote</button>
                          ) : (
                            <button onClick={() => handlePromoteAdmin(p.id._serialized)} className="px-2 py-1 bg-[#2271b1] text-white border border-[#135e96] text-[9px] font-bold uppercase hover:bg-[#135e96]" title="Promote">Promote</button>
                          )}
                          <button onClick={() => handleRemoveParticipant(p.id._serialized)} className="px-2 py-1 bg-white text-[#d63638] border border-[#d63638] text-[9px] font-bold uppercase hover:bg-[#fcf0f1]" title="Remove">Expel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <APIEndpointModal 
        isOpen={!!activeEndpoint} 
        endpoint={activeEndpoint} 
        onClose={() => { setActiveEndpoint(null); setApiTestResult(null); }}
        onTest={handleTestEndpoint}
        loading={apiTestLoading}
        result={apiTestResult}
        settings={settings}
      />
    </div>
  );
};

export default AdminDashboard;
