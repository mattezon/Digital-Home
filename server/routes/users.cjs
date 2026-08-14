const express = require('express');
const protect = require('../middleware/auth.cjs');
const { requireModerator } = protect;
const { listUsers, getUser, updateUser, deleteUser } = require('../controllers/users.cjs');

const router = express.Router();

router.get('/', protect, requireModerator, listUsers);
router.get('/:id', protect, requireModerator, getUser);
router.put('/:id', protect, requireModerator, updateUser);
router.delete('/:id', protect, requireModerator, deleteUser);

module.exports = router;
