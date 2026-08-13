import { useEffect, useState } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import PostCard from '../components/PostCard'
import { getAuthorDisplayName } from '../utils/userName'
import './Profile.css'

const Profile = () => {
  const { user, logout, updateProfile } = useAuthStore()
  const { posts, fetchPosts, deletePost, isLoading } = usePostsStore()
  const [username, setUsername] = useState('')
  const [showUsername, setShowUsername] = useState(user?.showUsername ?? true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setShowUsername(user.showUsername ?? true)
    }
  }, [user?.username, user?.showUsername])

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

          {feedback && <p className="profile-card__form-message">{feedback}</p>}
        </form>
      </section>

      <section className="profile-posts">
        <h2>Ваши посты</h2>
        {isLoading && <p>Загрузка постов...</p>}
        {!isLoading && userPosts.length === 0 && (
          <p>У вас ещё нет постов. Создайте первый в ленте.</p>
        )}
        {!isLoading && userPosts.map(post => (
          <PostCard
            key={post._id}
            post={{
              ...post,
              avatar: '👤',
              author: getAuthorDisplayName(post.author)
            }}
            isOwner={true}
            onDelete={() => deletePost(post._id)}
          />
        ))}
      </section>
    </main>
  )
}

export default Profile
