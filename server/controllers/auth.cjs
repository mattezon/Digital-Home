const User = require('../models/User.cjs');
const jwt = require('jsonwebtoken');

const DEFAULT_ACCESS_EXPIRE = '14d';
const DEFAULT_REFRESH_EXPIRE = '30d';

const createAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'digital-home-secret',
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || DEFAULT_ACCESS_EXPIRE
    }
  );
};

const createRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'digital-home-refresh-secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || DEFAULT_REFRESH_EXPIRE
    }
  );
};

const sendRefreshToken = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

// @desc    Регистрация пользователя
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, укажите email и пароль'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Пароли не совпадают'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    const username = email.split('@')[0];
    const newUser = await User.create({ email, password, username, displayName: username });
    const token = createAccessToken(newUser._id);
    const refreshToken = createRefreshToken(newUser._id);

    sendRefreshToken(res, refreshToken);

    console.log(`✅ Зарегистрирован пользователь: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName || newUser.username
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Вход пользователя
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, укажите email и пароль'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Неправильный email или пароль'
      });
    }

    const token = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    sendRefreshToken(res, refreshToken);

    console.log(`✅ Вход пользователя: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Успешный вход',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        displayName: user.displayName || user.username || user.email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Обновление access-токена
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Нет refresh токена'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'digital-home-refresh-secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const newToken = createAccessToken(user._id);
    const newRefreshToken = createRefreshToken(user._id);

    sendRefreshToken(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        displayName: user.displayName || user.username || user.email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Неверный refresh токен'
    });
  }
};

// @desc    Выход пользователя
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth'
  });

  return res.status(200).json({
    success: true,
    message: 'Успешный выход'
  });
};

