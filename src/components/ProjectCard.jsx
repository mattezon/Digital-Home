import { useState } from 'react'
import useAuthStore from '../store/authStore'
import useProjectsStore from '../store/projectsStore'
import { getAuthorDisplayName } from '../utils/userName'
import './ProjectCard.css'

const ProjectCard = ({ project }) => {
  const { user } = useAuthStore()
  const { participateProject, error, clearError } = useProjectsStore()
  const [isParticipating, setIsParticipating] = useState(false)
  const [participated, setParticipated] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const isCreator = project.creator?.id === user?.id
  const isParticipant = (project.participants || []).some((p) => String(p) === String(user?.id))

  const handleParticipate = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    const ownNote = showNote ? note.trim() : ''
    setIsParticipating(true)
    clearError()
    const res = await participateProject(project.id, ownNote)
    setIsParticipating(false)
    setShowNote(false)
    setNote('')
    if (res.success) {
      setParticipated(true)
    }
  }

  return (
    <div className="project-card">
      <div className="project-card__body">
        <div className="project-card__title">{project.title}</div>
        {project.description && <div className="project-card__desc">{project.description}</div>}
        <div className="project-card__author">
          Создатель: {getAuthorDisplayName(project.creator)}
        </div>
        <div className="project-card__meta">
          <span>👥 {project.participants?.length || 0} участник(ов)</span>
        </div>
        {error && <div className="project-card__error">{error}</div>}
      </div>

      <div className="project-card__actions">
        {isParticipant || participated ? (
          <span className="project-card__state">✅ Вы участвуете</span>
        ) : isCreator ? (
          <span className="project-card__state">— это ваш проект</span>
        ) : (
          <>
            {showNote && (
              <textarea
                className="project-card__note"
                placeholder="Комментарий для создателя (необязительно)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            )}
            <button
              className="project-card__btn project-card__btn--participate"
              onClick={handleParticipate}
              disabled={isParticipating}
            >
              {isParticipating ? 'Отправка…' : 'Участвовать'}
            </button>
            <button
              type="button"
              className="project-card__btn project-card__btn--note"
              onClick={() => setShowNote(!showNote)}
            >
              {showNote ? '✕' : '💬'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectCard
