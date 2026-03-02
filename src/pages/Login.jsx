import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import icGoogle from '../assets/ic_google.png'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleGoogle() {
    setError('')
    setSubmitting(true)
    try {
      await loginWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/popup-closed-by-user'
          ? 'Se cerró la ventana. Intenta de nuevo.'
          : err.code === 'auth/popup-blocked'
            ? 'Permite ventanas emergentes para este sitio.'
            : err.message || 'Error al iniciar con Google.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential'
          ? 'Correo o contraseña incorrectos.'
          : err.code === 'auth/invalid-email'
            ? 'Correo no válido.'
            : err.message || 'Error al iniciar sesión.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">Viajes Hueypoxtla</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-label">
            Correo electrónico
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-label">
            Contraseña
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <img src={icGoogle} alt="" className="auth-google-icon" aria-hidden />
            Continuar con Google
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      </div>
    </div>
  )
}
