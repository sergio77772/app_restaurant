import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getStatusInfo, getNextStatus, formatPrice, formatTime, ORDER_STATUSES } from '../../lib/helpers'
import toast from 'react-hot-toast'

const STATUS_FILTER = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [selectedOrder, setSelected] = useState(null)

  // Cargar pedidos + items
  async function loadOrders() {
    const query = supabase
      .from('orders')
      .select(`*, order_items(*), tables(label)`)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') query.eq('status', filter)

    const { data, error } = await query
    if (error) toast.error('Error cargando pedidos')
    else setOrders(data || [])
    setLoading(false)
  }

  // Suscripción realtime
  useEffect(() => {
    loadOrders()
    const channel = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
        toast('📋 Pedido actualizado', { icon: '🔔' })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [filter])

  async function advanceStatus(order) {
    const next = getNextStatus(order.status)
    if (!next) return
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', order.id)
    if (error) toast.error('Error actualizando estado')
    else {
      toast.success(`Pedido → ${getStatusInfo(next).label}`)
      loadOrders()
    }
  }

  async function cancelOrder(id) {
    if (!confirm('¿Cancelar este pedido?')) return
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
    toast('Pedido cancelado', { icon: '❌' })
    loadOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700' }}>
            Pedidos
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>
            {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={loadOrders} className="btn-ghost" style={{ fontSize: '13px' }}>
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros de status */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {STATUS_FILTER.map(s => {
          const info = s === 'all' ? { label: 'Todos', emoji: '📋' } : getStatusInfo(s)
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '13px',
                background: filter === s ? 'var(--accent)' : 'var(--bg3)',
                color: filter === s ? '#fff' : 'var(--text2)',
                border: '1px solid',
                borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
                fontWeight: filter === s ? '600' : '400',
              }}
            >
              {info.emoji} {info.label} {count > 0 && <span style={{ opacity: 0.7, fontSize: '11px' }}>({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', padding: '60px', textAlign: 'center', fontSize: '15px' }}>
          No hay pedidos {filter !== 'all' ? `con estado "${getStatusInfo(filter).label}"` : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(order => {
            const info    = getStatusInfo(order.status)
            const next    = getNextStatus(order.status)
            const nextInfo = next ? getStatusInfo(next) : null

            return (
              <div key={order.id} className="card" style={{ cursor: 'pointer' }}
                onClick={() => setSelected(order.id === selectedOrder ? null : order.id)}
              >
                {/* Fila principal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '13px',
                      color: 'var(--text3)',
                      minWidth: '70px',
                    }}>
                      {formatTime(order.created_at)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '15px' }}>
                        {order.customer_name || 'Sin nombre'}
                        {order.tables?.label && (
                          <span style={{ color: 'var(--text3)', fontSize: '13px', marginLeft: '8px' }}>
                            — {order.tables.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                        {order.type === 'dine_in' ? '🪑 Mesa' : order.type === 'delivery' ? '🛵 Delivery' : '🥡 Para llevar'}
                        {' · '}
                        {order.order_items?.length || 0} ítem{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                        {' · '}
                        <strong style={{ color: 'var(--text)' }}>{formatPrice(order.total)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${order.status}`}>
                      {info.emoji} {info.label}
                    </span>
                  </div>
                </div>

                {/* Detalle expandido */}
                {selectedOrder === order.id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                      {(order.order_items || []).map(item => (
                        <div key={item.id} className="flex justify-between" style={{ fontSize: '14px' }}>
                          <span style={{ color: 'var(--text2)' }}>
                            <strong style={{ color: 'var(--text)' }}>{item.quantity}×</strong> {item.product_name}
                            {item.notes && <em style={{ color: 'var(--text3)', fontSize: '12px' }}> — {item.notes}</em>}
                          </span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div style={{
                        background: 'var(--bg3)',
                        borderRadius: 'var(--r-md)',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: 'var(--text2)',
                        marginBottom: '16px',
                      }}>
                        📝 {order.notes}
                      </div>
                    )}

                    {order.delivery_address && (
                      <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                        📍 {order.delivery_address}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2">
                      {nextInfo && order.status !== 'cancelled' && (
                        <button className="btn-primary" onClick={e => { e.stopPropagation(); advanceStatus(order) }}>
                          {nextInfo.emoji} Marcar como {nextInfo.label}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button className="btn-ghost" style={{ fontSize: '13px', color: 'var(--danger)' }}
                          onClick={e => { e.stopPropagation(); cancelOrder(order.id) }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
