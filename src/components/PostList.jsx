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
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка постов...</div>
  }

  if (posts.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Пока нет постов. Будьте первыми!</div>
  }

  return (
    <div>
      {posts.map((post) => {
        const isOwner = post.author?._id?.toString() === user?.id

        return (
          <PostCard 
            key={post._id} 
            post={{
              ...post,
              avatar: '👤',
              author: getAuthorDisplayName(post.author)
            }}
            isOwner={isOwner}
            onDelete={isOwner ? () => deletePost(post._id) : undefined}
          />
        )
      })}
    </div>
  )
}

export default PostList
