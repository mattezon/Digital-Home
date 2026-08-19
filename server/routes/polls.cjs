const express = require('express');
const protect = require('../middleware/auth.cjs');
const { createPoll, getPolls, getPoll, votePoll, deletePoll } = require('../controllers/polls.cjs');

const router = express.Router();

// Public routes
router.get('/', getPolls);
router.get('/:id', getPoll);

// Private routes
router.post('/', protect, createPoll);
router.post('/:id/vote', protect, votePoll);
router.delete('/:id', protect, deletePoll);

module.exports = router;