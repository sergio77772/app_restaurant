import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/helpers'

export default function MenuPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const tableSlug       = searchParams.get('t')

  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [table,      setTable]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [cart,       setCart]       = useState([])
  const [activecat,  setActiveCat]  = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').eq('active', true).order('position'),
        supabase.from('products').select('*, categories(name,emoji)').eq('active', true),
      ])

      if (tableSlug) {
        const { data: t } = await supabase.from('tables').select('*').eq('qr_slug', tableSlug).single()
        setTable(t)
      }

      setCategories(cats || [])
      setProducts(prods || [])
      if (cats?.length) setActiveCat(cats[0].id)
      setLoading(false)
    }
    load()
  }, [tableSlug])

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function removeFromCart(id) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id)
      if (!existing) return prev
      if (existing.qty === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function getQty(id) {
    return cart.find(i => i.id === id)?.qty || 0
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const filtered = products.filter(p => p.category_id === activecat)

  function goCheckout() {
    navigate('/checkout', { state: { cart, table, tableSlug } })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text2)' }} className="pulse">Cargando menú...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: cartCount > 0 ? '100px' : '32px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700' }}>
              🍽️ Menú
            </h1>
            {table && (
              <div style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '2px' }}>
                📍 {table.label || `Mesa ${table.number}`}
              </div>
            )}
          </div>

          {/* Tabs de categorías */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '1px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  background: activecat === cat.id ? 'var(--bg)' : 'transparent',
                  color: activecat === cat.id ? 'var(--accent)' : 'var(--text2)',
                  border: 'none',
                  borderBottom: activecat === cat.id ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  fontWeight: activecat === cat.id ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>
            No hay productos en esta categoría
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(p => {
              const qty = getQty(p.id)
              const outOfStock = p.stock === 0

              return (
                <div key={p.id} className="card fade-in" style={{ opacity: outOfStock ? 0.5 : 1 }}>
                  <div className="flex items-center justify-between" style={{ gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '16px' }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                          {p.description}
                        </div>
                      )}
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '17px',
                        fontWeight: '600',
                        color: 'var(--accent)',
                        marginTop: '6px',
                      }}>
                        {formatPrice(p.price)}
                      </div>
                      {outOfStock && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>Sin stock</div>}
                    </div>

                    {p.image_url && (
                      <img src={p.image_url} alt={p.name}
                        style={{ width: '72px', height: '72px', borderRadius: 'var(--r-md)', objectFit: 'cover', flexShrink: 0 }} />
                    )}

                    {/* Controles */}
                    {!outOfStock && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {qty > 0 ? (
                          <>
                            <button onClick={() => removeFromCart(p.id)} style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: 'var(--bg3)', color: 'var(--text)',
                              border: '1px solid var(--border)', fontSize: '18px', lineHeight: 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            }}>−</button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600' }}>{qty}</span>
                          </>
                        ) : null}
                        <button onClick={() => addToCart(p)} style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--accent)', color: '#fff',
                          border: 'none', fontSize: '18px', lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Barra de carrito */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--accent)',
          padding: '16px 20px',
          zIndex: 20,
        }}>
          <button onClick={goCheckout} style={{
            width: '100%', maxWidth: '600px', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', color: '#fff', border: 'none',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'var(--font-display)',
          }}>
            <span style={{
              background: '#fff3', borderRadius: '99px',
              padding: '2px 10px', fontSize: '14px',
            }}>{cartCount}</span>
            <span>Ver pedido</span>
            <span>{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
