import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Gallery from './pages/Gallery.tsx'
import Contact from './pages/Contact.tsx'
import Admin from './pages/Admin.tsx'
import SponsorsBar from './components/SponsorsBar.tsx'

const routes = [
  { path: '/', label: 'Início', showInNav: true },
  { path: '/galeria', label: 'Galeria', showInNav: true },
  { path: '/contato', label: 'Contato', showInNav: true },
  // Admin is intentionally kept as a route but hidden from the public navigation
  { path: '/admin', label: 'Admin', showInNav: false },
]

function App() {
  return (
    <div className="app-shell">
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />

      <header className="app-header">
        <Link to="/" className="brand-mark" aria-label="Ir para a página inicial">
          <img src="/images/logo.png" alt="Holywins" className="brand-logo" />
        </Link>
        <nav className="main-nav" aria-label="Navegação principal">
          {routes.filter((r) => r.showInNav).map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              end={route.path === '/'}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/contato" className="primary-btn">
          Participar
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <section className="page-card">
                <p className="eyebrow">Conteúdo não encontrado</p>
                <h1>Página não encontrada</h1>
                <p>
                  O link acessado não existe. Use o menu acima para continuar navegando.
                </p>
                <Link to="/" className="primary-btn">
                  Voltar ao início
                </Link>
              </section>
            }
          />
        </Routes>
      </main>

      <SponsorsBar />

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Holywins · Paróquia São João Bosco</p>
        <span>Luz vence as trevas</span>
      </footer>
    </div>
  )
}

export default App
