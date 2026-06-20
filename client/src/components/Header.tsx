function Header() {
  return (
    <header
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: 600 }}>CheckMate</h1>
    </header>
  )
}

export default Header
