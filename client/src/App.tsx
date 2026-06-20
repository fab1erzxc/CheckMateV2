import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Balance from './pages/Balance'
import Dictionary from './pages/Dictionary'
import TextEntry from './pages/TextEntry'
import PhotoEntry from './pages/PhotoEntry'
import ReceiptList from './pages/ReceiptList'
import ReceiptDetail from './pages/ReceiptDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stats" element={<Stats />} />
          <Route path="balance" element={<Balance />} />
          <Route path="dictionary" element={<Dictionary />} />
          <Route path="entry/text" element={<TextEntry />} />
          <Route path="entry/photo" element={<PhotoEntry />} />
          <Route path="receipts" element={<ReceiptList />} />
          <Route path="receipts/:id" element={<ReceiptDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
