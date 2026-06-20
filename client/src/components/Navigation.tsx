import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/stats', label: 'Stats', icon: '📊' },
  { path: '/balance', label: 'Balance', icon: '💰' },
  { path: '/dictionary', label: 'Dict', icon: '📖' },
]

function Navigation() {
  return (
    <nav
      style={{
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          style={({ isActive }) => ({
            flex: 1,
            padding: '12px 8px',
            textAlign: 'center',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '12px',
          })}
        >
          <div style={{ fontSize: '20px', marginBottom: '2px' }}>{tab.icon}</div>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default Navigation
