import { useEffect, useState } from 'react'
import useProjectsStore from '../store/projectsStore'
import ProjectCard from './ProjectCard'
import ProjectForm from './ProjectForm'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ProjectList = () => {
  const [message, setMessage] = useState('')
  const { projects, fetchProjects, isLoading, error, clearError } = useProjectsStore()

  useEffect(() => {
    fetchProjects()
  }, [])

  const notify = (text) => setMessage(text)

  const handleCreated = (project) => {
    notify(`Проект «${project.title}» создан`)
    setTimeout(() => notify(''), 2500)
  }

  if (isLoading) {
    return (
      <div className="app-loading app-loading--inline" style={{ padding: '20px' }}>
        <div className="app-loading__spinner" />
        <div className="app-loading__text">Загрузка проектов…</div>
      </div>
    )
  }

  if (error) {
    return <div className="project-list__error">{error}</div>
  }

  return (
    <div className="project-list">
      {message && <div className="project-list__message">{message}</div>}
      {projects.length === 0 ? (
        <div className="project-list__empty">Пока нет проектов. Создайте первый!</div>
      ) : (
        <div className="project-list__grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectList
