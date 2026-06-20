import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Balance from './pages/Balance'
import Dictionary from './pages/Dictionary'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stats" element={<Stats />} />
          <Route path="balance" element={<Balance />} />
          <Route path="dictionary" element={<Dictionary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
