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

// Group Management
const createGroup = async (groupData) => {
  const response = await api.post('/user/groups/create', groupData);
  return response.data;
};

const deleteGroup = async (groupId) => {
  const response = await api.delete(`/user/groups/${groupId}`);
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

const sendMessage = async (userId, phoneNumber, message) => {
  const response = await api.post('/user/groups/send-message', { userId, phoneNumber, message });
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
  sendWhatsappTest
};
