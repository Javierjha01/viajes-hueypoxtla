import './ActividadView.css'

export default function ActividadView() {
  return (
    <section className="actividad-view" aria-label="Tu actividad">
      <h2 className="actividad-view-title">Actividad</h2>
      <p className="actividad-view-desc">Aquí verás tu historial de viajes y solicitudes.</p>
      <div className="actividad-view-empty">
        <span className="actividad-view-empty-icon" aria-hidden>📋</span>
        <p>No hay actividad reciente</p>
      </div>
    </section>
  )
}
