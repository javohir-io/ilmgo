import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from '../lib/env'

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

/** Animated number. Writes straight to the DOM node (no re-render per frame). */
export default function CountUp({ to = 0, from = 0, duration = 1.4, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const cur = useRef(from)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { rootMargin: '0px', once: true })
  const fmt = (v) => `${prefix}${decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()}${suffix}`
  const [initial] = useState(() => fmt(from))

  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return undefined
    if (reduced) { cur.current = to; el.textContent = fmt(to); return undefined }
    const start = cur.current
    const t0 = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / (duration * 1000))
      cur.current = start + (to - start) * easeOutExpo(p)
      el.textContent = fmt(cur.current)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, reduced, duration, decimals, prefix, suffix])

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="num">{initial}</span>
      <span className="sr-only">{fmt(to)}</span>
    </span>
  )
}
