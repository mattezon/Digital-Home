import { create } from 'zustand'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true

const getStoredToken = () => {
  try {
    return localStorage.getItem('jwtToken')
  } catch {
    return null
  }
}

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const tokenFromStorage = getStoredToken()
const userFromStorage = getStoredUser()

if (tokenFromStorage) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`
}

const useAuthStore = create((set, get) => ({
  user: userFromStorage,
  token: tokenFromStorage,
  isAuthenticated: Boolean(tokenFromStorage),
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    try {
      localStorage.setItem('jwtToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.warn('Не удалось сохранить токен в localStorage', error)
    }

    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
  },

  // Регистрация
  register: async (email, password, passwordConfirm) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        passwordConfirm
      })

      if (response.data.success) {
        get().setAuth(response.data.user, response.data.token)
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при регистрации'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  // Вход
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })

      if (response.data.success) {
        get().setAuth(response.data.user, response.data.token)
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при входе'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  refreshToken: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post('/api/auth/refresh')

      if (response.data.success) {
        get().setAuth(response.data.user, response.data.token)
        return { success: true }
      }
    } catch (error) {
      get().logout()
      return { success: false }
    } finally {
      set({ isLoading: false })
    }
  },

  // Выход
  logout: async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      // ignore
    }

    try {
      localStorage.removeItem('jwtToken')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
    } catch (error) {
      console.warn('Не удалось удалить токен из localStorage', error)
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    })
  },

  // Очистить ошибку
  clearError: () => {
    set({ error: null })
  }
}))

export default useAuthStore