import useAuthStore from '../store/authStore'
import './Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuthStore()

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Личный кабинет</h1>
        <button onClick={logout} className="button button--secondary">
          Выйти
        </button>
      </header>

      <section className="dashboard__content">
        <div className="dashboard__card">
          <h2>Добро пожаловать!</h2>
          <p>Вы успешно вошли в систему.</p>
          <p className="dashboard__user-email">
            Ваш email: <strong>{user?.email}</strong>
          </p>
        </div>

        <div className="dashboard__placeholder">
          <p>Здесь будет основной функционал приложения</p>
          <p className="dashboard__coming-soon">Скоро...</p>
        </div>
      </section>
    </main>
  )
}

export default Dashboard