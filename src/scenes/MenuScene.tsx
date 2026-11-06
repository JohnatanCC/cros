import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { music } from '../audio/music'
import { basic } from '../render/psx'
import { SALAO } from '../world/medidas'
import { Salao } from '../world/Salao'

// Fundo da tela de título: o salão escuro com a câmera girando devagar,
// e dois pontos azuis na galeria que às vezes andam e às vezes somem (alguém está olhando).

const eyeMat = basic({ color: '#7fe2ff' })

function OlhosNaGaleria() {
  const g = useRef<THREE.Group>(null)
  const st = useRef({ x: 7, alvo: 7, t: 0, aberto: 1 })
  useFrame((_, dt) => {
    const s = st.current, G = g.current
    if (!G) return
    s.t -= dt
    if (s.t <= 0) { s.alvo = -10 + Math.random() * 20; s.t = 4 + Math.random() * 5 }
    s.x += (s.alvo - s.x) * (1 - Math.exp(-0.4 * dt))
    s.aberto = Math.random() < 0.006 ? 0 : Math.min(1, s.aberto + dt * 3) // pisca
    G.position.set(s.x, SALAO.galeriaY + 1.62, -SALAO.d / 2 + 1.6)
    G.scale.set(1, Math.max(0.05, s.aberto), 1)
  })
  return (
    <group ref={g}>
      <mesh position={[-0.05, 0, 0]} material={eyeMat}><sphereGeometry args={[0.018, 6, 4]} /></mesh>
      <mesh position={[0.05, 0, 0]} material={eyeMat}><sphereGeometry args={[0.018, 6, 4]} /></mesh>
    </group>
  )
}

export function MenuScene() {
  useEffect(() => { music.want('menu') }, [])
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.05
    camera.position.set(Math.sin(t) * 6, 2.2 + Math.sin(t * 2.3) * 0.15, 11 + Math.cos(t) * 2)
    camera.lookAt(0, 4.4, -8)
  })
  return (
    <>
      <hemisphereLight args={['#22304a', '#060504', 1.0]} />
      <directionalLight position={[-8, 9, 3]} color="#6f86b8" intensity={1.0} />
      <Salao />
      <OlhosNaGaleria />
    </>
  )
}
