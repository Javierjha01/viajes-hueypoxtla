import { useState } from 'react'
import DriverBottomNav from './DriverBottomNav'
import DriverInicioView from './DriverInicioView'
import DriverActividadView from './DriverActividadView'
import CuentaView from '../client/CuentaView'
import './DriverHome.css'

export default function DriverHome({ displayName, profile, onSignOut, driverId }) {
  const [activeTab, setActiveTab] = useState('inicio')

  return (
    <div className="driver-home">
      <header className="driver-home-header">
        <h1 className="driver-home-title">Viajes Hueypoxtla</h1>
        <span className="driver-home-user">Hola, {displayName}</span>
      </header>

      <div className="driver-home-content">
        {activeTab === 'inicio' && <DriverInicioView driverId={driverId} />}
        {activeTab === 'actividad' && <DriverActividadView driverId={driverId} />}
        {activeTab === 'cuenta' && (
          <CuentaView
            displayName={displayName}
            profile={profile}
            onSignOut={onSignOut}
          />
        )}
      </div>

      <DriverBottomNav activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  )
}
