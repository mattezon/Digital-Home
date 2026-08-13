const express = require('express');
const protect = require('../middleware/auth.cjs');
const {
  getChats,
  searchUsersAndChats,
  createDirectChat,
  createGroupChat,
  getChatMessages,
  sendMessage
} = require('../controllers/chat.cjs');

const router = express.Router();

router.get('/search', protect, searchUsersAndChats);
router.get('/', protect, getChats);
router.post('/direct', protect, createDirectChat);
router.post('/group', protect, createGroupChat);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, sendMessage);

module.exports = router;
