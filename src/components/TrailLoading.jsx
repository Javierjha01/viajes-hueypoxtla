import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import './TrailLoading.css'

/**
 * Overlay de carga a pantalla completa con animación Lottie.
 * Busca el JSON en /trail-loading.json (colócalo en la raíz pública del proyecto).
 */
export default function TrailLoading() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/trailloading.json',
    })

    return () => {
      anim.destroy()
    }
  }, [])

  return (
    <div className="trail-loading-overlay" role="status" aria-label="Cargando">
      <div className="trail-loading-backdrop" />
      <div className="trail-loading-content">
        <div ref={containerRef} className="trail-loading-animation" />
      </div>
    </div>
  )
}

