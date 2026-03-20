const express = require('express');
const router = express.Router();
console.log('[ROUTES] User routes loaded');
const userController = require('../controllers/user.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * Public Routes
 */
router.post('/register', (req, res) => userController.register(req, res));
router.post('/signup-otp', (req, res) => userController.sendSignupOtp(req, res));
router.post('/signup-verify', (req, res) => userController.verifySignupOtp(req, res));
router.post('/verify-registration', (req, res) => userController.verifyRegistration(req, res));
router.post('/login-phone-request', (req, res) => userController.loginWithPhoneRequest(req, res));
router.post('/login-phone-verify', (req, res) => userController.loginWithPhoneVerify(req, res));
router.post('/forgot-password-request', (req, res) => userController.forgotPasswordRequest(req, res));
router.post('/forgot-password-reset', (req, res) => userController.forgotPasswordReset(req, res));
router.post('/login', (req, res) => userController.login(req, res));

/**
 * Protected Routes
 */
router.get('/all', authenticate, checkRole(['Admin']), (req, res) => userController.getAllUsers(req, res));
router.put('/status', authenticate, checkRole(['Admin']), (req, res) => userController.updateUserStatus(req, res));
router.get('/profile', authenticate, (req, res) => userController.getProfile(req, res));
router.put('/profile', authenticate, (req, res) => userController.updateProfile(req, res));
router.post('/request-phone-update', authenticate, (req, res) => userController.requestPhoneUpdate(req, res));
router.post('/confirm-phone-update', authenticate, (req, res) => userController.confirmPhoneUpdate(req, res));
router.post('/request-password-change', authenticate, (req, res) => userController.requestPasswordChange(req, res));
router.post('/confirm-password-change', authenticate, (req, res) => userController.confirmPasswordChange(req, res));

const groupController = require('../controllers/group.controller');

/**
 * Admin Group Management Routes
 */
router.post('/groups/create', authenticate, checkRole(['Admin']), (req, res) => groupController.createGroup(req, res));
router.delete('/groups/:groupId', authenticate, checkRole(['Admin']), (req, res) => groupController.deleteGroup(req, res));
router.get('/groups/all', authenticate, checkRole(['Admin']), (req, res) => groupController.getAllGroups(req, res));
router.get('/groups/members/:groupId', authenticate, checkRole(['Admin']), (req, res) => groupController.getGroupMembers(req, res));
router.post('/groups/add-member', authenticate, checkRole(['Admin']), (req, res) => groupController.addMember(req, res));
router.post('/groups/remove-member', authenticate, checkRole(['Admin']), (req, res) => groupController.removeMember(req, res));
router.post('/groups/update-member-role', authenticate, checkRole(['Admin']), (req, res) => groupController.promoteMember(req, res));
router.post('/groups/send-message', authenticate, checkRole(['Admin']), (req, res) => groupController.sendMessage(req, res));
router.get('/groups/message-history/:userId', authenticate, checkRole(['Admin']), (req, res) => groupController.getMessageHistory(req, res));

// User specific group/message info
router.get('/my-groups', authenticate, (req, res) => groupController.getMyGroups(req, res));
router.get('/my-messages', authenticate, (req, res) => groupController.getMyMessageHistory(req, res));

module.exports = router;
