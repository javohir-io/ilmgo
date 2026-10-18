import { useRef } from 'react'
import { useInView } from '../lib/env'
import CountUp from './CountUp'

/** Signature "match ring": circular progress with a counted-up score. */
export default function MatchRing({ value = 0, size = 96, stroke = 8, label = 'moslik', className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { rootMargin: '0px', once: true })
  const r = 50 - stroke / 2
  const v = Math.max(0, Math.min(100, value))
  return (
    <div ref={ref} className={`ring ${className}`} style={{ width: size, height: size }} role="img" aria-label={`${v}% ${label}`}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--azure)" />
            <stop offset="0.55" stopColor="var(--sky)" />
            <stop offset="1" stopColor="var(--mist)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} className="ring__track" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} className="ring__bar" strokeWidth={stroke} pathLength="100"
          strokeDasharray="100" strokeDashoffset={inView ? 100 - v : 100} transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="ring__label"><CountUp to={v} suffix="%" duration={1.6} /></span>
    </div>
  )
}
