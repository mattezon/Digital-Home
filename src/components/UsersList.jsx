import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import { getAuthorDisplayName } from '../utils/userName'
import './UsersList.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const PAGE_SIZE = 20

const getInitials = (user) => {
  const name = getAuthorDisplayName(user) || ''
  if (!name || name === 'Неизвестный') {
    const login = user?.email?.split('@')?.[0] || 'U'
    return login.slice(0, 2).toUpperCase()
  }
  return name
    .split(' ')
    .map((w) => w?.[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const UsersList = () => {
  const { user: currentUser } = useAuthStore()
  const currentId = currentUser?._id ?? currentUser?.id
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const listRef = useRef(null)
  const btnRef = useRef(null)

  const fetchPage = async (offset, append) => {
    append ? setLoadingMore(true) : setLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/db/users`, {
        params: { skip: offset, limit: PAGE_SIZE }
      })
      if (data?.success) {
        const chunk = data.users || []
        setUsers((prev) => append ? [...prev, ...chunk] : chunk)
        setHasMore(Boolean(data.hasMore))
        setSkip(offset + chunk.length)
      }
    } catch (error) {
      console.warn('Не удалось загрузить пользователей:', error)
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }

  const toggle = () => {
    if (isOpen) {
      setIsOpen(false)
    } else {
      // сбрасываем состояние листа и грузим первую страницу заново
      setUsers([])
      setSkip(0)
      setHasMore(true)
      setIsOpen(true)
    }
  }
  const close = () => setIsOpen(false)

  // Загрузка первой страницы при открытии
  useEffect(() => {
    if (!isOpen) return
    if (users.length === 0) fetchPage(0, false)
  }, [isOpen, users.length])

  // ESC + клик-наружу
  useEffect(() => {
    if (!isOpen) return

    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    const onClick = (e) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        close()
      }
    }
    const onScroll = () => {
      const el = listRef.current
      if (!el || !hasMore || loadingMore) return
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight - scrollTop - clientHeight < 48) {
        fetchPage(skip, true)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    listRef.current?.addEventListener('scroll', onScroll)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
      listRef.current?.removeEventListener('scroll', onScroll)
    }
  }, [isOpen, hasMore, loadingMore, skip])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="users-list__toggle"
        aria-label="Список пользователей"
        title="Список всех пользователей"
        onClick={toggle}
      />
      {isOpen && (
        <div ref={listRef} className="users-list__popover">
          <div className="users-list__header">
            <span>Пользователи ({users.length})</span>
            <button
              type="button"
              className="users-list__close"
              aria-label="Закрыть"
              onClick={close}
            >
              ✕
            </button>
          </div>
          {loading ? (
            <div className="users-list__loading">Загрузка…</div>
          ) : users.length === 0 ? (
            <div className="users-list__empty">Пока нет пользователей</div>
          ) : (
            <ul className="users-list__items">
              {users.map((u) => {
                const name = getAuthorDisplayName(u)
                const isMe = String(u?._id) === String(currentId)
                return (
                  <li key={u._id} className="users-list__item">
                    <span
                      className="users-list__avatar"
                      style={{ '--dot': u.color || 'var(--primary)' }}
                    >
                      {getInitials(u)}
                    </span>
                    <span className="users-list__name" title={name}>
                      {name}
                    </span>
                    {isMe && <span className="users-list__you">вы</span>}
                    <span
                      className="users-list__dot"
                      style={{ backgroundColor: u.color || 'var(--primary)' }}
                      aria-hidden
                    />
                  </li>
                )
              })}
            </ul>
          )}
          {loadingMore && (
            <div className="users-list__loading-more">Дозагрузка…</div>
          )}
        </div>
      )}
    </>
  )
}

export default UsersList