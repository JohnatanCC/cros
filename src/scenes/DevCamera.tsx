import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'
import { useSettings } from '../game/settings'

// Câmera de desenvolvimento: arrastar gira em volta do alvo, a rodinha aproxima.
// Fica no lugar da câmera do agente até a etapa 1 (docs/roteiro.md). Usa a sensibilidade e o "inverter Y" das configurações.

// bounds: meia largura e meia profundidade do cômodo, para a câmera não atravessar a parede.
export function DevCamera({ target, bounds = [99, 99], dist = 7, theta = 0.4 }: { target: [number, number, number]; bounds?: [number, number]; dist?: number; theta?: number }) {
  const gl = useThree((s) => s.gl)
  const st = useRef({ theta, elev: 0.25, dist, drag: false })
  useEffect(() => {
    const el = gl.domElement
    const down = () => (st.current.drag = true)
    const up = () => (st.current.drag = false)
    const move = (e: PointerEvent) => {
      if (!st.current.drag || useGame.getState().screen !== 'playing') return
      const { sensitivity, invertY } = useSettings.getState()
      st.current.theta -= e.movementX * 0.005 * sensitivity
      st.current.elev = Math.max(-0.2, Math.min(1.3, st.current.elev + e.movementY * 0.005 * sensitivity * (invertY ? -1 : 1)))
    }
    const wheel = (e: WheelEvent) => (st.current.dist = Math.max(2, Math.min(28, st.current.dist * (1 + Math.sign(e.deltaY) * 0.1))))
    el.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointermove', move); el.addEventListener('wheel', wheel, { passive: true })
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointermove', move); el.removeEventListener('wheel', wheel) }
  }, [gl])
  useFrame(({ camera }) => {
    const s = st.current, c = Math.cos(s.elev)
    const x = target[0] + s.dist * c * Math.sin(s.theta), z = target[2] + s.dist * c * Math.cos(s.theta)
    camera.position.set(Math.max(-bounds[0], Math.min(bounds[0], x)), target[1] + s.dist * Math.sin(s.elev), Math.max(-bounds[1], Math.min(bounds[1], z)))
    camera.lookAt(target[0], target[1], target[2])
  })
  return null
}
