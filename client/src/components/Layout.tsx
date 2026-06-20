import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'

function Layout() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Outlet />
      </main>
      <Navigation />
    </>
  )
}

export default Layout
