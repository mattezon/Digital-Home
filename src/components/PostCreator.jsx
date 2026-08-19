import { useState } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import PollForm from './PollForm'
import './PostCreator.css'

const PostCreator = () => {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPoll, setShowPoll] = useState(false)
  const { createPost } = usePostsStore()
  const { user } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || !user?.id) return

    setIsLoading(true)
    const result = await createPost(text)
    setIsLoading(false)
    if (result.success) {
      setText('')
    }
  }

  const handlePollCreated = () => {
    setShowPoll(false)
  }

  return (
    <div className="post-creator-wrapper">
      {!showPoll ? (
        <form className="post-creator" onSubmit={handleSubmit}>
          <input
            className="post-creator__input"
            placeholder="Что нового?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="post-creator__toggle post-creator__toggle--poll"
            onClick={() => setShowPoll(true)}
            aria-label="Создать опрос"
            title="Создать опрос"
          >
            📊
          </button>
          <button
            className="post-creator__btn"
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </form>
      ) : (
        <div className="post-creator__poll-mode">
          <div className="post-creator__poll-header">
            <span>Создание опроса</span>
            <button
              type="button"
              className="post-creator__close-poll"
              onClick={() => setShowPoll(false)}
              title="Закрыть"
            >
              ✕
            </button>
          </div>
          <PollForm onCreated={handlePollCreated} />
        </div>
      )}
    </div>
  )
}

export default PostCreator
