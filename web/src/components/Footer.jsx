import { Link } from 'react-router-dom'
import { Wordmark } from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Wordmark />
          <p className="muted footer__tag">Kampusdan karyeragacha, bitta orbitada.</p>
        </div>
        <nav aria-label="Boʻlimlar" className="footer__col">
          <h2 className="footer__h">Boʻlimlar</h2>
          <Link to="/jobs">Vakansiyalarni koʻrish</Link>
          <Link to={{ pathname: '/', hash: '#how' }}>Qanday ishlaydi</Link>
          <Link to={{ pathname: '/', hash: '#features' }}>Imkoniyatlar</Link>
        </nav>
        <nav aria-label="Mahsulot" className="footer__col">
          <h2 className="footer__h">Mahsulot</h2>
          <Link to={{ pathname: '/', hash: '#app' }}>Ilovani yuklash</Link>
          <Link to="/admin">Admin paneli</Link>
        </nav>
      </div>
      <div className="container footer__legal faint">
        <span>© {new Date().getFullYear()} Ilmgo. Universitet karyera xizmatlari loyihasi.</span>
        <span>Istalgan joyda <kbd className="kbd">Ctrl K</kbd> bosib tezda oʻting.</span>
      </div>
    </footer>
  )
}
