import './DestinationBar.css'

export default function DestinationBar({ value, onChange, placeholder = '¿Adónde vas?', onClick }) {
  const displayValue = value?.trim() || ''
  const showPlaceholder = !displayValue

  if (onClick) {
    return (
      <button
        type="button"
        className="destination-bar destination-bar--clickable"
        onClick={onClick}
        aria-label="Elegir origen y destino"
      >
        <span className="destination-bar-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <span className={`destination-bar-input ${showPlaceholder ? 'destination-bar-input--placeholder' : ''}`}>
          {showPlaceholder ? placeholder : displayValue}
        </span>
        <div className="destination-bar-now">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Ahora</span>
        </div>
      </button>
    )
  }

  return (
    <div className="destination-bar">
      <span className="destination-bar-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="text"
        className="destination-bar-input"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label="Destino o dirección de llegada"
      />
      <div className="destination-bar-now">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Ahora</span>
      </div>
    </div>
  )
}
