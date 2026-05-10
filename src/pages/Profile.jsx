import { useEffect } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import PostCard from '../components/PostCard'
import './Profile.css'

const Profile = () => {
  const { user, logout } = useAuthStore()
  const { posts, fetchPosts, deletePost, isLoading } = usePostsStore()

  useEffect(() => {
    fetchPosts()
  }, [])

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
              author: post.author?.email || 'Вы'
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
