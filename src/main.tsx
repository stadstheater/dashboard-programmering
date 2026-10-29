import { IconContext } from '@phosphor-icons/react'
import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Beeldmerk } from './components/Logo'
import './index.css'
import Aanbod from './pages/Aanbod'
import Doelen from './pages/Doelen'
import Kalender from './pages/Kalender'
import Publiek from './pages/Publiek'
import Vandaag from './pages/Vandaag'
import { OPSLAG_SLEUTEL } from './store/useStore'

/** Vangt onverwachte fouten op en biedt een uitweg, in plaats van een leeg scherm. */
class Vangnet extends Component<{ children: ReactNode }, { fout: boolean }> {
  state = { fout: false }
  static getDerivedStateFromError() {
    return { fout: true }
  }
  opnieuw = () => {
    try {
      localStorage.removeItem(OPSLAG_SLEUTEL)
    } catch {
      /* zonder opslag is er niets te wissen */
    }
    location.assign('/')
  }
  render() {
    if (!this.state.fout) return this.props.children
    return (
      <div className="grid min-h-full place-items-center p-6">
        <div className="max-w-md rounded-3xl bg-oppervlak p-8 text-center shadow-[var(--shadow-hoog)] ring-1 ring-line">
          <Beeldmerk grootte={44} className="mx-auto text-ink" />
          <h1 className="font-display mt-4 text-2xl font-extrabold">Er ging iets mis</h1>
          <p className="mt-2 text-ink-2">De opgeslagen gegevens in deze browser lijken beschadigd. Begin opnieuw met verse voorbeelddata; je doelen moet je dan opnieuw instellen.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button className="knop knop-zacht" onClick={() => location.reload()}>Probeer opnieuw</button>
            <button className="knop knop-primair" onClick={this.opnieuw}>Opnieuw beginnen</button>
          </div>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Vangnet>
      <IconContext.Provider value={{ weight: 'fill' }}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Vandaag />} />
              <Route path="kalender" element={<Kalender />} />
              <Route path="aanbod" element={<Aanbod />} />
              <Route path="publiek" element={<Publiek />} />
              <Route path="doelen" element={<Doelen />} />
              <Route path="doelgroepen" element={<Navigate to="/publiek" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </IconContext.Provider>
    </Vangnet>
  </StrictMode>,
)
