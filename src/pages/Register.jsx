import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createUserProfile } from '../lib/firestoreUsers'
import { validatePhone } from '../lib/validatePhone'
import TrailLoading from '../components/TrailLoading'
import AuthPasswordInput from '../components/AuthPasswordInput'
import './Auth.css'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register: firebaseRegister, refreshProfile } = useAuth()
  const navigate = useNavigate()

  function goToDriverForm() {
    const phoneCheck = validatePhone(telefono)
    if (!phoneCheck.valid) {
      setError(phoneCheck.message)
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError('')
    navigate('/registro-conductor', {
      state: {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono: phoneCheck.normalized,
        password,
      },
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    const phoneCheck = validatePhone(telefono)
    if (!phoneCheck.valid) {
      setError(phoneCheck.message)
      return
    }
    setSubmitting(true)
    try {
      const { user } = await firebaseRegister(email.trim(), password, role)
      await createUserProfile(user.uid, {
        email: email.trim(),
        role: 'client',
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        telefono: phoneCheck.normalized,
      })
      await refreshProfile(user.uid)
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Ese correo ya está registrado.'
          : err.code === 'auth/invalid-email'
            ? 'Correo no válido.'
            : err.code === 'auth/weak-password'
              ? 'Usa una contraseña más segura (mín. 6 caracteres).'
              : err.message || 'Error al registrarse.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      {submitting && <TrailLoading />}
      <div className="auth-card auth-card--wide">
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Viajes Hueypoxtla</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-label">
            Registrarme como
            <select
              className="auth-input auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="client">Cliente</option>
              <option value="driver">Conductor</option>
            </select>
          </label>

          <label className="auth-label">
            Nombre
            <input
              type="text"
              className="auth-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              required
            />
          </label>

          <label className="auth-label">
            Apellidos
            <input
              type="text"
              className="auth-input"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Tus apellidos"
              autoComplete="family-name"
              required
            />
          </label>

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
            Teléfono (10 dígitos)
            <input
              type="tel"
              className="auth-input"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="55 1234 5678"
              autoComplete="tel"
              required
            />
          </label>

          <label className="auth-label">
            Contraseña
            <AuthPasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <label className="auth-label">
            Confirmar contraseña
            <AuthPasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
            />
          </label>

          {role === 'client' && (
            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Registrarse'}
            </button>
          )}

          {role === 'driver' && (
            <button
              type="button"
              className="auth-submit"
              onClick={goToDriverForm}
              disabled={submitting}
            >
              Siguiente: datos del auto y licencia
            </button>
          )}
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
