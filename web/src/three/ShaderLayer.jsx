import { useEffect } from 'react'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { usePageVisible } from '../lib/env'
import { palette } from '../lib/tokens'

/**
 * Aurora mesh background (ShaderGradient). lightType stays "3d" (plain lights) on purpose:
 * "env" would pull an HDR from a CDN, and this app must work offline / under the backend's CSP.
 */
export default function ShaderLayer({ reduced, lowPower, onReady }) {
  const visible = usePageVisible()
  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 450)
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <ShaderGradientCanvas
      lazyLoad
      fov={45}
      pixelDensity={lowPower ? 1 : 1.25}
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0 }}
    >
      <ShaderGradient
        control="props"
        type="plane"
        animate={reduced || !visible ? 'off' : 'on'}
        uTime={reduced ? 6 : 0}
        uSpeed={0.12}
        uStrength={2.4}
        uDensity={1.3}
        uFrequency={5.5}
        uAmplitude={1}
        color1={palette.azureDeep}
        color2={palette.azure}
        color3={palette.sky}
        grain="on"
        lightType="3d"
        brightness={0.9}
        reflection={0.1}
        cAzimuthAngle={180}
        cPolarAngle={90}
        cDistance={2.8}
        cameraZoom={9.1}
        positionX={-1.4}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
      />
    </ShaderGradientCanvas>
  )
}
