import { useState } from 'react'
import './RatingModal.css'

export default function RatingModal({ title, onSubmit, onSkip }) {
  const [score, setScore] = useState(0)
  const [hover, setHover] = useState(0)
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (score < 1) return
    setSending(true)
    try {
      await onSubmit(score)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rating-modal" role="dialog" aria-modal="true" aria-label="Calificar">
      <div className="rating-modal-backdrop" aria-hidden />
      <div className="rating-modal-content">
        <h2 className="rating-modal-title">{title}</h2>
        <div className="rating-modal-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`rating-modal-star ${(hover || score) >= n ? 'rating-modal-star-on' : ''}`}
              onClick={() => setScore(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="rating-modal-hint">Elige de 1 a 5 estrellas</p>
        <div className="rating-modal-actions">
          {onSkip && (
            <button type="button" className="rating-modal-btn rating-modal-btn-skip" onClick={onSkip}>
              Omitir
            </button>
          )}
          <button
            type="button"
            className="rating-modal-btn rating-modal-btn-submit"
            onClick={handleSubmit}
            disabled={score < 1 || sending}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
