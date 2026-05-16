import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice, buildWhatsAppMessage, openWhatsApp } from '../../lib/helpers'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { cart = [], table, tableSlug } = state || {}

  const [type,    setType]    = useState(table ? 'dine_in' : 'delivery')
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  if (!cart.length) {
    navigate('/menu' + (tableSlug ? `?t=${tableSlug}` : ''))
    return null
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  async function confirm() {
    if (!name.trim()) return toast.error('Ingresá tu nombre')
    if (type === 'delivery' && !address.trim()) return toast.error('Ingresá la dirección de delivery')

    setLoading(true)
    try {
      // 1. Crear orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id:         table?.id || null,
          customer_name:    name,
          customer_phone:   phone,
          type,
          delivery_address: type === 'delivery' ? address : null,
          notes,
          total,
          status:           'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Insertar items
      const items = cart.map(i => ({
        order_id:     order.id,
        product_id:   i.id,
        product_name: i.name,
        unit_price:   i.price,
        quantity:     i.qty,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(items)
      if (itemsError) throw itemsError

      // 3. Abrir WhatsApp con resumen
      const waMessage = buildWhatsAppMessage(
        { ...order, table_label: table?.label },
        items
      )
      openWhatsApp(waMessage)

      // 4. Ir a success
      navigate('/success', { state: { orderId: order.id, name } })

    } catch (err) {
      console.error(err)
      toast.error('Error al enviar el pedido. Intentá de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Back */}
        <button className="btn-ghost" style={{ marginBottom: '20px', fontSize: '13px' }}
          onClick={() => navigate(-1)}>
          ← Volver al menú
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>
          Confirmar pedido
        </h1>

        {/* Resumen carrito */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '600', color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tu pedido
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between" style={{ fontSize: '14px' }}>
                <span style={{ color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--text)' }}>{item.qty}×</strong> {item.name}
                </span>
                <span>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between" style={{
            marginTop: '12px', paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700',
          }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Tipo de pedido */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Tipo de pedido</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(table ? ['dine_in', 'takeaway'] : ['delivery', 'takeaway']).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, padding: '10px',
                background: type === t ? 'var(--accent)' : 'var(--bg3)',
                color: type === t ? '#fff' : 'var(--text2)',
                border: '1px solid',
                borderColor: type === t ? 'var(--accent)' : 'var(--border)',
                borderRadius: 'var(--r-md)',
                fontSize: '14px', cursor: 'pointer', fontWeight: type === t ? '600' : '400',
              }}>
                {t === 'dine_in' ? '🪑 En mesa' : t === 'delivery' ? '🛵 Delivery' : '🥡 Para llevar'}
              </button>
            ))}
            {!table && (
              <button onClick={() => setType('dine_in')} style={{
                flex: 1, padding: '10px',
                background: type === 'dine_in' ? 'var(--accent)' : 'var(--bg3)',
                color: type === 'dine_in' ? '#fff' : 'var(--text2)',
                border: '1px solid',
                borderColor: type === 'dine_in' ? 'var(--accent)' : 'var(--border)',
                borderRadius: 'var(--r-md)',
                fontSize: '14px', cursor: 'pointer', fontWeight: type === 'dine_in' ? '600' : '400',
              }}>
                🪑 En mesa
              </button>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Teléfono (opcional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="3884..." />
          </div>
          {type === 'delivery' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Dirección *</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle y número, barrio..." />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Notas (opcional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Sin cebolla, poco picante..." />
          </div>
        </div>

        {/* Confirmar */}
        <button className="btn-primary" onClick={confirm} disabled={loading} style={{
          width: '100%', padding: '15px', fontSize: '16px',
          fontFamily: 'var(--font-display)', fontWeight: '700',
        }}>
          {loading ? 'Enviando...' : '📲 Confirmar pedido por WhatsApp'}
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '12px', marginTop: '12px' }}>
          Al confirmar se abrirá WhatsApp con el resumen del pedido
        </p>
      </div>
    </div>
  )
}
