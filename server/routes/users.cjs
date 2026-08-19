const express = require('express');
const protect = require('../middleware/auth.cjs');
const { requireModerator } = protect;
const { listUsers, getUser, updateUser, deleteUser, resetPassword, getResetRequests, markResetRequestDone } = require('../controllers/users.cjs');

const router = express.Router();

router.get('/', protect, requireModerator, listUsers);
router.get('/reset-requests', protect, requireModerator, getResetRequests);
router.get('/:id', protect, requireModerator, getUser);
router.put('/reset-requests/:id', protect, requireModerator, markResetRequestDone);
router.put('/:id/password', protect, requireModerator, resetPassword);
router.put('/:id', protect, requireModerator, updateUser);
router.delete('/:id', protect, requireModerator, deleteUser);

module.exports = router;

