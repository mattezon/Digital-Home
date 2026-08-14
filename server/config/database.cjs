const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB подключена: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`⚠️ Ошибка подключения к MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;