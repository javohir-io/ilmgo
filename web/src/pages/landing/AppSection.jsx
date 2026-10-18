import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import MatchRing from '../../components/MatchRing'
import { useReveal } from '../../lib/motion'

function Phone() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">
        <p className="faint">Xayrli tong</p>
        <b className="phone__h">Eng mos vakansiyalar</b>
        {[['Flutter dasturchi', 'Orbit Labs', 92, 'var(--sky)'], ['Backend muhandis', 'Kite Systems', 84, 'var(--mist)'], ['Maʼlumotlar tahlilchisi', 'Helix Analytics', 71, 'var(--paper)']].map(([t, c, m, a]) => (
          <div key={t} className="phone__card" style={{ '--accent': a }}>
            <i className="phone__mono" />
            <span><b>{t}</b><small className="muted">{c}</small></span>
            <MatchRing value={m} size={38} stroke={10} />
          </div>
        ))}
        <div className="phone__nav"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  )
}

export default function AppSection() {
  const root = useRef(null)
  useReveal(root)
  return (
    <section id="app" ref={root} className="section" aria-labelledby="app-title">
      <div className="container app">
        <div className="app__copy">
          <p className="eyebrow" data-reveal>Talaba ilovasi</p>
          <h2 id="app-title" className="h-section" data-reveal>Butun ish qidiruvingiz, <span className="grad-text">choʻntagingizda.</span></h2>
          <p className="lead" data-reveal>Flutter ilovasi — talabalar uchun asosiy joy: moslik boʻyicha saralangan qidiruv, uch bosqichli ariza jarayoni, aqlli rejalashtirish va real vaqtda yangilanadigan holat kuzatuvi.</p>
          <div className="app__run glass" data-reveal>
            <p className="faint">Mahalliy ishga tushirish</p>
            <pre className="mono"><code>{`cd app\nflutter pub get\nflutter run --dart-define=API_BASE_URL=http://localhost:3000`}</code></pre>
            <p className="muted">Demo kirish: <span className="mono">demo@ilmgo.uz</span> / <span className="mono">Demo1234!</span></p>
          </div>
          <div className="hero__cta" data-reveal>
            <Link to="/jobs" className="btn btn--primary">Vakansiyalarni koʻrish <Icon name="arrow-up-right" size={16} /></Link>
          </div>
        </div>
        <div className="app__visual" data-reveal><Phone /></div>
      </div>
    </section>
  )
}
