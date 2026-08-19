const Post = require('../models/Post.cjs');
const User = require('../models/User.cjs');
const Message = require('../models/Message.cjs');
const PasswordResetRequest = require('../models/PasswordResetRequest.cjs');

const DEFAULT_LIMIT = 20;
const USER_FIELDS = '_id email username displayName showUsername color moderator createdAt';

const normalizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  email: user.email,
  username: user.username,
  displayName: user.displayName || user.username,
  showUsername: user.showUsername ?? true,
  color: user.color || null,
  moderator: user.moderator === true,
  createdAt: user.createdAt
});

// @desc    Список пользователей (c опциональной пагинацией и поиском)
// @route   GET /api/users?search=&skip=&limit=
// @access  Moderator
exports.listUsers = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const limit = parseInt(req.query.limit, 10);
    const skip = parseInt(req.query.skip, 10);

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    let query = User.find(filter, USER_FIELDS).sort({ createdAt: -1, _id: 1 });

    if (!Number.isNaN(limit)) {
      query = query.skip(Number.isNaN(skip) ? 0 : skip).limit(limit + 1);
      const docs = await query.exec();
      const hasMore = docs.length > limit;
      const users = hasMore ? docs.slice(0, limit) : docs;
      return res.status(200).json({
        success: true,
        count: users.length,
        hasMore,
        total: docs.length,
        users: users.map(normalizeUser)
      });
    }

    const users = await query.exec();
    res.status(200).json({
      success: true,
      count: users.length,
      hasMore: false,
      total: users.length,
      users: users.map(normalizeUser)
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Пользователь по ID
// @route   GET /api/users/:id
// @access  Moderator
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, USER_FIELDS);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    res.status(200).json({ success: true, user: normalizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Обновить пользователя (права модератора недоступны)
// @route   PUT /api/users/:id
// @access  Moderator
exports.updateUser = async (req, res) => {
  try {
    const { username, displayName, showUsername, color } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    if (username !== undefined && username !== null && String(username).trim().length > 0) {
      const normalized = String(username).trim().toLowerCase();
      if (!/^[a-zA-Z0-9_.-]+$/.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Юзернейн может содержать только латинские буквы, цифры и символы _ . -' });
      }
      if (normalized.length < 3 || normalized.length > 20) {
        return res.status(400).json({ success: false, message: 'Юзернейн должен быть длиной от 3 до 20 символов' });
      }
      const taken = await User.findOne({ username: normalized, _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ success: false, message: 'Этот юзернейн уже занят' });
      }
      user.username = normalized;
      if (displayName !== undefined) user.displayName = String(displayName).trim();
    }

    if (typeof showUsername === 'boolean') {
      user.showUsername = showUsername;
    }

    if (color !== undefined && color !== null && String(color).trim().length > 0) {
      const normalizedColor = String(color).trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(normalizedColor)) {
        return res.status(400).json({ success: false, message: 'Некорректный формат цвета' });
      }
      user.color = normalizedColor;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Пользователь обновлён',
      user: normalizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Удалить пользователя (c каскадным удалением постов и сообщений)
// @route   DELETE /api/users/:id
// @access  Moderator
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    await Post.deleteMany({ author: user._id });
    await Message.deleteMany({ sender: user._id });
    await user.deleteOne();

    console.log(`✅ Удалён пользователь: ${user.email}`);

    res.status(200).json({ success: true, message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Сменить пароль пользователя (модератором)
// @route   PUT /api/users/:id/password
// @access  Moderator
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Пароль должен быть не короче 6 символов' });
    }
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    user.password = String(password);
    await user.save();
    res.status(200).json({ success: true, message: 'Пароль обновлён' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Список заявок на сброс пароля
// @route   GET /api/users/reset-requests
// @access  Moderator
exports.getResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({})
      .populate('user', '_id email username displayName color moderator')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((r) => ({
        id: r._id,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
        handledBy: r.handledBy ? String(r.handledBy) : null,
        user: r.user ? {
          id: r.user._id,
          email: r.user.email,
          username: r.user.username,
          displayName: r.user.displayName,
          color: r.user.color,
          moderator: r.user.moderator === true
        } : null
      }))
    });
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Отметить заявку выполненной
// @route   PUT /api/users/reset-requests/:id
// @access  Moderator
exports.markResetRequestDone = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Заявка не найдена' });
    }
    request.status = 'done';
    request.handledBy = req.user?.id || null;
    await request.save();

    res.status(200).json({ success: true, message: 'Заявка обработана' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

