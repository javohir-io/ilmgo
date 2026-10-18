import { useCallback, useEffect, useRef, useState } from 'react'
import { countdown } from './format'

/** Generic data loader with abort + reload + local mutation. fn receives an AbortSignal. */
export function useFetch(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled })
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    if (!enabled) return undefined
    const ac = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fnRef.current(ac.signal)
      .then((data) => { if (!ac.signal.aborted) setState({ data, error: null, loading: false }) })
      .catch((error) => { if (error?.name !== 'AbortError' && !ac.signal.aborted) setState((s) => ({ data: s.data, error, loading: false })) })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])
  return { ...state, reload, setData }
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export function useCountdown(iso) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!iso) return undefined
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [iso])
  return countdown(iso, now)
}

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} · Ilmgo` : 'Ilmgo — From campus to career, in one orbit'
    return () => { document.title = prev }
  }, [title])
}

/** Trap Tab inside `ref` while `active`, close on Escape, restore focus on exit. */
export function useFocusTrap(ref, active, onClose) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!active || !ref.current) return undefined
    const root = ref.current
    const prev = document.activeElement
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    const focusables = () => [...root.querySelectorAll(sel)].filter((el) => el.offsetParent !== null || el === document.activeElement)
    const first = root.querySelector('[data-autofocus]') || focusables()[0] || root
    requestAnimationFrame(() => first.focus?.({ preventScroll: true }))
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current?.(); return }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (!list.length) { e.preventDefault(); return }
      const a = list[0]; const z = list[list.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    root.addEventListener('keydown', onKey)
    const lock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      root.removeEventListener('keydown', onKey)
      document.body.style.overflow = lock
      prev?.focus?.({ preventScroll: true })
    }
  }, [active, ref])
}
