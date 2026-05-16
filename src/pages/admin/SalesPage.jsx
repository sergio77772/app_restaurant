import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatPrice, formatDate } from '../../lib/helpers'

export default function SalesPage() {
  const [today,    setToday]    = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [topItems, setTopItems] = useState([])

  async function load() {
    const todayStr = new Date().toISOString().split('T')[0]

    // Pedidos de hoy (entregados + listos)
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', todayStr + 'T00:00:00')
      .in('status', ['delivered', 'ready'])

    // Últimos 7 días agrupados
    const since = new Date()
    since.setDate(since.getDate() - 6)
    const { data: histOrders } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', since.toISOString())
      .in('status', ['delivered', 'ready'])
      .order('created_at', { ascending: false })

    // Calcular hoy
    const todayTotal = (todayOrders || []).reduce((s, o) => s + Number(o.total), 0)
    const todayCount = (todayOrders || []).length

    // Top items de hoy
    const itemMap = {}
    ;(todayOrders || []).forEach(o => {
      ;(o.order_items || []).forEach(i => {
        if (!itemMap[i.product_name]) itemMap[i.product_name] = { qty: 0, total: 0 }
        itemMap[i.product_name].qty   += i.quantity
        itemMap[i.product_name].total += Number(i.subtotal)
      })
    })
    const top = Object.entries(itemMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)

    // Agrupar historial por día
    const byDay = {}
    ;(histOrders || []).forEach(o => {
      const day = o.created_at.split('T')[0]
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 }
      byDay[day].total += Number(o.total)
      byDay[day].count += 1
    })

    setToday({ total: todayTotal, count: todayCount })
    setTopItems(top)
    setHistory(Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Cargando...</div>

  const maxHistory = Math.max(...history.map(([, v]) => v.total), 1)

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        Ventas
      </h1>

      {/* Cards de hoy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total hoy" value={formatPrice(today?.total || 0)} emoji="💰" accent />
        <StatCard label="Pedidos hoy" value={today?.count || 0} emoji="📋" />
        <StatCard
          label="Ticket promedio"
          value={today?.count ? formatPrice((today.total / today.count)) : '$0'}
          emoji="🧾"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Últimos 7 días */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Últimos 7 días
          </h2>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Sin ventas en este período</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(([day, v]) => (
                <div key={day}>
                  <div className="flex justify-between" style={{ marginBottom: '4px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text2)' }}>{formatDate(day + 'T12:00:00')}</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(v.total)}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(v.total / maxHistory) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: '99px',
                      transition: 'width .6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos hoy */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Más vendidos hoy
          </h2>
          {topItems.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Sin datos de hoy</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text3)', fontSize: '12px', minWidth: '16px' }}>#{i + 1}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{
                      background: 'var(--accent)22', color: 'var(--accent)',
                      borderRadius: '99px', padding: '2px 8px', fontSize: '12px', fontWeight: '600',
                    }}>×{item.qty}</span>
                    <span style={{ color: 'var(--text2)', fontSize: '13px' }}>{formatPrice(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={load}>🔄 Actualizar</button>
      </div>
    </div>
  )
}

function StatCard({ label, value, emoji, accent }) {
  return (
    <div className="card" style={{ borderColor: accent ? 'var(--accent)44' : 'var(--border)' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        fontWeight: '700',
        color: accent ? 'var(--accent)' : 'var(--text)',
      }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
    </div>
  )
}
