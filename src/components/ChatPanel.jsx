import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'
import './ChatPanel.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ChatPanel = () => {
  const { user } = useAuthStore()
  const socketRef = useRef(null)
  const [chats, setChats] = useState([])
  const [messagesByChat, setMessagesByChat] = useState({})
  const [search, setSearch] = useState('')
  const [results, setResults] = useState({ users: [], chats: [], combined: [] })
  const [activeChatId, setActiveChatId] = useState(null)
  const [draft, setDraft] = useState('')
  const [connected, setConnected] = useState(false)
  const [groupBuilderOpen, setGroupBuilderOpen] = useState(false)
  const [groupTitle, setGroupTitle] = useState('')
  const [groupMembers, setGroupMembers] = useState([])

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [activeChatId, chats]
  )

  const activeMessages = useMemo(
    () => (activeChatId ? (messagesByChat[activeChatId] || []) : []),
    [activeChatId, messagesByChat]
  )

  const getLastMessagePreview = (chat) => {
    const chatMessages = messagesByChat[chat.id] || []
    if (!chatMessages.length) return 'Пока нет сообщений'

    const lastFromMe = [...chatMessages].reverse().find((message) => message.sender?.id === user?.id)
    const lastMessage = lastFromMe || [...chatMessages].reverse()[0]
    const author = lastMessage.sender?.displayName || lastMessage.sender?.username || 'User'
    const text = lastMessage.text || 'Файл'

    return lastMessage.sender?.id === user?.id ? `Вы: ${text}` : `${author}: ${text}`
  }

  const refreshChats = async () => {
    try {
      const response = await axios.get('/api/chats')
      if (response.data.success) {
        const nextChats = response.data.chats || []
        setChats(nextChats)

        if (!activeChatId && nextChats.length) {
          setActiveChatId(nextChats[0].id)
        }
      }
    } catch (error) {
      console.warn('Не удалось загрузить чаты', error)
    }
  }

  const appendMessageToChat = (chatId, message) => {
    setMessagesByChat((prev) => {
      const current = prev[chatId] || []
      const exists = current.some((item) => item.id === message.id)
      if (exists) return prev

      return {
        ...prev,
        [chatId]: [...current, message]
      }
    })
  }

  const loadMessages = async (chatId, replace = true) => {
    if (!chatId) return

    try {
      const response = await axios.get(`/api/chats/${chatId}/messages`)
      if (response.data.success) {
        const nextMessages = response.data.messages || []
        setMessagesByChat((prev) => ({
          ...prev,
          [chatId]: nextMessages
        }))

        if (replace && activeChatId === chatId) {
          // no-op, kept for explicit use
        }
      }
    } catch (error) {
      console.warn('Не удалось загрузить сообщения', error)
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: []
      }))
    }
  }

  const searchUsersAndChats = async (value) => {
    const query = value.trim()
    if (!query) {
      setResults({ users: [], chats: [], combined: [] })
      return
    }

    try {
      const response = await axios.get('/api/chats/search', { params: { q: query } })
      if (response.data.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.warn('Ошибка поиска чатов', error)
    }
  }

  const openChatByResult = async (result) => {
    if (!result) return

    if (groupBuilderOpen && result.type === 'user') {
      setGroupMembers((prev) => {
        const exists = prev.some((memberId) => memberId === result.id)
        return exists ? prev.filter((memberId) => memberId !== result.id) : [...prev, result.id]
      })
      return
    }

    if (result.type === 'user') {
      const response = await axios.post('/api/chats/direct', { userId: result.id })
      if (response.data.success) {
        await refreshChats()
        setActiveChatId(response.data.chat.id)
        setSearch('')
        setResults({ users: [], chats: [], combined: [] })
      }
      return
    }

    if (result.type === 'chat' || result.id) {
      setActiveChatId(result.id)
      setSearch('')
      setResults({ users: [], chats: [], combined: [] })
    }
  }

  const createGroupChat = async () => {
    if (!groupTitle.trim() || groupMembers.length === 0) return

    try {
      const response = await axios.post('/api/chats/group', {
        title: groupTitle.trim(),
        participantIds: groupMembers
      })

      if (response.data.success) {
        await refreshChats()
        setActiveChatId(response.data.chat.id)
        setGroupBuilderOpen(false)
        setGroupTitle('')
        setGroupMembers([])
        setSearch('')
        setResults({ users: [], chats: [], combined: [] })
      }
    } catch (error) {
      console.warn('Ошибка создания группы', error)
    }
  }

  const sendMessage = async () => {
    if (!draft.trim() || !activeChatId) return

    const text = draft.trim()
    setDraft('')

    try {
      const response = await axios.post(`/api/chats/${activeChatId}/messages`, {
        text
      })

      if (response.data.success) {
        // Сообщение придет через socket событие 'chat:message'
        // Не добавляем его локально
      }
    } catch (error) {
      console.warn('Ошибка отправки сообщения', error)
    }
  }

  useEffect(() => {
    if (!user) return

    refreshChats()

    const socket = io(API_BASE, {
      transports: ['websocket'],
      reconnection: true
    })

    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('chat:message', (payload) => {
      if (!payload || !payload.chatId) return

      const incomingMessage = {
        id: payload.id,
        text: payload.text,
        sender: payload.sender || { id: payload.userId || 'server', username: 'server' },
        createdAt: payload.createdAt || new Date().toISOString()
      }

      appendMessageToChat(payload.chatId, incomingMessage)
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (!activeChatId) return
    socketRef.current?.emit('join-room', activeChatId)
    loadMessages(activeChatId, true)
  }, [activeChatId])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsersAndChats(search)
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  const chatTitle = activeChat ? activeChat.title : 'Выберите чат'

  return (
    <section className="chat-panel messenger-shell">
      <div className="chat-panel__toolbar-row">
        <div className="chat-panel__toolbar-search">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск: @username, #id или название чата"
          />

          {search && (
            <div className="chat-panel__search-results">
              {results.combined.length === 0 ? (
                <p className="chat-panel__empty">Ничего не найдено.</p>
              ) : (
                results.combined.map((result) => (
                  <button
                    key={result.type === 'user' ? `user-${result.id}` : `chat-${result.id}`}
                    type="button"
                    className="chat-panel__result"
                    onClick={() => openChatByResult(result)}
                  >
                    <strong>{result.name || result.username || result.email || 'Чат'}</strong>
                    <small>
                      {result.type === 'user'
                        ? `@${result.username || result.email?.split('@')[0]} · ${result.searchId || '#id'}`
                        : `чат · ${result.type}`}
                    </small>
                    {groupBuilderOpen && result.type === 'user' && (
                      <span className="chat-panel__select-hint">
                        {groupMembers.includes(result.id) ? 'Убрано из группы' : 'Добавить в группу'}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button type="button" className="chat-panel__group-button" onClick={() => setGroupBuilderOpen((prev) => !prev)}>
          {groupBuilderOpen ? 'Закрыть' : 'Новая группа'}
        </button>
      </div>

      {groupBuilderOpen && (
        <div className="chat-panel__group-builder">
          <input
            value={groupTitle}
            onChange={(event) => setGroupTitle(event.target.value)}
            placeholder="Название группы"
          />
          <div className="chat-panel__selected-members">
            {groupMembers.length === 0 ? (
              <span className="chat-panel__empty">Выберите участников</span>
            ) : (
              results.users
                .filter((resultUser) => groupMembers.includes(resultUser.id))
                .map((resultUser) => (
                  <button
                    key={resultUser.id}
                    type="button"
                    className="chat-panel__chip"
                    onClick={() => setGroupMembers((prev) => prev.filter((memberId) => memberId !== resultUser.id))}
                  >
                    @{resultUser.username || resultUser.email?.split('@')[0]}
                  </button>
                ))
            )}
          </div>
          <button type="button" className="chat-panel__create-group" onClick={createGroupChat} disabled={!groupTitle.trim() || groupMembers.length === 0}>
            Создать группу
          </button>
        </div>
      )}

      <div className="chat-panel__body">
        <aside className="chat-panel__sidebar">
          {chats.length === 0 ? (
            <p className="chat-panel__empty">Пока нет чатов</p>
          ) : (
            chats.map((chat) => (
              <button
                type="button"
                key={chat.id}
                className={`chat-panel__chat ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="chat-panel__chat-main">
                  <span className="chat-panel__chat-name">{chat.title || 'Чат'}</span>
                  <small className="chat-panel__chat-preview">{getLastMessagePreview(chat)}</small>
                </div>
                <span className="chat-panel__chat-badge">{chat.type === 'group' ? 'G' : 'D'}</span>
              </button>
            ))
          )}
        </aside>

        <div className="chat-panel__window">
          {!activeChat ? (
            <div className="chat-panel__empty-state">
              <h3>Сообщения</h3>
              <p>Выберите чат, чтобы начать переписку</p>
            </div>
          ) : (
            <>
              <div className="chat-panel__window-header">
                <div>
                  <strong>{chatTitle}</strong>
                  <small>{connected ? 'Онлайн' : 'Оффлайн'}</small>
                </div>
                <span className={`chat-panel__status ${connected ? 'online' : 'offline'}`}>
                  {connected ? 'online' : 'offline'}
                </span>
              </div>

              <div className="chat-panel__messages">
                {activeMessages.length === 0 ? (
                  <p className="chat-panel__empty">Начните диалог</p>
                ) : (
                  activeMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-panel__message ${message.sender?.id === user?.id ? 'self' : ''}`}
                    >
                      <span>{message.sender?.displayName || message.sender?.username || 'User'}</span>
                      <p>{message.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-panel__composer">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Написать сообщение..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') sendMessage()
                  }}
                />
                <button type="button" onClick={sendMessage} disabled={!draft.trim()}>
                  Отправить
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </section>
  )
}

export default ChatPanel
