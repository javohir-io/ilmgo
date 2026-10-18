import { useEffect, useId, useRef, useState } from 'react'
import { isChromium } from '../lib/env'

/**
 * LiquidGlass: the SVG-filter variant of the "liquid glass" idea (see README).
 *  - Chromium: backdrop-filter references an inline SVG filter. A displacement map (rounded-rect SDF,
 *    convex-lens profile, generated on a canvas for the element's real size) refracts the backdrop at
 *    the bezel, and feSpecularLighting draws a bright rim light.
 *  - Everywhere else: plain blur + saturate glass with a CSS rim highlight. Same markup, no JS cost.
 * It is NOT html2canvas / WebGL based.
 */

const REFRACT = typeof window !== 'undefined' && isChromium()

function buildMaps(w, h, radius, bezel) {
  const s = Math.min(1, 480 / Math.max(w, h))
  const cw = Math.max(2, Math.round(w * s))
  const ch = Math.max(2, Math.round(h * s))
  const r = Math.min(radius * s, cw / 2, ch / 2)
  const b = Math.max(2, bezel * s)
  const disp = document.createElement('canvas')
  const rim = document.createElement('canvas')
  disp.width = rim.width = cw
  disp.height = rim.height = ch
  const dctx = disp.getContext('2d')
  const rctx = rim.getContext('2d')
  if (!dctx || !rctx) return null
  const di = dctx.createImageData(cw, ch)
  const ri = rctx.createImageData(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const px = x + 0.5 - cw / 2
      const py = y + 0.5 - ch / 2
      const qx = Math.abs(px) - (cw / 2 - r)
      const qy = Math.abs(py) - (ch / 2 - r)
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
      const d = -(outside + Math.min(Math.max(qx, qy), 0) - r) // distance from the edge, inward
      let nx = 0
      let ny = 0
      if (qx > 0 || qy > 0) {
        nx = Math.sign(px) * Math.max(qx, 0)
        ny = Math.sign(py) * Math.max(qy, 0)
        const len = Math.hypot(nx, ny) || 1
        nx /= len; ny /= len
      } else if (qx > qy) nx = Math.sign(px) || 1
      else ny = Math.sign(py) || 1
      const t = Math.min(1, Math.max(0, d / b))
      const k = d < 0 ? 0 : 1 - Math.sqrt(1 - (1 - t) * (1 - t)) // 1 at the rim, 0 beyond the bezel
      const i = (y * cw + x) * 4
      di.data[i] = 128 - nx * k * 127
      di.data[i + 1] = 128
      di.data[i + 2] = 128 - ny * k * 127
      di.data[i + 3] = 255
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = 255
      ri.data[i + 3] = Math.round(k * k * 255)
    }
  }
  dctx.putImageData(di, 0, 0)
  rctx.putImageData(ri, 0, 0)
  return { disp: disp.toDataURL('image/png'), rim: rim.toDataURL('image/png') }
}

export default function LiquidGlass({ as: Tag = 'div', radius = 999, bezel = 14, strength = 22, tone = 'clear', className = '', style, children, ...rest }) {
  const ref = useRef(null)
  const fid = `lg-${useId().replace(/:/g, '')}`
  const [maps, setMaps] = useState(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    el.addEventListener('pointermove', onMove)
    if (!REFRACT || typeof ResizeObserver === 'undefined') return () => el.removeEventListener('pointermove', onMove)
    let timer
    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const w = Math.round(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width)
        const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
        setSize((p) => (p.w === w && p.h === h ? p : { w, h }))
      }, 80)
    })
    ro.observe(el)
    return () => { clearTimeout(timer); ro.disconnect(); el.removeEventListener('pointermove', onMove) }
  }, [])

  useEffect(() => {
    if (!REFRACT || size.w < 8 || size.h < 8) return
    try { setMaps(buildMaps(size.w, size.h, radius, bezel)) } catch { setMaps(null) }
  }, [size, radius, bezel])

  const refract = REFRACT && maps
  return (
    <Tag
      ref={ref}
      className={`lg lg--${tone} ${refract ? 'lg--refract' : ''} ${className}`}
      style={{ '--lg-r': `${radius}px`, ...(refract ? { '--lg-filter': `url(#${fid})` } : null), ...style }}
      {...rest}
    >
      {refract && (
        <svg className="lg__defs" width="0" height="0" aria-hidden="true" focusable="false">
          <filter id={fid} x="0" y="0" width={size.w} height={size.h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={maps.disp} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="B" result="refracted" />
            <feImage href={maps.rim} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="rim" />
            <feSpecularLighting in="rim" surfaceScale="3" specularConstant="1.1" specularExponent="22" lightingColor="#ffffff" result="spec">
              <feDistantLight azimuth="225" elevation="38" />
            </feSpecularLighting>
            <feComposite in="spec" in2="rim" operator="in" result="specIn" />
            <feBlend in="specIn" in2="refracted" mode="screen" />
          </filter>
        </svg>
      )}
      <span className="lg__content">{children}</span>
    </Tag>
  )
}
