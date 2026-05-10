import './Sidebar.css'

const Sidebar = ({ activeTab, onChangeTab }) => (
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
        className={`sidebar__nav-link ${activeTab === 'profile' ? 'active' : ''}`}
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onChangeTab('profile')
        }}
      >
        Профиль
      </a>
    </nav>
  </aside>
)

export default Sidebar
