import { useNavigate } from 'react-router-dom'
import './CuentaView.css'

export default function CuentaView({ displayName, profile, onSignOut }) {
  const navigate = useNavigate()

  function handleSignOut() {
    onSignOut?.()
    navigate('/login', { replace: true })
  }

  const email = profile?.email ?? ''

  return (
    <section className="cuenta-view" aria-label="Cuenta">
      <h2 className="cuenta-view-title">Cuenta</h2>
      <div className="cuenta-view-card">
        <div className="cuenta-view-avatar" aria-hidden>
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <p className="cuenta-view-name">{displayName || 'Usuario'}</p>
        {email && <p className="cuenta-view-email">{email}</p>}
      </div>
      <button type="button" className="cuenta-view-logout" onClick={handleSignOut}>
        Cerrar sesión
      </button>
    </section>
  )
}
