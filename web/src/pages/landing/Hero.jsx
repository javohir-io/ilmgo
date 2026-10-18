import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorBoundary from '../../components/ErrorBoundary'
import Icon from '../../components/Icon'
import LiquidGlass from '../../components/LiquidGlass'
import LiquidLogo from '../../components/LiquidLogo'
import { hasWebGL, isLowPower, isVeryLowPower, useInView, usePageVisible, useReducedMotion } from '../../lib/env'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'

const HeroScene = lazy(() => import('../../three/HeroScene'))

const CHIPS = [
  { cls: 'chip-a', icon: 'sparkle', label: 'Moslik 92%' },
  { cls: 'chip-b', icon: 'calendar', label: 'Intervyu · Sesh 14:00' },
  { cls: 'chip-c', icon: 'check', label: 'Taklif olindi' },
]

/** CSS-only stand-in for the 3D orb: shown while the scene loads and whenever WebGL is unavailable. */
function OrbFallback() {
  return <div className="orb-fallback" aria-hidden="true" />
}

function Stage() {
  const ref = useRef(null)
  const inView = useInView(ref, { rootMargin: '80px' })
  const visible = usePageVisible()
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  useEffect(() => { setEnabled(hasWebGL() && !isVeryLowPower()) }, [])
  return (
    <div ref={ref} className="hero__stage">
      <OrbFallback />
      {enabled && (
        <ErrorBoundary label="hero scene" fallback={null} onError={() => setEnabled(false)}>
          <Suspense fallback={null}>
            <div className="hero__canvas">
              <HeroScene paused={!inView || !visible} reduced={reduced} lowPower={isLowPower()} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
      {CHIPS.map((c) => (
        <LiquidGlass key={c.cls} className={`hero__chip hero__chip--${c.cls}`} radius={999} bezel={10} strength={14}>
          <Icon name={c.icon} size={16} /> {c.label}
        </LiquidGlass>
      ))}
    </div>
  )
}

export default function Hero() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create('.hero__title', { type: 'lines,words', mask: 'lines', autoSplit: true })
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(split.words, { yPercent: 110, duration: 1, stagger: 0.05 })
        .from('.hero__eyebrow, .hero__lead, .hero__cta > *', { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.08 }, '-=0.6')
        .from('.hero__stage', { autoAlpha: 0, scale: 0.92, duration: 1.2 }, '-=1.1')
        .from('.hero__chip', { autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.12 }, '-=0.7')
      return () => split.revert()
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} className="hero container" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__eyebrow eyebrow"><LiquidLogo size={28} /> Ilmgo · talabalar uchun</p>
        <h1 id="hero-title" className="hero__title">Kampusdan karyeragacha, <span className="grad-text">bitta orbitada.</span></h1>
        <p className="hero__lead lead">Koʻnikmalaringizga mos stajirovkalarni toping, bir necha daqiqada ariza topshiring, xat almashmasdan intervyuga yoziling va har bir arizangiz topshirilgandan taklifgacha qanday oʻtayotganini kuzating.</p>
        <div className="hero__cta">
          <LiquidGlass as={Link} to="/jobs" tone="tint" className="lg--cta" radius={999}>Stajirovkalarni koʻrish <Icon name="arrow-up-right" size={18} /></LiquidGlass>
          <LiquidGlass as={Link} to={{ pathname: '/', hash: '#app' }} className="lg--cta" radius={999}><Icon name="phone" size={18} /> Ilovani yuklash</LiquidGlass>
        </div>
      </div>
      <Stage />
    </section>
  )
}
