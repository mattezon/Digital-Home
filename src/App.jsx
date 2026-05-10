import useAuthStore from './store/authStore'
import LoginForm from './components/LoginForm'
import Dashboard from './pages/Dashboard'
import './App.css'
import MainPage from './pages/MainPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  // Для показа главной страницы всегда (демо)
  return (
    <div className="app">
      {isAuthenticated ? <MainPage /> : <LoginForm />}
    </div>
  )
}

export default App