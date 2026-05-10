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
// @route   GET /api/db/users
// @access  Public
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '_id email');

    res.status(200).json({
      success: true,
      count: users.length,
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
      .populate('author', '_id email')
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
