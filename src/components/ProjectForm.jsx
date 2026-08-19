import { useState } from 'react'
import useAuthStore from '../store/authStore'
import useProjectsStore from '../store/projectsStore'
import './ProjectForm.css'

const ProjectForm = ({ onCreated }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { createProject, error, clearError } = useProjectsStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !user?.id) return
    clearError()
    setIsLoading(true)
    const result = await createProject(title.trim(), description.trim())
    setIsLoading(false)
    if (result.success) {
      setTitle('')
      setDescription('')
      onCreated && onCreated(result.project)
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3 className="project-form__title">Новый проект</h3>
      <input
        className="project-form__input"
        placeholder="Название проекта"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isLoading}
        required
      />
      <textarea
        className="project-form__textarea"
        placeholder="Описание проекта (необязательно)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        rows={3}
      />
      {error && <div className="project-form__error">{error}</div>}
      <button className="project-form__btn" disabled={isLoading || !title.trim()}>
        {isLoading ? 'Публикация...' : 'Разместить'}
      </button>
    </form>
  )
}

export default ProjectForm
