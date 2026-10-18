// Single place to register GSAP plugins (all free in the public `gsap` package).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP)
gsap.defaults({ ease: 'expo.out', duration: 0.75 })

let refreshQueued = false
/** Re-measure ScrollTrigger after layout settles (fonts, images, lazy chunks). Debounced. */
export function refreshAfterLayout() {
  if (refreshQueued) return
  refreshQueued = true
  const go = () => { refreshQueued = false; ScrollTrigger.refresh() }
  const fire = () => requestAnimationFrame(() => setTimeout(go, 60))
  if (document.fonts?.ready) document.fonts.ready.then(fire).catch(fire)
  else fire()
  if (document.readyState !== 'complete') window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
}

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP }
