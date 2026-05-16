import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/helpers'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', price: '', category_id: '', image_url: '', stock: -1, active: true }

export default function ProductsPage() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [form,       setForm]       = useState(EMPTY)
  const [editing,    setEditing]    = useState(null) // id del producto en edición
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  async function load() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('position'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY)
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(p) {
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      category_id: p.category_id || '', image_url: p.image_url || '',
      stock: p.stock, active: p.active,
    })
    setEditing(p.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.price) return toast.error('Nombre y precio son obligatorios')
    setSaving(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      category_id: form.category_id || null,
    }
    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing)
      : await supabase.from('products').insert(payload)

    if (error) toast.error('Error guardando producto')
    else {
      toast.success(editing ? 'Producto actualizado' : 'Producto creado')
      setShowForm(false)
      load()
    }
    setSaving(false)
  }

  async function toggleActive(p) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    toast('Producto eliminado', { icon: '🗑️' })
    load()
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700' }}>Productos</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>{products.length} productos cargados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo producto</button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={() => setShowForm(false)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '480px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pancho completo" />
              </div>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Descripción</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Con ketchup, mostaza y cebolla" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Precio *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="850" />
                </div>
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Stock (-1 = sin límite)</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Categoría</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>URL imagen (opcional)</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="active-chk" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ width: 'auto' }} />
                <label htmlFor="active-chk" style={{ fontSize: '14px', cursor: 'pointer' }}>Activo (visible en el menú)</label>
              </div>
            </div>

            <div className="flex gap-2" style={{ marginTop: '20px' }}>
              <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ opacity: p.active ? 1 : 0.5 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name}
                      style={{ width: '44px', height: '44px', borderRadius: 'var(--r-md)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '44px', height: '44px', borderRadius: 'var(--r-md)',
                      background: 'var(--bg3)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '20px',
                    }}>
                      {p.categories?.name ? '🍽️' : '📦'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {p.name}
                      {!p.active && <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '8px' }}>oculto</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                      {p.categories?.name && <span style={{ marginRight: '8px' }}>{p.categories.name}</span>}
                      {p.stock !== -1 && <span style={{ color: p.stock <= 5 ? 'var(--warning)' : 'var(--text3)' }}>Stock: {p.stock}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>{formatPrice(p.price)}</strong>
                  <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => toggleActive(p)}>
                    {p.active ? '👁️ Ocultar' : '👁️ Mostrar'}
                  </button>
                  <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => openEdit(p)}>✏️ Editar</button>
                  <button style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--danger)18', color: 'var(--danger)', border: '1px solid var(--danger)44', borderRadius: 'var(--r-md)', cursor: 'pointer' }}
                    onClick={() => deleteProduct(p.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
