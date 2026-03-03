import './HomeBanners.css'

const BANNERS = [
  {
    id: 'reserva',
    title: 'Reserva un viaje',
    description: 'Programa con anticipación y viaja sin prisa.',
    accent: 'primary',
  },
  {
    id: 'comunidad',
    title: 'Servicio en Hueypoxtla',
    description: 'Conductores de tu comunidad, seguros y confiables.',
    accent: 'secondary',
  },
]

export default function HomeBanners() {
  return (
    <section className="home-banners" aria-label="Opciones de viaje">
      <h2 className="home-banners-title">Cómo planificar tu viaje</h2>
      <div className="home-banners-grid">
        {BANNERS.map((b) => (
          <article key={b.id} className={`home-banner-card home-banner--${b.accent}`}>
            <div className="home-banner-content">
              <h3 className="home-banner-title">{b.title}</h3>
              <p className="home-banner-desc">{b.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
