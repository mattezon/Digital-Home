import { useState } from 'react'
import useAuthStore from '../store/authStore'
import './LoginForm.css'

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: ''
  })
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Валидация на фронте
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.passwordConfirm
    )

    if (!result.success) {
      setError(result.message)
    }
  }

  return (
    <main className="page-shell">
      <section className="login-card">
        <div className="login-card__header">
          <h1>Регистрация</h1>
          <p>Создайте новый аккаунт</p>
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
              placeholder="Введите пароль (минимум 6 символов)"
              required
            />
          </label>

          <label className="field">
            <span>Подтверждение пароля</span>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
            />
          </label>

          {error && <div className="error-message">{error}</div>}

          <div className="login-form__footer">
            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </div>
        </form>

        <p className="register-hint">
          Уже есть аккаунт? <a href="#" onClick={(e) => {
            e.preventDefault()
            onSwitchToLogin()
          }}>Войти</a>
        </p>
      </section>
    </main>
  )
}

export default RegisterForm
