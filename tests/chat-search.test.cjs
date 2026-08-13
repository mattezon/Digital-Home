const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeChatQuery, matchChatSearch } = require('../server/utils/chatSearch.cjs');

test('normalizeChatQuery detects username and id patterns', () => {
  assert.deepEqual(normalizeChatQuery('@alice'), { type: 'user', value: 'alice' });
  assert.deepEqual(normalizeChatQuery('#123'), { type: 'userId', value: '123' });
  assert.deepEqual(normalizeChatQuery('hello world'), { type: 'text', value: 'hello world' });
});

test('matchChatSearch prefers new user target when telegram-style query is used', () => {
  const existingChats = [
    { id: 'chat-1', type: 'direct', title: 'alice', members: ['u1', 'u2'] },
    { id: 'chat-2', type: 'group', title: 'Family', members: ['u1', 'u3'] }
  ];

  const result = matchChatSearch('@alice', existingChats, 'u1');
  assert.ok(result.isMatch);
  assert.equal(result.reason, 'user');
});
