import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: 'orders',   label: 'Pedidos',    emoji: '📋' },
  { to: 'products', label: 'Productos',  emoji: '🧾' },
  { to: 'sales',    label: 'Ventas',     emoji: '💰' },
  { to: 'tables',   label: 'Mesas / QR', emoji: '🪑' },
]

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: '700', letterSpacing: '-0.02em' }}>
            🍽️ Mi Local
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Panel de control</div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--r-md)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'var(--accent)18' : 'transparent',
                transition: 'all .15s',
              })}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn-ghost"
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <span>🚪</span> Salir
        </button>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px',
        background: 'var(--bg)',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
