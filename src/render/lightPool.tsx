import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// O conjunto fixo de luzes. Cada luz pontual pesa no sombreador e mudar o NÚMERO de luzes faz o three.js
// recompilar todos os materiais (o jogo trava). Então existem sempre POOL_SIZE luzes; a cada quadro elas vão
// para as fontes mais próximas da câmera e as que sobram ficam com intensidade zero. O resto da casa fica escuro.
//
// Uso: um componente registra uma fonte com useLightSource({ position, color, intensity, distance }).

export const POOL_SIZE = 8

export interface LightSource {
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  distance: number
  enabled: boolean
}

const sources = new Set<LightSource>()

export function addLightSource(s: LightSource) { sources.add(s); return () => { sources.delete(s) } }

/** registra uma fonte de luz enquanto o componente existir */
// O three.js novo usa unidades físicas (sem o fator π das versões antigas, como a r128 do laboratório).
// Multiplicar por LUZ mantém os números do laboratório valendo aqui.
const LUZ = Math.PI * 1.5

export function useLightSource(pos: [number, number, number], color: THREE.ColorRepresentation, intensity: number, distance: number) {
  // criada uma vez; quem chama pode mexer em intensity/enabled/position a cada quadro (piscar, apagar)
  const [src] = useState<LightSource>(() => ({ position: new THREE.Vector3(...pos), color: new THREE.Color(color), intensity, distance, enabled: true }))
  useEffect(() => addLightSource(src), [src])
  return src
}

const _list: LightSource[] = []

export function LightPool() {
  const lights = useRef<(THREE.PointLight | null)[]>([])
  useFrame(({ camera }) => {
    _list.length = 0
    for (const s of sources) if (s.enabled && s.intensity > 0) _list.push(s)
    const c = camera.position
    _list.sort((a, b) => a.position.distanceToSquared(c) - b.position.distanceToSquared(c))
    for (let i = 0; i < POOL_SIZE; i++) {
      const L = lights.current[i], s = _list[i]
      if (!L) continue
      if (s) { L.position.copy(s.position); L.color.copy(s.color); L.intensity = s.intensity * LUZ; L.distance = s.distance }
      else L.intensity = 0
    }
  })
  return (
    <>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <pointLight key={i} ref={(l) => { lights.current[i] = l }} intensity={0} decay={1.6} />
      ))}
    </>
  )
}
