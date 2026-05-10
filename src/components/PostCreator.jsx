import { useState } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import './PostCreator.css'

const PostCreator = () => {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { createPost } = usePostsStore()
  const { user } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || !user?.id) return

    setIsLoading(true)
    const result = await createPost(text)
    
    if (result.success) {
      setText('')
    }
    setIsLoading(false)
  }

  return (
    <form className="post-creator" onSubmit={handleSubmit}>
      <input 
        className="post-creator__input" 
        placeholder="Что нового?" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <button 
        className="post-creator__btn" 
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? 'Публикация...' : 'Опубликовать'}
      </button>
    </form>
  )
}

export default PostCreator
