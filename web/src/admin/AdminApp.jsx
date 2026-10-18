import './admin.css'
import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes, Link } from 'react-router-dom'
import AuroraBackground from '../components/AuroraBackground'
import Icon from '../components/Icon'
import { Wordmark } from '../components/Logo'
import { FullSpinner } from '../components/States'
import { useAuth } from '../lib/auth'
import { useMeta } from '../lib/meta'

const Overview = lazy(() => import('./Overview'))
const JobsAdmin = lazy(() => import('./JobsAdmin'))
const Applications = lazy(() => import('./Applications'))
const Interviews = lazy(() => import('./Interviews'))
const Students = lazy(() => import('./Students'))

const NAV = [
  { to: '/admin', end: true, icon: 'chart', label: 'Umumiy koʻrinish' },
  { to: '/admin/jobs', icon: 'briefcase', label: 'Vakansiyalar' },
  { to: '/admin/applications', icon: 'kanban', label: 'Arizalar' },
  { to: '/admin/interviews', icon: 'calendar', label: 'Intervyular' },
  { to: '/admin/students', icon: 'users', label: 'Talabalar' },
]

function Login() {
  const { login, notice } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(email.trim(), password) } catch (err) { setError(err.message || 'Kirib boʻlmadi.') } finally { setBusy(false) }
  }
  return (
    <div className="login">
      <AuroraBackground />
      <form className="login__card glass glass--lg" onSubmit={submit} noValidate>
        <Wordmark size={30} />
        <h1 className="login__h">Admin paneli</h1>
        <p className="muted">Administrator hisobi bilan tizimga kiring.</p>
        {(error || notice) && <p className="field__error" role="alert" style={{ color: error ? undefined : 'var(--mist)' }}>{error || notice}</p>}
        <label className="field"><span className="field__label">Email</span><input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} /></label>
        <label className="field"><span className="field__label">Parol</span><input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} /></label>
        <button className="btn btn--primary" type="submit" disabled={busy || !email || !password}>{busy ? 'Kirilmoqda…' : 'Kirish'}</button>
        <Link to="/" className="muted login__back">← Saytga qaytish</Link>
        <p className="faint login__hint">Test uchun: admin@ilmgo.uz / Admin123!</p>
      </form>
    </div>
  )
}

function Shell() {
  const { user, logout } = useAuth()
  return (
    <div className="admin">
      <AuroraBackground variant="css" />
      <aside className="admin__side glass">
        <Link to="/" className="brand" aria-label="Saytga qaytish"><Wordmark size={26} /></Link>
        <nav aria-label="Admin menyusi" className="admin__nav">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className="admin__link"><Icon name={n.icon} size={18} /><span>{n.label}</span></NavLink>)}
        </nav>
        <div className="admin__user">
          <span className="admin__who"><b>{user.name}</b><small className="faint">{user.email}</small></span>
          <button type="button" className="btn btn--ghost btn--icon" aria-label="Chiqish" onClick={() => logout()}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="admin__main">
        <Suspense fallback={<FullSpinner label="Yuklanmoqda" />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="jobs" element={<JobsAdmin />} />
            <Route path="applications" element={<Applications />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="students" element={<Students />} />
            <Route path="*" element={<div className="state"><h2>Topilmadi</h2><Link className="btn btn--ghost" to="/admin">Umumiy koʻrinishga qaytish</Link></div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function AdminApp() {
  useMeta({ title: 'Admin' })
  const { user, booting } = useAuth()
  if (booting) return <FullSpinner label="Seans tekshirilmoqda" />
  return user ? <Shell /> : <Login />
}
