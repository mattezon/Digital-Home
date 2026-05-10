const jwt = require('jsonwebtoken')
const User = require('../models/User.cjs')

const protect = async (req, res, next) => {
  let token

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Не авторизован'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digital-home-secret')
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      })
    }

    req.user = { id: user._id.toString(), email: user.email }
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Неверный токен авторизации'
    })
  }
}

module.exports = protect
