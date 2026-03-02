import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createUserProfile } from '../lib/firestoreUsers'
import './Auth.css'

/** De displayName de Google obtiene nombre y apellidos (primera palabra = nombre, resto = apellidos). */
function splitDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') return { nombre: '', apellidos: '' }
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return { nombre: '', apellidos: '' }
  if (parts.length === 1) return { nombre: parts[0], apellidos: '' }
  return {
    nombre: parts[0],
    apellidos: parts.slice(1).join(' '),
  }
}

export default function CompletarPerfil() {
  const { user, refreshProfile } = useAuth()
  const fromGoogle = useMemo(() => splitDisplayName(user?.displayName ?? ''), [user?.displayName])
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const hasNameFromGoogle = Boolean(fromGoogle.nombre)
  const finalNombre = hasNameFromGoogle ? fromGoogle.nombre : nombre.trim()
  const finalApellidos = hasNameFromGoogle ? fromGoogle.apellidos : apellidos.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    setError('')
    setSubmitting(true)
    try {
      await createUserProfile(user.uid, {
        email: user.email || '',
        role,
        nombre: finalNombre,
        apellidos: finalApellidos,
      })
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Completar perfil</h1>
        <p className="auth-subtitle">
          {hasNameFromGoogle ? 'Elige cómo usarás la aplicación' : 'Completa tus datos'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}

          {!hasNameFromGoogle && (
            <>
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
            </>
          )}
          {hasNameFromGoogle && (
            <p className="auth-hint">Entrando como <strong>{fromGoogle.nombre} {fromGoogle.apellidos}</strong></p>
          )}
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

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
