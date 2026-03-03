import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import RegistroConductor from './pages/RegistroConductor'
import Home from './pages/Home'
import CompletarPerfil from './pages/CompletarPerfil'
import ElegirOrigenDestino from './pages/ElegirOrigenDestino'
import './App.css'

function PrivateRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="app-loading">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com')

  // Solo los usuarios de Google sin perfil se envían a Completar perfil.
  if (!profile && isGoogleUser) return <Navigate to="/completar-perfil" replace />

  return children
}

function CompleteProfileRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="app-loading">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Cargando…</div>
  if (user) return <Navigate to="/" replace />
  return children
}

/** No redirige a "/" cuando el usuario se crea a mitad del flujo (submit de conductor). */
function RegistroConductorRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const state = location.state || {}
  const hasState = Boolean(state?.email && state?.password)

  if (loading) return <div className="app-loading">Cargando…</div>
  if (hasState) return children
  if (!user) return <Navigate to="/registro" replace />
  if (profile) return <Navigate to="/" replace />
  return <Navigate to="/completar-perfil" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/registro"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/registro-conductor"
        element={
          <RegistroConductorRoute>
            <RegistroConductor />
          </RegistroConductorRoute>
        }
      />
      <Route
        path="/completar-perfil"
        element={
          <CompleteProfileRoute>
            <CompletarPerfil />
          </CompleteProfileRoute>
        }
      />
      <Route
        path="/elegir-destino"
        element={
          <PrivateRoute>
            <ElegirOrigenDestino />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
