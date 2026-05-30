const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database.cjs');

// Загрузить переменные окружения
dotenv.config();

// Подключение к MongoDB и запуск сервера
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB подключена\n');

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://digital-home.onrender.com';
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', FRONTEND_URL];
    const origin = (originValue, callback) => {
      if (!originValue || allowedOrigins.includes(originValue)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };

    const app = express();

    app.use(cors({
      origin,
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Слишком много запросов. Повторите попытку позже.'
      }
    });

    // Маршруты API
    app.use('/api/auth', authLimiter, require('./routes/auth.cjs'));
    app.use('/api/posts', require('./routes/posts.cjs'));
    app.use('/api/db', require('./routes/db.cjs'));

    // Обработка 404
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Маршрут не найден'
      });
    });

    // Обработка ошибок
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    });

    // Запустить сервер
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  🚀 Сервер Digital Home запущен!           ║
║  📍 http://localhost:${PORT}                     ║
║                                            ║
║  🔐 Демо учетные данные:                  
║     Email: demo@example.com                ║
║     Пароль: password123                    ║
╚════════════════════════════════════════════╝
  `);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
};

startServer();