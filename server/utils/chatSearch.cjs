const normalizeChatQuery = (rawQuery = '') => {
  const query = String(rawQuery ?? '').trim();

  if (!query) {
    return { type: 'text', value: '' };
  }

  const usernameMatch = query.match(/^@([a-zA-Z0-9_.-]+)/);
  if (usernameMatch) {
    return { type: 'user', value: usernameMatch[1].toLowerCase() };
  }

  const userIdMatch = query.match(/^#([a-zA-Z0-9]+)/);
  if (userIdMatch) {
    return { type: 'userId', value: userIdMatch[1].toLowerCase() };
  }

  return { type: 'text', value: query.toLowerCase() };
};

const getChatMembers = (chat) => {
  if (!chat) return [];
  return Array.isArray(chat.participants) ? chat.participants : Array.isArray(chat.members) ? chat.members : [];
};

const memberMatchesQuery = (member, query) => {
  if (!member) return false;

  const idText = typeof member === 'string' ? member : (member?._id ? member._id.toString() : '');
  const usernameText = typeof member === 'string'
    ? member
    : [member?.username, member?.displayName, member?.email, member?.name].filter(Boolean).join(' ');

  const haystack = `${idText} ${usernameText} ${member?.email || ''}`.toLowerCase();
  return haystack.includes(query);
};

const matchChatSearch = (rawQuery, existingChats = [], currentUserId = null) => {
  const normalized = normalizeChatQuery(rawQuery);
  const chats = Array.isArray(existingChats) ? existingChats : [];

  if (!normalized.value) {
    return { isMatch: false, reason: 'empty', normalized, matches: [] };
  }

  if (normalized.type === 'user' || normalized.type === 'userId') {
    const matches = chats.filter((chat) => {
      const title = (chat?.title || '').toLowerCase();
      const members = getChatMembers(chat);
      const hasUserMatch = members.some((member) => memberMatchesQuery(member, normalized.value));
      const byTitle = title.includes(normalized.value);

      if (currentUserId) {
        const participantIds = members.map((member) => {
          if (!member) return '';
          if (typeof member === 'string') return member;
          return member?._id ? member._id.toString() : '';
        }).filter(Boolean);
        return (hasUserMatch || byTitle) && participantIds.includes(currentUserId);
      }

      return hasUserMatch || byTitle;
    });

    return {
      isMatch: matches.length > 0,
      reason: matches.length > 0 ? 'user' : 'none',
      normalized,
      matches
    };
  }

  const matches = chats.filter((chat) => {
    const title = (chat?.title || '').toLowerCase();
    const members = getChatMembers(chat);
    const memberMatch = members.some((member) => memberMatchesQuery(member, normalized.value));

    if (currentUserId) {
      const participantIds = members.map((member) => {
        if (!member) return '';
        if (typeof member === 'string') return member;
        return member?._id ? member._id.toString() : '';
      }).filter(Boolean);

      return (title.includes(normalized.value) || memberMatch) && participantIds.includes(currentUserId);
    }

    return title.includes(normalized.value) || memberMatch;
  });

  return {
    isMatch: matches.length > 0,
    reason: matches.length > 0 ? 'chat' : 'none',
    normalized,
    matches
  };
};

module.exports = {
  normalizeChatQuery,
  matchChatSearch
};
