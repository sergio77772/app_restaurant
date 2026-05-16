import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const EMPTY = { number: '', label: '', qr_slug: '', active: true }

export default function TablesPage() {
  const [tables,   setTables]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY)
  const [editing,  setEditing]  = useState(null)
  const [showForm, setShowForm] = useState(false)

  const baseUrl = window.location.origin

  async function load() {
    const { data } = await supabase.from('tables').select('*').order('number')
    setTables(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY)
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t) {
    setForm({ number: t.number, label: t.label || '', qr_slug: t.qr_slug || '', active: t.active })
    setEditing(t.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.number || !form.qr_slug) return toast.error('Número y slug son obligatorios')
    const payload = { number: parseInt(form.number), label: form.label, qr_slug: form.qr_slug, active: form.active }
    const { error } = editing
      ? await supabase.from('tables').update(payload).eq('id', editing)
      : await supabase.from('tables').insert(payload)
    if (error) toast.error(error.message)
    else { toast.success('Mesa guardada'); setShowForm(false); load() }
  }

  async function deleteTable(id) {
    if (!confirm('¿Eliminar esta mesa?')) return
    await supabase.from('tables').delete().eq('id', id)
    toast('Mesa eliminada', { icon: '🗑️' })
    load()
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${baseUrl}/menu?t=${slug}`)
    toast.success('Link copiado')
  }

  function getQrUrl(slug) {
    const menuUrl = encodeURIComponent(`${baseUrl}/menu?t=${slug}`)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${menuUrl}`
  }

  function printQr(table) {
    const menuUrl = `${baseUrl}/menu?t=${table.qr_slug}`
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>QR ${table.label || 'Mesa ' + table.number}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}h2{margin-bottom:16px}p{color:#666;margin-top:12px}</style>
      </head><body>
      <h2>${table.label || 'Mesa ' + table.number}</h2>
      <img src="${getQrUrl(table.qr_slug)}" style="width:220px;height:220px" />
      <p>${menuUrl}</p>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>`)
    win.document.close()
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700' }}>Mesas & QR</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>
            Generá QR para cada mesa — los clientes escanean y hacen el pedido
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nueva mesa</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'#000a', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
          onClick={() => setShowForm(false)}>
          <div className="card fade-in" style={{ width:'100%', maxWidth:'400px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700', marginBottom:'20px' }}>
              {editing ? 'Editar mesa' : 'Nueva mesa'}
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'12px' }}>
                <div>
                  <label className="text-sm text-muted" style={{ display:'block', marginBottom:'4px' }}>Número *</label>
                  <input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="1" />
                </div>
                <div>
                  <label className="text-sm text-muted" style={{ display:'block', marginBottom:'4px' }}>Nombre</label>
                  <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Mesa 1 / Barra / Terraza" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted" style={{ display:'block', marginBottom:'4px' }}>Slug para QR *</label>
                <input value={form.qr_slug} onChange={e => setForm(f => ({ ...f, qr_slug: e.target.value.toLowerCase().replace(/\s+/g,'-') }))} placeholder="mesa-1" />
                <p className="text-xs text-muted" style={{ marginTop:'4px' }}>URL: /menu?t={form.qr_slug || 'slug'}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <input type="checkbox" id="table-active" checked={form.active} style={{ width:'auto' }}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                <label htmlFor="table-active" style={{ fontSize:'14px', cursor:'pointer' }}>Mesa activa</label>
              </div>
            </div>
            <div className="flex gap-2" style={{ marginTop:'20px' }}>
              <button className="btn-primary" onClick={save} style={{ flex:1 }}>Guardar</button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de mesas */}
      {loading ? (
        <div style={{ color:'var(--text2)', textAlign:'center', padding:'40px' }}>Cargando...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
          {tables.map(t => (
            <div key={t.id} className="card" style={{ opacity: t.active ? 1 : 0.6 }}>
              {/* QR */}
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <img src={getQrUrl(t.qr_slug)} alt={`QR ${t.label}`}
                  style={{ width:'140px', height:'140px', borderRadius:'var(--r-md)' }} />
              </div>

              <div style={{ textAlign:'center', marginBottom:'12px' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700' }}>
                  {t.label || `Mesa ${t.number}`}
                </div>
                <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'2px' }}>
                  /menu?t={t.qr_slug}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <button className="btn-primary" onClick={() => printQr(t)} style={{ width:'100%' }}>
                  🖨️ Imprimir QR
                </button>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button className="btn-ghost" style={{ flex:1, fontSize:'12px' }} onClick={() => copyLink(t.qr_slug)}>
                    📋 Copiar link
                  </button>
                  <button className="btn-ghost" style={{ fontSize:'12px', padding:'8px 12px' }} onClick={() => openEdit(t)}>✏️</button>
                  <button onClick={() => deleteTable(t.id)}
                    style={{ fontSize:'12px', padding:'8px 12px', background:'var(--danger)18', color:'var(--danger)', border:'1px solid var(--danger)44', borderRadius:'var(--r-md)', cursor:'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
