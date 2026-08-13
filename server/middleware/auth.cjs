const jwt = require('jsonwebtoken')
const User = require('../models/User.cjs')

const protect = async (req, res, next) => {
  let token

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    console.warn('❌ Нет токена в запросе', {
      auth: !!authHeader,
      headers: Object.keys(req.headers),
      cookies: req.headers.cookie
    })
    return res.status(401).json({
      success: false,
      message: 'Не авторизован'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digital-home-secret')
    const user = await User.findById(decoded.id)

    if (!user) {
      console.warn('❌ Пользователь не найден по ID:', decoded.id)
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      })
    }

    req.user = { id: user._id.toString(), email: user.email }
    next()
  } catch (error) {
    console.warn('❌ Ошибка проверки токена:', error.message)
    return res.status(401).json({
      success: false,
      message: 'Неверный токен авторизации'
    })
  }
}

module.exports = protect
