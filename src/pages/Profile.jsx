import { useEffect, useState } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import PostCard from '../components/PostCard'
import { getAuthorDisplayName } from '../utils/userName'
import './Profile.css'

const PRESET_COLORS = [
  '#2f5dff', // синий (по умолчанию)
  '#4f46e5', // индиго
  '#7c3aed', // фиолетовый
  '#db2777', // розовый
  '#dc2626', // красный
  '#ea580c', // оранжевый
  '#d97706', // янтарный
  '#059669', // зелёный
  '#0d9488', // бирюзовый
  '#0891b2'  // голубой
]

const Profile = () => {
  const { user, logout, updateProfile } = useAuthStore()
  const { posts, fetchPosts, deletePost, isLoading } = usePostsStore()
  const [username, setUsername] = useState('')
  const [showUsername, setShowUsername] = useState(user?.showUsername ?? true)
  const [color, setColor] = useState(user?.color || PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setShowUsername(user.showUsername ?? true)
      setColor(user.color || PRESET_COLORS[0])
    }
  }, [user?.username, user?.showUsername, user?.color])

  const handleSaveUsername = async (event) => {
    event.preventDefault()
    if (!username.trim() || saving) return

    setSaving(true)
    setFeedback('')
    const result = await updateProfile({ username: username.trim() })
    setSaving(false)

    if (result.success) {
      setFeedback(`Юзернейм сохранён. Теперь вас можно найти в поиске сообщений как @${username.trim().toLowerCase()}`)
    } else {
      setFeedback(result.message || 'Не удалось сохранить юзернейм')
    }
  }

  const handleToggleShowUsername = async (checked) => {
    setFeedback('')
    const result = await updateProfile({ showUsername: checked })

    if (result.success) {
      setShowUsername(checked)
      setFeedback(checked
        ? 'Теперь другие видят ваш юзернейм вместо почты'
        : 'Теперь другие видят вашу почту вместо юзернейма')
    } else {
      setShowUsername(!checked)
      setFeedback(result.message || 'Не удалось сохранить настройку')
    }
  }

  const handleColorChange = async (value) => {
    setColor(value)
    setFeedback('')
    const result = await updateProfile({ color: value })

    if (result.success) {
      setFeedback('Цвет сохранён. Другие увидят его на ваших постах и в сообщениях.')
    } else {
      setColor(user?.color || PRESET_COLORS[0])
      setFeedback(result.message || 'Не удалось сохранить цвет')
    }
  }

  const userPosts = posts.filter(post => post.author?._id === user?.id)

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Профиль недоступен</h2>
          <p>Сначала выполните вход.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-card__header">
          <h1>Профиль</h1>
          <button className="profile-card__logout" onClick={logout}>
            Выйти
          </button>
        </div>
        <div className="profile-card__info">
          <p>
            <strong>Почта:</strong> {user.email}
          </p>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Постов:</strong> {userPosts.length}
          </p>
        </div>

        <form className="profile-card__form" onSubmit={handleSaveUsername}>
          <label className="profile-card__label" htmlFor="profile-username">
            Юзернейм — по нему вас будут искать в сообщениях
          </label>
          <div className="profile-card__field">
            <span className="profile-card__at">@</span>
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your_username"
              minLength={3}
              maxLength={20}
              required
            />
            <button type="submit" className="profile-card__save" disabled={saving || !username.trim()}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          <small className="profile-card__hint">
            Только латинские буквы, цифры и символы _ . - · от 3 до 20 символов
          </small>

          <label className="profile-card__toggle">
            <input
              type="checkbox"
              checked={showUsername}
              onChange={(event) => handleToggleShowUsername(event.target.checked)}
            />
            <span>Показывать мой юзернейм вместо почты на постах и в сообщениях</span>
          </label>

          <div className="profile-card__color">
            <span className="profile-card__label">Ваш цвет</span>
            <div className="profile-card__color-palette">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`profile-card__swatch ${color === presetColor ? 'active' : ''}`}
                  style={{ background: presetColor }}
                  aria-label={`Цвет ${presetColor}`}
                  onClick={() => handleColorChange(presetColor)}
                />
              ))}
              <label className="profile-card__custom">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => handleColorChange(event.target.value)}
                />
                <span>Свой</span>
              </label>
            </div>
            <small className="profile-card__hint">
              Этот цвет увидят другие: он появится на обводке ваших постов и в ваших сообщениях в чатах.
            </small>
          </div>

          {feedback && <p className="profile-card__form-message">{feedback}</p>}
        </form>
      </section>

      <section className="profile-posts">
        <h2>Ваши посты</h2>
        {isLoading && (
          <div className="app-loading app-loading--inline">
            <div className="app-loading__spinner" />
            <div className="app-loading__text">Загрузка постов...</div>
          </div>
        )}
        {!isLoading && userPosts.length === 0 && (
          <p>У вас ещё нет постов. Создайте первый в ленте.</p>
        )}
        {!isLoading && userPosts.map(post => {
          const rawAuthor = post.author
          return (
            <PostCard
              key={post._id}
              post={{
                ...post,
                avatar: '👤',
                author: getAuthorDisplayName(rawAuthor)
              }}
              accentColor={rawAuthor?.color}
              isOwner={true}
              onDelete={() => deletePost(post._id)}
            />
          )
        })}
      </section>
    </main>
  )
}

export default Profile
