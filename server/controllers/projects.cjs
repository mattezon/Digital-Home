const Project = require('../models/Project.cjs');
const User = require('../models/User.cjs');
const Chat = require('../models/Chat.cjs');
const Message = require('../models/Message.cjs');

const getUserName = (user) => {
  if (!user) return '';
  return user.username || user.displayName || (user.email ? user.email.split('@')[0] : '') || '';
};

// Привести проект к виду, удобному для клиента
const serializeProject = (project, currentUserId = null) => {
  const creator = project.creator
    ? {
        id: project.creator._id?.toString?.() || project.creator.id,
        email: project.creator.email || '',
        username: project.creator.username || project.creator.email?.split('@')[0] || '',
        displayName: project.creator.displayName || project.creator.username || '',
        showUsername: project.creator.showUsername ?? true,
        color: project.creator.color || null
      }
    : null;

  return {
    id: project._id?.toString?.() || project.id,
    title: project.title,
    description: project.description || '',
    creator,
        participants: (project.participants || []).map((p) => (p?.toString ? p.toString() : p)),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
};

// @desc    Создать новый проект
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, укажите название проекта'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

        const project = await Project.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      creator: user._id
    });

    await project.populate('creator', '_id email username displayName showUsername color');

    console.log(`✅ Создан проект «${project.title}» от ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Проект успешно создан',
      project: serializeProject(project, userId)
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Получить все проекты
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('creator', '_id email username displayName showUsername color')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects: projects.map((p) => serializeProject(p, req.user?.id))
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Откликнуться на проект («Участвовать») — создаётся/находится
//          личный чат с создателем и от имени участника отправляется сообщение.
// @route   POST /api/projects/:id/participate
// @access  Private
exports.participateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const { note } = req.body || {};

    const project = await Project.findById(id).populate(
      'creator',
      '_id email username displayName showUsername color'
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }

    const creatorId = project.creator._id.toString();

    if (creatorId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Вы — создатель проекта'
      });
    }

    // Находим или создаём личный чат между участником и создателем
    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [currentUserId, creatorId], $size: 2 }
    });

    if (!chat) {
      chat = await Chat.create({
        type: 'direct',
        title: getUserName(project.creator),
        participants: [currentUserId, creatorId],
        createdBy: currentUserId
      });
    }

    const noteTrimmed = note ? String(note).trim() : '';
    const baseText = `Хочу участвовать в проекте «${project.title}»`;
    const text = noteTrimmed ? `${baseText}\n${noteTrimmed}` : baseText;

    const message = await Message.create({
      chat: chat._id,
      sender: currentUserId,
      text
    });

    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Запоминаем участника проекта
    if (!project.participants.includes(currentUserId)) {
      project.participants.push(currentUserId);
      await project.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(chat._id.toString()).emit('chat:message', {
        id: message._id.toString(),
        text: message.text,
        sender: {
          id: currentUserId,
          email: req.user.email,
          username: req.user.username || req.user.email?.split('@')[0],
          displayName: req.user.username || req.user.email?.split('@')[0],
          showUsername: true,
          color: req.user.color || null
        },
        chatId: chat._id.toString(),
        createdAt: message.createdAt
      });
    }

    console.log(`✉️  Участие в «${project.title}»: ${req.user.email} → ${project.creator.email}`);

    return res.status(201).json({
      success: true,
      message: 'Ваше участие отправлено создателю проекта',
      chatId: chat._id.toString(),
      text
    });
  } catch (error) {
    console.error('Participate project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
