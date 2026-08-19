import useAuthStore from '../store/authStore'
import './Sidebar.css'

const Sidebar = ({ activeTab, onChangeTab, theme, toggleTheme }) => {
  const { user } = useAuthStore()
  const isModerator = user?.moderator === true

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">digital home <span className="sidebar__version">v1.1</span></div>
      <nav className="sidebar__nav">
        <a
          className={`sidebar__nav-link ${activeTab === 'feed' ? 'active' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onChangeTab('feed')
          }}
        >
          Лента
        </a>
                <a
          className={`sidebar__nav-link ${activeTab === 'messages' ? 'active' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onChangeTab('messages')
          }}
        >
          Сообщения
        </a>
        <a
          className={`sidebar__nav-link ${activeTab === 'projects' ? 'active' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onChangeTab('projects')
          }}
        >
          Проекты
        </a>
        <a
          className={`sidebar__nav-link ${activeTab === 'profile' ? 'active' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onChangeTab('profile')
          }}
        >
          Профиль
        </a>
        {isModerator && (
          <a
            className={`sidebar__nav-link ${activeTab === 'admin' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onChangeTab('admin')
            }}
          >
            Админ
          </a>
        )}
      </nav>
      <button
        className="sidebar__theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </aside>
  )
}

export default Sidebar
