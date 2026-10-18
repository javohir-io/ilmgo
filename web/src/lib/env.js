import { useEffect, useState } from 'react'

const hasWindow = typeof window !== 'undefined'
const mq = (q) => (hasWindow && window.matchMedia ? window.matchMedia(q) : null)

export const prefersReducedMotion = () => !!mq('(prefers-reduced-motion: reduce)')?.matches

let webglCache
export function hasWebGL() {
  if (webglCache !== undefined) return webglCache
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    webglCache = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglCache = false
  }
  return webglCache
}

/** Coarse pointer, narrow viewport, low RAM/cores or data-saver => lighter effects. */
export function isLowPower() {
  if (!hasWindow) return false
  const nav = navigator
  return !!(
    mq('(pointer: coarse)')?.matches ||
    window.innerWidth < 720 ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) ||
    nav.connection?.saveData
  )
}

/** Very weak devices skip WebGL backgrounds altogether. */
export function isVeryLowPower() {
  if (!hasWindow) return false
  const nav = navigator
  return !!((nav.deviceMemory && nav.deviceMemory <= 2) || nav.connection?.saveData)
}

export function isChromium() {
  if (!hasWindow) return false
  const ua = navigator.userAgent || ''
  const brands = navigator.userAgentData?.brands?.map((b) => b.brand) || []
  const chromium = brands.includes('Chromium') || /Chrome\/|Chromium\//.test(ua)
  return chromium && !/Firefox\/|Edg?e?\/1[0-7]\b/.test(ua)
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => !!mq(query)?.matches)
  useEffect(() => {
    const m = mq(query)
    if (!m) return undefined
    const on = () => setMatches(m.matches)
    on()
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [query])
  return matches
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export function usePageVisible() {
  const [visible, setVisible] = useState(() => (hasWindow ? !document.hidden : true))
  useEffect(() => {
    const on = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}

/** True while `ref` intersects the viewport (with margin). */
export function useInView(ref, { rootMargin = '120px', once = false } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return undefined }
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (e.isIntersecting && once) io.disconnect()
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, once])
  return inView
}
