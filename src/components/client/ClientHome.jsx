import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { subscribeClientActiveTrip } from '../../lib/driverTrips'
import RequestPanel from './RequestPanel'
import HomeBanners from './HomeBanners'
import BottomNav from './BottomNav'
import ServiciosGrid from './ServiciosGrid'
import ActividadView from './ActividadView'
import CuentaView from './CuentaView'
import DestinationBar from './DestinationBar'
import TripStatusStrip from './TripStatusStrip'
import './ClientHome.css'

export default function ClientHome({ displayName, profile, onSignOut, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('inicio')
  const [destino, setDestino] = useState('')
  const [tripId, setTripId] = useState(() => location.state?.tripId ?? null)
  const stateTripIdRef = useRef(location.state?.tripId)

  useEffect(() => {
    const state = location.state
    stateTripIdRef.current = state?.tripId
    if (state?.destino != null) setDestino(state.destino)
    else if (location.pathname === '/') setDestino('')
    if (state?.tripId != null) setTripId(state.tripId)
    if (state?.origen != null) {
      // Guardar origen si más adelante lo usas (ej. en RequestPanel o mapa)
    }
  }, [location.state, location.pathname])

  useEffect(() => {
    if (!user?.uid) return
    return subscribeClientActiveTrip(user.uid, (trip) => {
      if (trip) {
        setTripId(trip.id)
        stateTripIdRef.current = null
      } else if (!stateTripIdRef.current) setTripId(null)
    })
  }, [user?.uid])

  return (
    <div className="client-home">
      <header className="client-home-header">
        <h1 className="client-home-title">Viajes Hueypoxtla</h1>
        <span className="client-home-user">Hola, {displayName}</span>
      </header>

      <div className="client-home-content">
        {activeTab === 'inicio' && (
          <>
            {tripId && user?.uid && (
              <TripStatusStrip
                tripId={tripId}
                clientId={user.uid}
                onDismiss={() => setTripId(null)}
              />
            )}
            <DestinationBar
              value={destino}
              placeholder="¿Adónde vamos?"
              onClick={() => navigate('/elegir-destino', { state: { destinoActual: destino } })}
            />
            <HomeBanners />
            <RequestPanel profile={profile} />
          </>
        )}
        {activeTab === 'servicios' && (
          <ServiciosGrid onSelectService={() => setActiveTab('inicio')} />
        )}
        {activeTab === 'actividad' && <ActividadView />}
        {activeTab === 'cuenta' && (
          <CuentaView
            displayName={displayName}
            profile={profile}
            onSignOut={onSignOut}
          />
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onSelect={(id) => {
          setActiveTab(id)
          if (id === 'inicio') setDestino('')
          // No limpiar tripId al cambiar de pestaña para que siga viendo el estado del viaje
        }}
      />
    </div>
  )
}
