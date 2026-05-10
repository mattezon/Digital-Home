const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Пожалуйста, укажите автора']
    },
    text: {
      type: String,
      required: [true, 'Пожалуйста, укажите текст поста'],
      maxlength: [500, 'Текст не может быть длиннее 500 символов']
    },
    likes: {
      type: Number,
      default: 0
    },
    reactions: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 }
    },
    userReactions: {
      type: Map,
      of: String,
      default: new Map()
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: null
    },
    verified: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
