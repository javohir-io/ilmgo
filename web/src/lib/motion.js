import { gsap, ScrollTrigger, useGSAP } from './gsap'

/**
 * Scroll reveals for any element carrying `data-reveal` inside `scopeRef`.
 *  data-reveal            -> the element rises 24px and fades in
 *  data-reveal="group"    -> its children stagger in (60ms, max 10 items)
 * Reduced motion: opacity-only fades. Content is never hidden by CSS, so it stays visible if JS fails.
 */
export function useReveal(scopeRef, deps = []) {
  useGSAP(() => {
    const root = scopeRef.current
    if (!root) return undefined
    const mm = gsap.matchMedia()
    const run = (move) => {
      root.querySelectorAll('[data-reveal]').forEach((el) => {
        const group = el.getAttribute('data-reveal') === 'group'
        const targets = group ? [...el.children].slice(0, 10) : el
        if (group && !targets.length) return
        gsap.from(targets, {
          autoAlpha: 0,
          y: move ? 24 : 0,
          duration: move ? 0.85 : 0.4,
          stagger: group && move ? 0.06 : 0,
          delay: Number(el.getAttribute('data-delay')) || 0,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
    }
    mm.add('(prefers-reduced-motion: no-preference)', () => run(true))
    mm.add('(prefers-reduced-motion: reduce)', () => run(false))
    return () => mm.revert()
  }, { scope: scopeRef, dependencies: deps, revertOnUpdate: true })
}

/** Stagger-in a list's direct children (used after data loads). Max 10 items animate. */
export function staggerIn(container, { y = 16, selector } = {}) {
  if (!container || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null
  const items = [...(selector ? container.querySelectorAll(selector) : container.children)].slice(0, 10)
  if (!items.length) return null
  return gsap.from(items, { autoAlpha: 0, y, duration: 0.7, stagger: 0.055, ease: 'expo.out', clearProps: 'transform,opacity,visibility' })
}

export { gsap, ScrollTrigger, useGSAP }
