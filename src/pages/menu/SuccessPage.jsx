import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function SuccessPage() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { name }   = state || {}

  useEffect(() => {
    if (!state) navigate('/')
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div className="fade-in" style={{ maxWidth: '360px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', marginBottom: '12px' }}>
          ¡Pedido enviado{name ? `, ${name}` : ''}!
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          Tu pedido fue registrado y enviado por WhatsApp al local.
          Te avisamos cuando esté listo.
        </p>
        <button className="btn-primary" onClick={() => navigate(-3)} style={{ width: '100%', padding: '13px', fontSize: '15px' }}>
          Volver al menú
        </button>
      </div>
    </div>
  )
}
