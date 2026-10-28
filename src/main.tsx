import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import './index.css'
import Aanbod from './pages/Aanbod'
import Artiesten from './pages/Artiesten'
import Builder from './pages/Builder'
import Cockpit from './pages/Cockpit'
import Doelgroepen from './pages/Doelgroepen'
import Historie from './pages/Historie'
import Kalender from './pages/Kalender'
import Motivaties from './pages/Motivaties'
import Scenario from './pages/Scenario'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Cockpit />} />
          <Route path="kalender" element={<Kalender />} />
          <Route path="aanbod" element={<Aanbod />} />
          <Route path="scenario" element={<Scenario />} />
          <Route path="doelgroepen" element={<Doelgroepen />} />
          <Route path="motivaties" element={<Motivaties />} />
          <Route path="historie" element={<Historie />} />
          <Route path="artiesten" element={<Artiesten />} />
          <Route path="builder" element={<Builder />} />
          <Route path="*" element={<Cockpit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
