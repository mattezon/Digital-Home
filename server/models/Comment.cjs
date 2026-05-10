const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Пост обязателен']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Автор обязателен']
    },
    text: {
      type: String,
      required: [true, 'Пожалуйста, укажите текст комментария'],
      maxlength: [300, 'Комментарий не может быть длиннее 300 символов']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
