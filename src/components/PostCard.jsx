import { useState, useEffect } from 'react'
import usePostsStore from '../store/postsStore'
import useAuthStore from '../store/authStore'
import { getAuthorDisplayName } from '../utils/userName'
import './PostCard.css'

const reactionIcons = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡'
}

const PostCard = ({ post, isOwner, onDelete }) => {
  const { user } = useAuthStore()
  const { commentsByPost, fetchComments, createComment, deleteComment, reactToPost, getUserReaction, userReactions } = usePostsStore()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isCommentLoading, setIsCommentLoading] = useState(false)

  const createdAt = post.time || (post.createdAt ? new Date(post.createdAt).toLocaleString() : '')
  const comments = commentsByPost[post._id] || []
  const userReaction = userReactions[post._id]

  useEffect(() => {
    if (user?.id) {
      getUserReaction(post._id)
    }
  }, [post._id, user?.id, getUserReaction])

  const handleToggleComments = async () => {
    if (!commentsOpen && comments.length === 0) {
      await fetchComments(post._id)
    }
    setCommentsOpen(!commentsOpen)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user?.id) return

    setIsCommentLoading(true)
    const result = await createComment(post._id, commentText)

    if (result.success) {
      setCommentText('')
    }
    setIsCommentLoading(false)
  }

  const handleDeleteComment = async (commentId) => {
    if (!user?.id) return
    await deleteComment(post._id, commentId)
  }

  const handleReact = async (type) => {
    if (!user?.id) return

    // Если пользователь кликает на уже активную реакцию, снимаем её
    if (userReaction === type) {
      // Для снятия реакции отправляем специальный тип 'none'
      await reactToPost(post._id, 'none')
    } else {
      await reactToPost(post._id, type)
    }
  }

  return (
    <div className="post-card">
      <div className="post-card__header">
        <div className="post-card__avatar">
          <span role="img" aria-label="avatar">{post.avatar}</span>
        </div>
        <div className="post-card__info">
          <div className="post-card__author">{post.author} <span className="post-card__verified">{post.verified && '✔️'}</span></div>
          <div className="post-card__meta">{createdAt}</div>
        </div>
      </div>
      <div className="post-card__content">
        <div className="post-card__text">{post.text}</div>
        {post.image && <img className="post-card__image" src={post.image} alt="post" />}
      </div>
      <div className="post-card__actions">
        {Object.entries(reactionIcons).map(([type, icon]) => (
          <button
            type="button"
            key={type}
            className={`post-card__reaction ${userReaction === type ? 'active' : ''}`}
            onClick={() => handleReact(type)}
          >
            {icon} {post.reactions?.[type] || 0}
          </button>
        ))}
        <button className="post-card__comment-toggle" type="button" onClick={handleToggleComments}>
          💬 {post.comments || 0}
        </button>
        <span className="post-card__share">↗️ {post.shares}</span>
        {isOwner && (
          <button className="post-card__delete" onClick={onDelete}>
            🗑️
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="post-card__comments">
          <form className="post-card__comment-form" onSubmit={handleSubmitComment}>
            <input
              className="post-card__comment-input"
              placeholder="Оставить комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isCommentLoading}
            />
            <button className="post-card__comment-submit" disabled={!commentText.trim() || isCommentLoading}>
              {isCommentLoading ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
          <div className="post-card__comment-list">
            {comments.length === 0 ? (
              <div className="post-card__comment-empty">Комментариев пока нет.</div>
            ) : (
              comments.map((comment) => {
                const canDeleteComment = comment.author?._id?.toString() === user?.id || isOwner
                return (
                  <div key={comment._id} className="post-card__comment-item">
                    <div className="post-card__comment-top">
                      <div className="post-card__comment-author">{getAuthorDisplayName(comment.author)}</div>
                      {canDeleteComment && (
                        <button
                          type="button"
                          className="post-card__comment-delete"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                    <div className="post-card__comment-text">{comment.text}</div>
                    <div className="post-card__comment-meta">
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
