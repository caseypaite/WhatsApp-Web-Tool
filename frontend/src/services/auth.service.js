import api from './api';

const login = async (email, password) => {
  const response = await api.post('/user/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

const loginWithPhoneRequest = async (phone_number) => {
  const response = await api.post('/user/login-phone-request', { phone_number });
  return response.data;
};

const loginWithPhoneVerify = async (phone_number, otp) => {
  const response = await api.post('/user/login-phone-verify', { phone_number, otp });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

const forgotPasswordRequest = async (email_or_phone) => {
  const response = await api.post('/user/forgot-password-request', { email_or_phone });
  return response.data;
};

const forgotPasswordReset = async (email_or_phone, otp, new_password) => {
  const response = await api.post('/user/forgot-password-reset', { email_or_phone, otp, new_password });
  return response.data;
};

const register = async (userData) => {
  const response = await api.post('/user/register', userData);
  return response.data;
};

const verifyRegistration = async (userId, otp) => {
  const response = await api.post('/user/verify-registration', { userId, otp });
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    localStorage.removeItem('user');
    return null;
  }
};

const getProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

const getAllUsers = async (params) => {
  const response = await api.get('/user/all', { params });
  return response.data;
};

// Group Management
const createGroup = async (groupData) => {
  const response = await api.post('/user/groups/create', groupData);
  return response.data;
};

const deleteGroup = async (groupId, otp) => {
  const response = await api.delete(`/user/groups/${groupId}`, { data: { otp } });
  return response.data;
};

const getAllGroups = async () => {
  const response = await api.get('/user/groups/all');
  return response.data;
};

const getGroupMembers = async (groupId) => {
  const response = await api.get(`/user/groups/members/${groupId}`);
  return response.data;
};

const addGroupMember = async (groupId, userId, role) => {
  const response = await api.post('/user/groups/add-member', { groupId, userId, role });
  return response.data;
};

const removeGroupMember = async (groupId, userId) => {
  const response = await api.post('/user/groups/remove-member', { groupId, userId });
  return response.data;
};

const updateMemberRole = async (groupId, userId, role) => {
  const response = await api.post('/user/groups/update-member-role', { groupId, userId, role });
  return response.data;
};

const sendMessage = async (userId, phoneNumber, message, mediaOptions = null) => {
  const response = await api.post('/user/groups/send-message', { userId, phoneNumber, message, mediaOptions });
  return response.data;
};

const getMessageHistory = async (userId) => {
  const response = await api.get(`/user/groups/message-history/${userId}`);
  return response.data;
};

const getMyGroups = async () => {
  const response = await api.get('/user/my-groups');
  return response.data;
};

const getMyMessages = async () => {
  const response = await api.get('/user/my-messages');
  return response.data;
};

// WhatsApp Integration
const getWhatsappStatus = async () => {
  const response = await api.get('/whatsapp/status');
  return response.data;
};

const getWhatsappChats = async () => {
  const response = await api.get('/whatsapp/chats');
  return response.data;
};

const getWhatsappContacts = async () => {
  const response = await api.get('/whatsapp/contacts');
  return response.data;
};

const confirmPasswordChange = async (otp, new_password) => {
  const response = await api.post('/user/confirm-password-change', { otp, new_password });
  return response.data;
};

const requestPasswordChange = async () => {
  const response = await api.post('/user/request-password-change');
  return response.data;
};

const logoutWhatsapp = async () => {
  const response = await api.post('/whatsapp/logout');
  return response.data;
};

const reinitializeWhatsapp = async () => {
  const response = await api.post('/whatsapp/reinitialize');
  return response.data;
};

const sendWhatsappTest = async (number, message) => {
  const response = await api.post('/whatsapp/send-test', { number, message });
  return response.data;
};

const createWaGroup = async (name, participants) => {
  const response = await api.post('/whatsapp/groups', { name, participants });
  return response.data;
};

const createWaChannel = async (name, description) => {
  const response = await api.post('/whatsapp/channels', { name, description });
  return response.data;
};

const requestWaDeleteOtp = async () => {
  const response = await api.post('/whatsapp/request-delete-otp');
  return response.data;
};

const confirmWaDelete = async (id, type, otp) => {
  const response = await api.post('/whatsapp/confirm-delete', { id, type, otp });
  return response.data;
};

const sendWaBroadcast = async (targets, message, templateId, mediaUrl = null, mediaType = null) => {
  const response = await api.post('/whatsapp/broadcast', { targets, message, templateId, mediaUrl, mediaType });
  return response.data;
};

// Template Management
const getTemplates = async () => {
  const response = await api.get('/templates/all');
  return response.data;
};

const createTemplate = async (data) => {
  const response = await api.post('/templates/create', data);
  return response.data;
};

const updateTemplate = async (id, data) => {
  const response = await api.put(`/templates/${id}`, data);
  return response.data;
};

const deleteTemplate = async (id, otp) => {
  const response = await api.delete(`/templates/${id}`, { data: { otp } });
  return response.data;
};

// Advanced Group Management
const getGroupMetadata = async (groupId) => {
  const response = await api.get(`/whatsapp/groups/${groupId}/metadata`);
  return response.data;
};

const promoteAdmin = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/promote`, { participantId });
  return response.data;
};

const demoteAdmin = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/demote`, { participantId });
  return response.data;
};

const removeParticipant = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/remove`, { participantId });
  return response.data;
};

const addParticipant = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/add`, { participantId });
  return response.data;
};

const getJoinRequests = async (groupId) => {
  const response = await api.get(`/whatsapp/groups/${groupId}/join-requests`);
  return response.data;
};

const approveJoinRequest = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/approve`, { participantId });
  return response.data;
};

const rejectJoinRequest = async (groupId, participantId) => {
  const response = await api.post(`/whatsapp/groups/${groupId}/reject`, { participantId });
  return response.data;
};

const sendPoll = async (chatId, question, options, allowMultiple) => {
  const response = await api.post('/whatsapp/poll', { chatId, question, options, allowMultiple });
  return response.data;
};

// Advanced Poll Module
const createAdvancedPoll = async (data) => {
  const response = await api.post('/polls/create', data);
  return response.data;
};

const updateAdvancedPoll = async (id, data) => {
  const response = await api.put(`/polls/${id}`, data);
  return response.data;
};

const publishPollResults = async (id, published) => {
  const response = await api.post(`/polls/${id}/publish`, { published });
  return response.data;
};

const getAdvancedPollResults = async (id) => {
  const response = await api.get(`/polls/${id}/results`);
  return response.data;
};

const getPollDetails = async (id) => {
  const response = await api.get(`/polls/${id}`);
  return response.data;
};

const getPublicLatestPolls = async () => {
  const response = await api.get('/polls/public/latest');
  return response.data;
};

const getPollResultsAdvanced = async (id) => {
  const response = await api.get(`/polls/${id}/results`);
  return response.data;
};

const requestVoteOtp = async (pollId, phone_number, confirmView = false) => {
  const response = await api.post('/polls/vote/request-otp', { pollId, phone_number, confirmView });
  return response.data;
};

const verifyAndVote = async (data) => {
  const response = await api.post('/polls/vote/verify', data);
  return response.data;
};

const deleteAdvancedPoll = async (id, otp) => {
  const response = await api.delete(`/polls/${id}`, { data: { otp } });
  return response.data;
};

// Auto-Responder Management
const getResponders = async () => {
  const response = await api.get('/responders');
  return response.data;
};

const createResponder = async (data) => {
  const response = await api.post('/responders', data);
  return response.data;
};

const updateResponder = async (id, data) => {
  const response = await api.put(`/responders/${id}`, data);
  return response.data;
};

const deleteResponder = async (id, otp) => {
  const response = await api.delete(`/responders/${id}`, { data: { otp } });
  return response.data;
};

const toggleResponder = async (id) => {
  const response = await api.post(`/responders/${id}/toggle`);
  return response.data;
};

// Scheduled Message Management
const getScheduledMessages = async () => {
  const response = await api.get('/scheduled');
  return response.data;
};

const createScheduledMessage = async (data) => {
  const response = await api.post('/scheduled', data);
  return response.data;
};

const cancelScheduledMessage = async (id) => {
  const response = await api.post(`/scheduled/${id}/cancel`);
  return response.data;
};

const deleteScheduledMessage = async (id, otp) => {
  const response = await api.delete(`/scheduled/${id}`, { data: { otp } });
  return response.data;
};

// Audit & Polls
const getAuditLogs = async (params) => {
  const response = await api.get('/audit/messages', { params });
  return response.data;
};

const clearAuditHistory = async (otp) => {
  const response = await api.delete('/audit/messages', { data: { otp } });
  return response.data;
};

const getPollResults = async () => {
  const response = await api.get('/polls');
  return response.data;
};

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// CMS Integration
const getLandingPage = async () => {
  const response = await api.get('/cms/landing');
  return response.data;
};

const updateLandingPage = async (data) => {
  const response = await api.put('/cms/landing', data);
  return response.data;
};

export default {
  login,
  loginWithPhoneRequest,
  loginWithPhoneVerify,
  forgotPasswordRequest,
  forgotPasswordReset,
  register,
  verifyRegistration,
  logout,
  getCurrentUser,
  getProfile,
  getAllUsers,
  createGroup,
  deleteGroup,
  getAllGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateMemberRole,
  sendMessage,
  getMessageHistory,
  getMyGroups,
  getMyMessages,
  getWhatsappStatus,
  getWhatsappChats,
  getWhatsappContacts,
  logoutWhatsapp,
  reinitializeWhatsapp,
  sendWhatsappTest,
  getLandingPage,
  updateLandingPage,
  requestPasswordChange,
  confirmPasswordChange,
  createWaGroup,
  createWaChannel,
  requestWaDeleteOtp,
  confirmWaDelete,
  sendWaBroadcast,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  uploadFile,
  getGroupMetadata,
  promoteAdmin,
  demoteAdmin,
  removeParticipant,
  addParticipant,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  sendPoll,
  createAdvancedPoll,
  updateAdvancedPoll,
  getPollDetails,
  getPublicLatestPolls,
  getPollResultsAdvanced,
  requestVoteOtp,
  verifyAndVote,
  deleteAdvancedPoll,
  getResponders,
  createResponder,
  updateResponder,
  deleteResponder,
  toggleResponder,
  getScheduledMessages,
  createScheduledMessage,
  cancelScheduledMessage,
  deleteScheduledMessage,
  getAuditLogs,
  clearAuditHistory,
  getPollResults,
  publishPollResults,
  getAdvancedPollResults
};
