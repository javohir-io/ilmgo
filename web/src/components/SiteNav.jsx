import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { openPalette } from '../lib/palette'
import Icon from './Icon'
import LiquidGlass from './LiquidGlass'
import { Wordmark } from './Logo'

const LINKS = [
  { to: '/jobs', label: 'Vakansiyalar' },
  { to: { pathname: '/', hash: '#how' }, label: 'Qanday ishlaydi', plain: true },
  { to: { pathname: '/', hash: '#features' }, label: 'Imkoniyatlar', plain: true },
  { to: { pathname: '/', hash: '#app' }, label: 'Ilovani yuklash', plain: true },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname, loc.hash])

  return (
    <header className="nav">
      <div className="nav__bar glass">
        <Link to="/" className="brand" aria-label="Ilmgo bosh sahifasi"><Wordmark /></Link>
        <nav className="nav__links" aria-label="Asosiy menyu">
          {LINKS.map((l) => (l.plain
            ? <Link key={l.label} to={l.to} className="nav__link">{l.label}</Link>
            : <NavLink key={l.label} to={l.to} className="nav__link">{l.label}</NavLink>))}
        </nav>
        <div className="nav__right">
          <button type="button" className="nav__search" onClick={openPalette} aria-label="Buyruqlar panelini ochish">
            <Icon name="search" size={16} /> <span className="nav__search-text">Qidirish</span> <kbd className="kbd">Ctrl K</kbd>
          </button>
          <Link to="/admin" className="btn btn--ghost btn--sm nav__admin">Admin</Link>
          <button type="button" className="btn btn--ghost btn--icon nav__burger" aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'} aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <LiquidGlass as="nav" id="nav-sheet" className="nav__sheet" radius={26} aria-label="Mobil menyu">
          {LINKS.map((l) => <Link key={l.label} to={l.to} className="nav__sheet-link">{l.label}</Link>)}
          <Link to="/admin" className="nav__sheet-link">Admin paneli</Link>
          <button type="button" className="nav__sheet-link" onClick={() => { setOpen(false); openPalette() }}>Buyruqlar paneli</button>
        </LiquidGlass>
      )}
    </header>
  )
}
