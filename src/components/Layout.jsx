import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  {
    to: '/', end: true, label: 'Dashboard',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    to: '/transactions', label: 'Transactions',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    to: '/insights', label: 'Insights',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const initial = user?.email?.[0]?.toUpperCase() || 'J'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="white"/></svg>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>Bank of Josh</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>Menu</p>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
              borderRadius: '10px', fontSize: '13.5px', fontWeight: isActive ? 600 : 500,
              color: isActive ? '#fff' : '#6b7280', textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
            })}>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', marginBottom: '4px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0]}</p>
              <p style={{ color: '#4b5563', fontSize: '10px' }}>Personal</p>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="page-main">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '6px 20px', borderRadius: '12px', textDecoration: 'none',
            color: isActive ? '#818cf8' : '#4b5563', transition: 'all 0.15s',
          })}>
            {icon}
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
