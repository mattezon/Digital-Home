const express = require('express');
const protect = require('../middleware/auth.cjs');
const { register, login, refreshToken, logout, updateProfile } = require('../controllers/auth.cjs');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.put('/profile', protect, updateProfile);

module.exports = router;