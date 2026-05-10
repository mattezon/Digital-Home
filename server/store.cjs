// Простое в памяти хранилище данных
const store = {
  users: [
    {
      _id: '1',
      email: 'demo@example.com',
      password: '$2a$10$lS8aSy5.5jXyMqLjyIgR5.T9V5Qj8.7K.5.5.5.5.5.5.5.5.5.5' // bcrypted 'password123'
    }
  ],
  posts: []
};

module.exports = store;
