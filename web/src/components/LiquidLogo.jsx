import { useEffect, useRef, useState } from 'react'
import { MARK_PATH, MARK_VIEWBOX } from '../lib/markPath'
import { hasWebGL, isLowPower, isVeryLowPower, useInView, usePageVisible, useReducedMotion } from '../lib/env'
import ErrorBoundary from './ErrorBoundary'
import Logo from './Logo'

/**
 * LiquidLogo: the Ilmgo mark drawn to an offscreen 2D canvas (lib/markPath.js), uploaded as a texture,
 * and shaded by a tiny WebGL fragment shader: simplex noise advected along the logo's edges (tangent of the
 * blurred-mask gradient) with a metallic Dark Azure / Light Azure palette. The static gradient <Logo> sits underneath
 * and is the fallback for no-WebGL, reduced motion and any failure. Inspired by liquid-logo (own implementation).
 */

const VERT = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`

const FRAG = `precision highp float;
varying vec2 vUv; uniform sampler2D uMask; uniform float uTime; uniform vec2 uTexel;
vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.); m = m * m; m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1.; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}
float blurMask(vec2 uv){
  float s = texture2D(uMask, uv).a;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; s += texture2D(uMask, uv + vec2(cos(a), sin(a)) * uTexel * 5.0).a; }
  return s / 9.0;
}
void main(){
  float m = texture2D(uMask, vUv).a;
  vec2 e = uTexel * 3.0;
  vec2 g = vec2(blurMask(vUv + vec2(e.x, 0.)) - blurMask(vUv - vec2(e.x, 0.)), blurMask(vUv + vec2(0., e.y)) - blurMask(vUv - vec2(0., e.y)));
  float gl = length(g);
  vec2 n = gl > 1e-4 ? g / gl : vec2(0.);
  vec2 tng = vec2(-n.y, n.x);
  float edge = smoothstep(0.0, 0.2, gl);
  float t = uTime;
  vec2 q = vUv * 3.2 + tng * t * 0.32;
  float n1 = snoise(q + vec2(0., t * 0.12));
  float n2 = snoise(q * 1.9 - tng * t * 0.2 + 7.3);
  float f = n1 * 0.65 + n2 * 0.35;
  float band = sin((f * 2.2 + vUv.x * 1.4 - vUv.y * 1.1 + t * 0.15) * 4.712);
  vec3 silver = vec3(.749, .847, .89); vec3 azure = vec3(0., .388, .557); vec3 sky = vec3(.549, .725, .8); vec3 deep = vec3(0., .29, .42); vec3 dark = vec3(.02, .035, .045);
  vec3 col = mix(dark, silver, smoothstep(-.9, .9, band));
  col = mix(col, azure, smoothstep(.1, .9, f) * .55 * (.4 + edge));
  col = mix(col, sky, smoothstep(.2, 1., -f) * .5 * (.3 + edge));
  col = mix(col, deep, smoothstep(.5, 1., n2) * .6);
  vec3 N = normalize(vec3(-g * 9., 1.));
  vec3 H = normalize(normalize(vec3(-.5, .6, .8)) + vec3(0., 0., 1.));
  col += pow(max(dot(N, H), 0.), 38.) * 1.1 + pow(1. - N.z, 1.5) * vec3(.55, .8, .92) * .45;
  col = clamp(col, 0., 1.);
  gl_FragColor = vec4(col * m, m);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed')
  return s
}

function Inner({ size, className }) {
  const wrap = useRef(null)
  const cv = useRef(null)
  const ctl = useRef(null)
  const [live, setLive] = useState(false)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const inView = useInView(wrap, { rootMargin: '80px' })
  const usable = !reduced && !failed && hasWebGL() && !isVeryLowPower()

  useEffect(() => {
    const canvas = cv.current
    if (!usable || !canvas) return undefined
    let disposed = false
    try {
      const dpr = isLowPower() ? 1 : Math.min(2, window.devicePixelRatio || 1)
      const px = Math.round(size * dpr)
      canvas.width = px
      canvas.height = px
      const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
      if (!gl) throw new Error('no webgl')

      const mask = document.createElement('canvas')
      mask.width = mask.height = px
      const mctx = mask.getContext('2d')
      mctx.scale(px / MARK_VIEWBOX, px / MARK_VIEWBOX)
      mctx.fillStyle = '#fff'
      mctx.fill(new Path2D(MARK_PATH))

      const prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link failed')
      gl.useProgram(prog)

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform1i(gl.getUniformLocation(prog, 'uMask'), 0)
      gl.uniform2f(gl.getUniformLocation(prog, 'uTexel'), 1 / px, 1 / px)
      const uTime = gl.getUniformLocation(prog, 'uTime')
      gl.viewport(0, 0, px, px)
      gl.clearColor(0, 0, 0, 0)

      const draw = (now) => {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(uTime, now / 1000)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      let raf = 0
      const loop = (now) => { draw(now); raf = requestAnimationFrame(loop) }
      ctl.current = {
        start() { if (!raf && !disposed) raf = requestAnimationFrame(loop) },
        stop() { cancelAnimationFrame(raf); raf = 0 },
      }
      draw(performance.now())
      setLive(true)
      const onLost = (e) => { e.preventDefault(); setFailed(true) }
      canvas.addEventListener('webglcontextlost', onLost)
      return () => {
        disposed = true
        ctl.current?.stop()
        ctl.current = null
        canvas.removeEventListener('webglcontextlost', onLost)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch (err) {
      console.warn('[ilmgo] liquid logo shader unavailable, using static mark:', err)
      setFailed(true)
      return undefined
    }
  }, [usable, size])

  useEffect(() => {
    if (inView && visible) ctl.current?.start()
    else ctl.current?.stop()
  }, [inView, visible, live])

  return (
    <div ref={wrap} className={`liquid-logo ${className}`} style={{ width: size, height: size }} role="img" aria-label="Ilmgo">
      <Logo size={size} className={`liquid-logo__svg ${live && usable ? 'is-hidden' : ''}`} />
      {usable && <canvas ref={cv} className={`liquid-logo__gl ${live ? 'is-live' : ''}`} style={{ width: size, height: size }} aria-hidden="true" />}
    </div>
  )
}

export default function LiquidLogo({ size = 96, className = '' }) {
  return (
    <ErrorBoundary label="liquid logo" fallback={<Logo size={size} decorative={false} />}>
      <Inner size={size} className={className} />
    </ErrorBoundary>
  )
}
