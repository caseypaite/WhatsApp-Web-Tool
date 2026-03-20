const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * Admin Group Management Routes
 */
router.post('/create', authenticate, checkRole(['Admin']), groupController.createGroup);
router.get('/all', authenticate, checkRole(['Admin']), groupController.getAllGroups);
router.get('/members/:groupId', authenticate, checkRole(['Admin']), groupController.getGroupMembers);
router.post('/add-member', authenticate, checkRole(['Admin']), groupController.addMember);
router.post('/remove-member', authenticate, checkRole(['Admin']), groupController.removeMember);
router.post('/update-member-role', authenticate, checkRole(['Admin']), groupController.promoteMember);

module.exports = router;
