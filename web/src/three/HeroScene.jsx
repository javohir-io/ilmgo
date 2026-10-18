import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, MeshDistortMaterial } from '@react-three/drei'
import { palette } from '../lib/tokens'

/**
 * Hero centrepiece: a liquid-chrome orb wrapped by two orbit rings and a field of tiny sparks.
 * Everything is procedural and lit by Lightformers, so there is no HDR/CDN download (works offline).
 * `paused` switches the render loop off (off-screen / hidden tab); `reduced` freezes motion.
 */
function Orb({ reduced, lowPower }) {
  const group = useRef()
  const orb = useRef()
  useFrame((state, delta) => {
    if (!group.current) return
    const px = reduced ? 0 : state.pointer.x
    const py = reduced ? 0 : state.pointer.y
    // pointer parallax: ease the group toward the cursor (damped, frame-rate independent)
    const k = 1 - Math.exp(-delta * 4)
    group.current.rotation.y += (px * 0.5 - group.current.rotation.y) * k
    group.current.rotation.x += (-py * 0.3 - group.current.rotation.x) * k
    if (orb.current && !reduced) orb.current.rotation.y += delta * 0.12
  })
  return (
    <group ref={group}>
      <Float speed={reduced ? 0 : 1.4} rotationIntensity={0.25} floatIntensity={0.6}>
        <mesh ref={orb}>
          <icosahedronGeometry args={[1.35, lowPower ? 24 : 48]} />
          <MeshDistortMaterial color="#dcecf3" metalness={1} roughness={0.12} distort={reduced ? 0.18 : 0.34} speed={reduced ? 0 : 1.6} envMapIntensity={1.4} />
        </mesh>
      </Float>
      <Ring radius={2.05} tilt={[1.2, 0.3, 0]} color={palette.sky} speed={0.35} reduced={reduced} />
      <Ring radius={2.55} tilt={[0.5, -0.4, 0.6]} color={palette.mist} speed={-0.24} reduced={reduced} />
    </group>
  )
}

function Ring({ radius, tilt, color, speed, reduced }) {
  const ref = useRef()
  useFrame((_, delta) => { if (ref.current && !reduced) ref.current.rotation.z += delta * speed })
  return (
    <group rotation={tilt}>
      <mesh ref={ref}>
        <torusGeometry args={[radius, 0.012, 12, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
        <mesh position={[radius, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </mesh>
    </group>
  )
}

function Sparks({ count, reduced }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const r = 3 + Math.random() * 3.5
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      a[i * 3] = r * Math.sin(p) * Math.cos(t)
      a[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
      a[i * 3 + 2] = r * Math.cos(p)
    }
    return a
  }, [count])
  useFrame((_, delta) => { if (ref.current && !reduced) ref.current.rotation.y += delta * 0.02 })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#ffffff" transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function HeroScene({ paused = false, reduced = false, lowPower = false }) {
  return (
    <Canvas
      frameloop={paused ? 'never' : 'always'}
      dpr={lowPower ? 1 : [1, 2]}
      camera={{ position: [0, 0, 6.2], fov: 38 }}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      aria-hidden="true"
    >
      <ambientLight intensity={0.25} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} color={palette.azure} position={[-4, 2, 3]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={3.5} color={palette.sky} position={[4, 0, 2]} scale={[5, 4, 1]} />
        <Lightformer form="ring" intensity={3} color={palette.mist} position={[0, -3, 3]} scale={4} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 4, -3]} scale={[8, 2, 1]} />
      </Environment>
      <Orb reduced={reduced} lowPower={lowPower} />
      <Sparks count={lowPower ? 60 : 160} reduced={reduced} />
    </Canvas>
  )
}
