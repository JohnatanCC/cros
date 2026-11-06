import { useEffect, useMemo } from 'react'
import { music } from '../../audio/music'
import { useLightSource } from '../../render/lightPool'
import { std } from '../../render/psx'
import { DevCamera } from '../../scenes/DevCamera'

// Região 2: o porão. Fora da fatia; existe só para testar a troca de região e a tela de carregamento.

export default function PoraoRegion() {
  useEffect(() => { music.want('tensao') }, [])
  const M = useMemo(() => ({ tijolo: std({ color: '#3a2620' }), ferro: std({ color: '#1e1c1c' }) }), [])
  useLightSource([3, 2.4, 0], '#ff8a3a', 2, 12) // a boca da caldeira
  return (
    <>
      <hemisphereLight args={['#1a1410', '#050404', 0.8]} />
      <mesh position={[0, -0.05, 0]} material={M.tijolo}><boxGeometry args={[20, 0.1, 20]} /></mesh>
      <mesh position={[0, 2, -10]} material={M.tijolo}><boxGeometry args={[20, 4, 0.2]} /></mesh>
      <mesh position={[-10, 2, 0]} material={M.tijolo}><boxGeometry args={[0.2, 4, 20]} /></mesh>
      <mesh position={[3, 1.3, 0]} material={M.ferro}><cylinderGeometry args={[1.2, 1.4, 2.6, 10]} /></mesh>
      <DevCamera target={[0, 1.2, 0]} bounds={[9.5, 9.5]} />
    </>
  )
}
