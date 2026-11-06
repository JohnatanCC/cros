import { useEffect } from 'react'
import { music } from '../../audio/music'
import { DevCamera } from '../../scenes/DevCamera'
import { Salao } from '../Salao'

// Região 1: a casa (térreo e andar de cima carregam juntos). Por enquanto só o salão em blocos.
// Próximas etapas (docs/roteiro.md): o agente e a câmera, os outros cômodos, os inimigos, a Mãe.

export default function CasaRegion() {
  useEffect(() => { music.want('amb') }, [])
  return (
    <>
      <hemisphereLight args={['#22304a', '#060504', 0.9]} />
      <directionalLight position={[-8, 9, 3]} color="#6f86b8" intensity={0.9} />
      <Salao />
      {/* onde o agente vai aparecer: a chegada, de frente para a escadaria */}
      <mesh position={[0, 0.9, 12]}>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshBasicMaterial color="#e8b765" wireframe />
      </mesh>
      <DevCamera target={[0, 1.6, 10]} bounds={[13.5, 15.5]} dist={6} theta={0.35} />
    </>
  )
}
