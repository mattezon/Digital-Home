const express = require('express');
const User = require('../models/User.cjs');
const Post = require('../models/Post.cjs');

const router = express.Router();

// @desc    Получить статистику БД
// @route   GET /api/db/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const postsCount = await Post.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        users: usersCount,
        posts: postsCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Получить всех пользователей (скрывая пароли)
// @route   GET /api/db/users?skip=0&limit=20
// @access  Public
router.get('/users', async (req, res) => {
  try {
    const filter = {};

    // Опциональная пагинация: если задан limit — работаем как «порция».
    // Без limit возвращаем всех (обратная совместимость).
    const limit = parseInt(req.query.limit, 10);
    const skip = parseInt(req.query.skip, 10);

    let query = User.find(filter, '_id email username displayName showUsername color');

    if (!Number.isNaN(limit)) {
      query = query.sort({ createdAt: -1, _id: 1 }).skip(Number.isNaN(skip) ? 0 : skip).limit(limit + 1);
    }

    const docs = await query.exec();

    let users = docs;
    let hasMore = false;
    if (!Number.isNaN(limit)) {
      hasMore = docs.length > limit;
      users = hasMore ? docs.slice(0, limit) : docs;
    }

    res.status(200).json({
      success: true,
      count: users.length,
      total: users.length,
      hasMore: !Number.isNaN(limit) ? hasMore : false,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Получить все посты
// @route   GET /api/db/posts
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', '_id email username displayName showUsername color')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
