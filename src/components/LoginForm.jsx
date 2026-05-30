import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import './LoginForm.css'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const result = await login(formData.email, formData.password)
    
    if (!result.success) {
      setError(result.message)
    }
  }

  return (
    <main className="page-shell">
      <section className="login-card">
        <div className="login-card__header">
          <h1>Вход</h1>
          <p>Пожалуйста, введите ваши данные</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-Mail</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите e-mail"
              required
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              required
            />
          </label>

          {error && <div className="error-message">{error}</div>}

          <div className="login-form__footer">
            <a className="link-muted" href="#">Забыли пароль?</a>
            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>

        <p className="register-hint">
          Еще нет аккаунта? <Link to="/register">Создать аккаунт</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginForm