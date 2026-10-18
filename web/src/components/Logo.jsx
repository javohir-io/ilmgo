import { useId } from 'react'
import { MARK_PATH, MARK_VIEWBOX } from '../lib/markPath'

/** Static gradient mark. Also the no-WebGL fallback of <LiquidLogo>. */
export default function Logo({ size = 32, className = '', decorative = true, title = 'Ilmgo' }) {
  const id = `lp-${useId().replace(/:/g, '')}`
  return (
    <svg
      className={className} width={size} height={size} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      role={decorative ? undefined : 'img'} aria-hidden={decorative ? 'true' : undefined} aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--azure)" />
          <stop offset="0.55" stopColor="var(--sky)" />
          <stop offset="1" stopColor="var(--mist)" />
        </linearGradient>
      </defs>
      <path d={MARK_PATH} fill={`url(#${id})`} />
    </svg>
  )
}

export function Wordmark({ size = 28 }) {
  return (
    <span className="brand__lockup">
      <Logo size={size} />
      <span className="brand__name">Ilmgo</span>
    </span>
  )
}
