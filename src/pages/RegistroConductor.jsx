import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { auth } from '../config/firebase'
import { createDriverProfile } from '../lib/firestoreUsers'
import { uploadDriverDocument } from '../lib/uploadDriverDocs'
import TrailLoading from '../components/TrailLoading'
import './Auth.css'

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp'

export default function RegistroConductor() {
  const location = useLocation()
  const state = location.state || {}
  const { nombre = '', apellidos = '', email = '', telefono = '', password = '' } = state

  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [placa, setPlaca] = useState('')
  const [color, setColor] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseFile, setLicenseFile] = useState(null)
  const [carDocFile, setCarDocFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  if (!email || !password) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-subtitle">Faltan datos del primer paso.</p>
          <Link to="/registro" className="auth-submit" style={{ display: 'inline-block', textAlign: 'center' }}>
            Volver al registro
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!licenseFile) {
      setError('Debes subir una foto de tu licencia.')
      return
    }
    setSubmitting(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      let licenseFileUrl = null
      let carDocUrl = null
      licenseFileUrl = await uploadDriverDocument(user.uid, licenseFile, 'licencia')
      if (carDocFile) {
        carDocUrl = await uploadDriverDocument(user.uid, carDocFile, 'tarjeta_circulacion')
      }
      await createDriverProfile(user.uid, {
        email,
        nombre,
        apellidos,
        telefono: telefono || undefined,
        car: { marca, modelo, placa, color },
        license: { number: licenseNumber },
        licenseFileUrl,
        carDocUrl,
      })
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Ese correo ya está registrado.'
          : err.code === 'auth/weak-password'
            ? 'Usa una contraseña más segura (mín. 6 caracteres).'
            : err.message || 'Error al completar el registro.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      {submitting && <TrailLoading />}
      <div className="auth-card auth-card--wide">
        <h1 className="auth-title">Datos del conductor</h1>
        <p className="auth-subtitle">Auto, licencia y documentación</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <fieldset className="auth-fieldset">
            <legend className="auth-legend">Datos del auto</legend>
            <label className="auth-label">
              Marca
              <input
                type="text"
                className="auth-input"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej. Nissan, Chevrolet"
                required
              />
            </label>
            <label className="auth-label">
              Modelo
              <input
                type="text"
                className="auth-input"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ej. Versa, Aveo"
                required
              />
            </label>
            <label className="auth-label">
              Placa
              <input
                type="text"
                className="auth-input"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ej. ABC-12-34"
                required
              />
            </label>
            <label className="auth-label">
              Color
              <input
                type="text"
                className="auth-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Blanco, Negro"
              />
            </label>
          </fieldset>

          <fieldset className="auth-fieldset">
            <legend className="auth-legend">Licencia de conducir</legend>
            <label className="auth-label">
              Número de licencia
              <input
                type="text"
                className="auth-input"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Número de tu licencia"
              />
            </label>
            <label className="auth-label">
              Foto de la licencia (obligatorio)
              <input
                type="file"
                className="auth-file"
                accept={ACCEPTED_IMAGES}
                onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                required
              />
              {licenseFile && (
                <span className="auth-file-name">{licenseFile.name}</span>
              )}
            </label>
          </fieldset>

          <fieldset className="auth-fieldset">
            <legend className="auth-legend">Documentación del auto (opcional)</legend>
            <label className="auth-label">
              Tarjeta de circulación o documento del auto
              <input
                type="file"
                className="auth-file"
                accept={ACCEPTED_IMAGES}
                onChange={(e) => setCarDocFile(e.target.files?.[0] || null)}
              />
              {carDocFile && (
                <span className="auth-file-name">{carDocFile.name}</span>
              )}
            </label>
          </fieldset>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Registrando…' : 'Completar registro'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/registro">Volver al registro</Link>
        </p>
      </div>
    </div>
  )
}
