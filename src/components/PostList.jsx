import { useEffect } from 'react'
import PostCard from './PostCard'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import { getAuthorDisplayName } from '../utils/userName'

const PostList = () => {
  const { posts, fetchPosts, isLoading, deletePost } = usePostsStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchPosts()
  }, [])

  if (isLoading) {
    return (
      <div className="app-loading app-loading--inline">
        <div className="app-loading__spinner" />
        <div className="app-loading__text">Загрузка постов...</div>
      </div>
    )
  }

  if (posts.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Пока нет постов. Будьте первыми!</div>
  }

  return (
    <div>
      {posts.map((post) => {
        const isOwner = post.author?._id?.toString() === user?.id
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
            isOwner={isOwner}
            onDelete={isOwner ? () => deletePost(post._id) : undefined}
          />
        )
      })}
    </div>
  )
}

export default PostList
