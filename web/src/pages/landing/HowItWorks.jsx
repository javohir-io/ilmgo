import { useRef } from 'react'
import Icon from '../../components/Icon'
import MatchRing from '../../components/MatchRing'
import StatusPill from '../../components/StatusPill'
import { gsap, ScrollTrigger, useGSAP, refreshAfterLayout } from '../../lib/gsap'

const STEPS = [
  { icon: 'search', title: 'Toping', body: 'Vakansiyalar koʻnikmalaringizga qanchalik mosligi boʻyicha saralanadi. Sizga mos boʻlmagan eʼlonlarni titkilab oʻtirmaysiz.' },
  { icon: 'file', title: 'Ariza bering', body: 'Maʼlumotlaringiz avtomatik toʻldiriladi. Rezyumeni biriktiring, izoh qoʻshing — ikki daqiqadan kamda jarayondasiz.' },
  { icon: 'calendar', title: 'Intervyu', body: 'Haqiqiy boʻsh vaqtni tanlang. Ikki marta band qilish imkonsiz, kalendarga qoʻshish esa bir bosishda.' },
  { icon: 'star', title: 'Taklif', body: 'Har bir holat oʻzgarishi sizga darhol yetib boradi. Hech kimning orqasidan yugurmasdan oʻz oʻrningizni bilib turasiz.' },
]

function Visual({ i }) {
  if (i === 0) return (<div className="hiw__vis"><MatchRing value={92} size={120} /><div><b>Flutter dasturchi (stajyor)</b><p className="muted">6 ta koʻnikmadan 5 tasi mos keladi</p></div></div>)
  if (i === 1) return (<div className="hiw__vis hiw__vis--col"><div className="hiw__file"><Icon name="file" /> rezyume.pdf <span className="faint">· 184 KB</span></div><div className="skel-line" /><div className="skel-line skel-line--s" /><span className="btn btn--primary btn--sm">Arizani yuborish</span></div>)
  if (i === 2) return (<div className="hiw__vis hiw__vis--col"><div className="hiw__slots">{['09:30', '10:00', '14:00', '15:30'].map((t, k) => <span key={t} className={`chip ${k === 2 ? 'is-on' : ''}`} style={k === 1 ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>{t}</span>)}</div><p className="muted">Seshanba · 30 daqiqa · Video qoʻngʻiroq</p></div>)
  return (<div className="hiw__vis hiw__vis--col"><StatusPill status="offer" /><b>Tabriklaymiz — sizni jamoamizda koʻrishdan xursandmiz.</b><p className="muted">Orbit Labs · hozirgina</p></div>)
}

/** Pinned, scrubbed walkthrough on desktop; a plain stacked list on mobile / reduced motion. */
export default function HowItWorks() {
  const root = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const steps = gsap.utils.toArray('.hiw__step')
      const panels = gsap.utils.toArray('.hiw__panel')
      gsap.set(panels, { autoAlpha: 0, y: 24 })
      gsap.set(panels[0], { autoAlpha: 1, y: 0 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hiw__pin', start: 'top 12%', end: () => `+=${window.innerHeight * 2.4}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      })
      tl.fromTo('.hiw__bar-fill', { scaleY: 0 }, { scaleY: 1, duration: steps.length - 1 }, 0)
      steps.forEach((s, i) => {
        tl.to(steps, { opacity: (k) => (k === i ? 1 : 0.38), duration: 0.01 }, i)
        if (i > 0) {
          tl.to(panels[i - 1], { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in' }, i - 0.35)
          tl.fromTo(panels[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, i - 0.1)
        }
      })
      refreshAfterLayout()
      return () => ScrollTrigger.getAll().forEach((t) => t.kill())
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="how" ref={root} className="section hiw" aria-labelledby="how-title">
      <div className="container">
        <p className="eyebrow">Qanday ishlaydi</p>
        <h2 id="how-title" className="h-section">Toʻrt qadam. <span className="grad-text">Ortidan yugurish yoʻq.</span></h2>
        <div className="hiw__pin">
          <div className="hiw__steps">
            <div className="hiw__bar" aria-hidden="true"><i className="hiw__bar-fill" /></div>
            <ol>
              {STEPS.map((s, i) => (
                <li key={s.title} className="hiw__step">
                  <span className="hiw__icon glass"><Icon name={s.icon} size={20} /></span>
                  <div><h3>{i + 1}. {s.title}</h3><p className="muted">{s.body}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="hiw__panels glass glass--lg" aria-hidden="true">
            {STEPS.map((s, i) => <div key={s.title} className="hiw__panel"><Visual i={i} /></div>)}
          </div>
        </div>
      </div>
    </section>
  )
}
