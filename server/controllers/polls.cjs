const Poll = require('../models/Poll.cjs');
const User = require('../models/User.cjs');

const getUserName = (user) => {
  if (!user) return '';
  return user.username || user.displayName || (user.email ? user.email.split('@')[0] : '') || '';
};

// Привести опрос к виду для клиента
const serializePoll = (poll, currentUserId = null) => {
  const total = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);

  const now = new Date();
  const endsAt = poll.endsAt ? new Date(poll.endsAt) : null;
  const hasEnded = !!endsAt && endsAt <= now;

  let userVote = null;
  if (currentUserId && !hasEnded && poll.userChoices) {
    const v = poll.userChoices.get(currentUserId.toString());
    if (poll.allowsMultiple) {
      // Для множественного выбора — массив или значение
      userVote = v ? (Array.isArray(v) ? v : [v]) : null;
    } else {
      userVote = v !== undefined && v !== null ? Number(v) : null;
    }
  }

  return {
    id: poll._id?.toString?.() || poll.id,
    question: poll.question,
    options: (poll.options || []).map((o, i) => ({
      index: i,
      text: o.text,
      votes: o.votes || 0,
      percent: total > 0 ? Math.round(((o.votes || 0) / total) * 100) : 0
    })),
    allowsMultiple: poll.allowsMultiple === true,
    endsAt: endsAt ? endsAt.toISOString() : null,
    hasEnded,
    votersCount: (poll.voters || []).length,
    total,
    voted: !!(poll.voters || []).find(
      (v) => String(v) === String(currentUserId)
    ),
    userVote,
    creator: poll.creator
      ? {
          id: poll.creator._id?.toString?.() || poll.creator.id,
          email: poll.creator.email || '',
          username: poll.creator.username || poll.creator.email?.split('@')[0] || '',
          displayName: poll.creator.displayName || poll.creator.username || '',
          showUsername: poll.creator.showUsername ?? true,
          color: poll.creator.color || null
        }
      : null,
        createdAt: poll.createdAt,
    updatedAt: poll.updatedAt
  };
};

// @desc    Создать опрос
// @route   POST /api/polls
// @access  Private
exports.createPoll = async (req, res) => {
  try {
    const { question, options, allowsMultiple, endsAt } = req.body;
    const userId = req.user?.id;

    if (!question || !String(question).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, укажите вопрос опроса'
      });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Опрос должен содержать от 2 до 10 вариантов'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const normalizedOptions = options
      .map((o) => ({ text: String(o).trim() || 'Опция', votes: 0 }))
      .slice(0, 10);

    const data = {
      question: String(question).trim(),
      options: normalizedOptions,
      creator: user._id
    };

    if (allowsMultiple) data.allowsMultiple = true;
    if (endsAt) {
      const ends = new Date(endsAt);
      if (!isNaN(ends)) data.endsAt = ends;
    }

    const poll = await Poll.create(data);
    await poll.populate('creator', '_id email username displayName showUsername color');

    console.log(`📊 Создан опрос «${poll.question}» от ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Опрос создан',
      poll: serializePoll(poll, userId)
    });
  } catch (error) {
    console.error('Create poll error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Список всех опросов
// @route   GET /api/polls
// @access  Public
exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('creator', '_id email username displayName showUsername color')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: polls.length,
      polls: polls.map((p) => serializePoll(p, req.user?.id))
    });
  } catch (error) {
    console.error('Get polls error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Получить опрос по ID
// @route   GET /api/polls/:id
// @access  Public
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(
      'creator',
      '_id email username displayName showUsername color'
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Опрос не найден'
      });
    }

    return res.status(200).json({
      success: true,
      poll: serializePoll(poll, req.user?.id)
    });
  } catch (error) {
    console.error('Get poll error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Удалить опрос
// @route   DELETE /api/polls/:id
// @access  Private
exports.deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Опрос не найден'
      });
    }

    // Удалять может только создатель
    if (String(poll.creator) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Только создатель может удалить опрос'
      });
    }

    await Poll.findByIdAndDelete(id);
    console.log(`🗑️ Удалён опрос «${poll.question}» пользователем ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('polls:deleted', { pollId: id });
    }

    return res.status(200).json({
      success: true,
      message: 'Опрос удалён'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Проголосовать / сменить голос / снять голос
// @route   POST /api/polls/:id/vote
// @access  Private
exports.votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { option } = req.body;
    const userId = req.user?.id;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Опрос не найден'
      });
    }

    const opt = Number(option);
    if (Number.isNaN(opt) || opt < 0 || opt >= poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Недопустимый вариант ответа'
      });
    }

    // Голосование завершено
    if (poll.endsAt && new Date(poll.endsAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Голосование завершено'
      });
    }

    const key = userId.toString();
    const prev = poll.userChoices ? poll.userChoices.get(key) : undefined;

    if (poll.allowsMultiple) {
      // Множественный выбор: массив индексов выбранных вариантов
      let choices = poll.userChoices.get(key);
      if (!choices) choices = [];
      else if (!Array.isArray(choices)) choices = [choices];

      const idx = choices.indexOf(opt);
      if (idx !== -1) {
        // Убираем выбор этого варианта
        choices.splice(idx, 1);
        poll.options[opt].votes = Math.max(0, poll.options[opt].votes - 1);
      } else {
        // Добавляем выбор этого варианта
        choices.push(opt);
        poll.options[opt].votes += 1;
      }

      if (choices.length === 0) {
        poll.userChoices.delete(key);
      } else {
        poll.userChoices.set(key, choices);
      }
    } else {
      // Одиночный выбор
      // Клик по уже выбранному варианту — снимаем голос
      if (prev === opt) {
        poll.options[prev].votes = Math.max(0, poll.options[prev].votes - 1);
        poll.userChoices.delete(key);
        if (poll.voters.includes(userId)) {
          poll.voters.pull(userId);
        }
      } else {
        if (prev !== undefined && prev !== null) {
          poll.options[prev].votes = Math.max(0, poll.options[prev].votes - 1);
        }
        poll.options[opt].votes += 1;
        if (!poll.voters.includes(userId)) {
          poll.voters.push(userId);
        }
        poll.userChoices.set(key, opt);
      }
    }

    await poll.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('poll:update', serializePoll(poll, userId));
    }

    return res.status(200).json({
      success: true,
      message: 'Голос учтён',
      poll: serializePoll(poll, userId)
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

