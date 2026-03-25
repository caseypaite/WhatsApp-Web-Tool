const express = require('express');
const router = express.Router();
const pollController = require('../controllers/poll.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

// Public/Voter routes
router.get('/public/latest', pollController.getPublicLatest);
router.get('/my-eligible', authenticate, pollController.getEligiblePolls);
router.post('/vote/request-otp', pollController.requestVoteOtp);
router.post('/vote/verify', pollController.verifyAndVote);
router.get('/:id', pollController.getById);
router.get('/:id/results', pollController.getResults);

// Authenticated User routes (Any group member can create)
router.post('/create', authenticate, pollController.create);
router.post('/:id/publish', authenticate, pollController.publishResults);
router.put('/:id', authenticate, pollController.update);
router.delete('/:id', authenticate, pollController.delete);

// Admin routes
router.get('/', authenticate, checkRole(['Admin']), pollController.getAll);

module.exports = router;
