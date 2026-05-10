const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const POSTS_FILE = path.join(DB_DIR, 'posts.json');

// Создать директорию db если её нет
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Инициализировать JSON файлы если они не существуют
const initDB = () => {
  if (!fs.existsSync(USERS_FILE)) {
    const initialUsers = [
      {
        _id: '1',
        email: 'demo@example.com',
        password: '$2a$10$lS8aSy5.5jXyMqLjyIgR5.T9V5Qj8.7K.5.5.5.5.5.5.5.5.5.5'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    console.log('📄 Создан файл users.json');
  }

  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
    console.log('📄 Создан файл posts.json');
  }
};

// Получить всех пользователей
const getUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения users.json:', error);
    return [];
  }
};

// Сохранить пользователей
const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('💾 users.json обновлен');
  } catch (error) {
    console.error('Ошибка сохранения users.json:', error);
  }
};

// Получить всех постов
const getPosts = () => {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения posts.json:', error);
    return [];
  }
};

// Сохранить посты
const savePosts = (posts) => {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    console.log('💾 posts.json обновлен');
  } catch (error) {
    console.error('Ошибка сохранения posts.json:', error);
  }
};

// Найти пользователя по email
const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

// Найти пользователя по ID
const findUserById = (id) => {
  const users = getUsers();
  return users.find(u => u._id === id);
};

// Найти пост по ID
const findPostById = (id) => {
  const posts = getPosts();
  return posts.find(p => p._id === id);
};

module.exports = {
  initDB,
  getUsers,
  saveUsers,
  getPosts,
  savePosts,
  findUserByEmail,
  findUserById,
  findPostById,
  USERS_FILE,
  POSTS_FILE
};
