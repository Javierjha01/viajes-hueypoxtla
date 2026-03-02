import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

export default function Home() {
  const { profile, role, displayName, signOut } = useAuth()
  const navigate = useNavigate()

  const roleLabel = {
    admin: 'Administrador',
    client: 'Cliente',
    driver: 'Conductor',
  }[role] || 'Usuario'

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Viajes Hueypoxtla</h1>
        <button type="button" className="home-logout" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </header>
      <main className="home-main">
        <p className="home-welcome">
          Bienvenido, <strong>{displayName}</strong>
        </p>
        <p className="home-role">Rol: {roleLabel}</p>
        {profile && (
          <p className="home-hint">
            Aquí irá el contenido según tu rol (solicitar viaje, aceptar viajes, panel admin).
          </p>
        )}
      </main>
    </div>
  )
}
