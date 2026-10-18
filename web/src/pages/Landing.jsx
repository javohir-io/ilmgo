import '../styles/landing.css'
import { useMeta } from '../lib/meta'
import { refreshAfterLayout } from '../lib/gsap'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import LiquidGlass from '../components/LiquidGlass'
import AppSection from './landing/AppSection'
import Bento from './landing/Bento'
import Hero from './landing/Hero'
import HowItWorks from './landing/HowItWorks'
import Marquee from './landing/Marquee'

export default function Landing() {
  useMeta({})
  useEffect(() => { refreshAfterLayout() }, [])
  return (
    <>
      <Hero />
      <Marquee />
      <HowItWorks />
      <Bento />
      <AppSection />
      <section className="section final" aria-labelledby="final-title">
        <div className="container final__box glass glass--lg">
          <h2 id="final-title" className="h-section">Parvozga <span className="grad-text">tayyormisiz?</span></h2>
          <p className="lead">Ochiq vakansiyalarni hoziroq koʻring — hisob ochish shart emas — ariza topshirishga tayyor boʻlganingizda ilovani yuklab oling.</p>
          <LiquidGlass as={Link} to="/jobs" tone="tint" className="lg--cta" radius={999}>Ochiq vakansiyalar <Icon name="arrow-up-right" size={18} /></LiquidGlass>
        </div>
      </section>
    </>
  )
}
