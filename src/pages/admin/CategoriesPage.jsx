import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const EMPTY = { name: '', emoji: '🍽️', position: 0, active: true }

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [form,       setForm]       = useState(EMPTY)
  const [editing,    setEditing]    = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('position', { ascending: true })
    
    if (error) toast.error('Error cargando categorías')
    else setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY)
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(c) {
    setForm({
      name: c.name,
      emoji: c.emoji || '🍽️',
      position: c.position,
      active: c.active
    })
    setEditing(c.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.name) return toast.error('El nombre es obligatorio')
    setSaving(true)
    
    const { error } = editing
      ? await supabase.from('categories').update(form).eq('id', editing)
      : await supabase.from('categories').insert(form)

    if (error) {
      toast.error('Error guardando categoría')
    } else {
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada')
      setShowForm(false)
      load()
    }
    setSaving(false)
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría? Se desvinculará de los productos.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) toast.error('Error eliminando categoría')
    else {
      toast.success('Categoría eliminada')
      load()
    }
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700' }}>Categorías</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>Organiza tus productos por secciones</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nueva categoría</button>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={() => setShowForm(false)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '400px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              {editing ? 'Editar categoría' : 'Nueva categoría'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="Ej: Hamburguesas" 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Emoji</label>
                  <input 
                    value={form.emoji} 
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} 
                    placeholder="🍔" 
                  />
                </div>
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '4px' }}>Posición</label>
                  <input 
                    type="number" 
                    value={form.position} 
                    onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="cat-active" 
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ width: 'auto' }} 
                />
                <label htmlFor="cat-active" style={{ fontSize: '14px', cursor: 'pointer' }}>Activa</label>
              </div>
            </div>

            <div className="flex gap-2" style={{ marginTop: '20px' }}>
              <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear categoría'}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map(c => (
            <div key={c.id} className="card" style={{ opacity: c.active ? 1 : 0.5 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--r-md)',
                    background: 'var(--bg3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '20px',
                  }}>
                    {c.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Posición: {c.position}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => openEdit(c)}>✏️ Editar</button>
                  <button 
                    style={{ 
                      fontSize: '12px', padding: '6px 10px', 
                      background: 'var(--danger)18', color: 'var(--danger)', 
                      border: '1px solid var(--danger)44', borderRadius: 'var(--r-md)', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => deleteCategory(c.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', background: 'var(--bg2)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border)' }}>
              No hay categorías creadas.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
