import { useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Gallery from './pages/Gallery.tsx'
import Communities from './pages/Communities.tsx'
import SantoDoDia from './pages/SantoDoDia.tsx'
import Contact from './pages/Contact.tsx'
import Admin from './pages/Admin.tsx'
import AdminUsers from './pages/AdminUsers.tsx'
import AdminLogs from './pages/AdminLogs.tsx'
import AdminProfile from './pages/AdminProfile.tsx'
import Login from './pages/Login.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import SponsorsBar from './components/SponsorsBar.tsx'

const routes = [
  { path: '/', label: 'Início', showInNav: true },
  { path: '/galeria', label: 'Galeria', showInNav: true },
  { path: '/comunidades', label: 'Comunidades', showInNav: true },
  { path: '/santo-do-dia', label: 'Santo do dia', showInNav: true },
  { path: '/contato', label: 'Contato', showInNav: true },
  // Admin is intentionally kept as a route but hidden from the public navigation
  { path: '/admin', label: 'Admin', showInNav: false },
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />

      <header className="app-header">
        <Link to="/" className="brand-mark" aria-label="Ir para a página inicial">
          <img src="/images/logo.png" alt="Holywins" className="brand-logo" />
        </Link>

        <button
          className="hamburger-menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu de navegação"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`main-nav ${mobileMenuOpen ? 'main-nav--open' : ''}`} aria-label="Navegação principal">
          {routes.filter((r) => r.showInNav).map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              end={route.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
            >
              {route.label}
            </NavLink>
          ))}
          <Link
            to="/contato"
            className="primary-btn primary-btn--mobile"
            onClick={() => setMobileMenuOpen(false)}
          >
            Participar
          </Link>
        </nav>

        <Link to="/contato" className="primary-btn primary-btn--desktop">
          Participar
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/comunidades" element={<Communities />} />
          <Route path="/santo-do-dia" element={<SantoDoDia />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
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

      <footer className="app-footer reveal-on-scroll">
        <p>© {new Date().getFullYear()} Holywins · Paróquia São João Bosco</p>
        <span>Luz vence as trevas</span>
      </footer>
    </div>
  )
}

export default App
