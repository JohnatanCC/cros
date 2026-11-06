import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useState, createElement } from 'react'
import { music } from '../audio/music'
import { useGame } from '../game/store'
import { regionComponent } from '../game/regions'
import { useSettings } from '../game/settings'
import { LightPool } from '../render/lightPool'
import { RETRO_LINES, setRetro } from '../render/psx'
import { MenuScene } from './MenuScene'

// O Canvas único do jogo. Troca a cena conforme a tela: título (menu, configurações, créditos),
// nada durante o carregamento, e a região atual jogando ou pausada.

function useDpr(retro: boolean) {
  const calc = () => (retro ? RETRO_LINES / Math.max(1, window.innerHeight) : Math.min(2, window.devicePixelRatio || 1))
  const [dpr, setDpr] = useState(calc)
  useEffect(() => {
    const f = () => setDpr(calc())
    f(); window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [retro]) // eslint-disable-line react-hooks/exhaustive-deps
  return dpr
}

function MusicTicker() {
  useFrame((_, dt) => music.update(Math.min(dt, 0.1)))
  return null
}

function RegionScene() {
  const region = useGame((s) => s.region)
  const C = region ? regionComponent(region) : null
  return C ? createElement(C) : null // o componente vem pronto do mapa de regiões já carregadas
}

export function GameCanvas() {
  const screen = useGame((s) => s.screen)
  const retro = useSettings((s) => s.retro)
  const dpr = useDpr(retro)
  useEffect(() => setRetro(retro), [retro])
  const titulo = screen === 'menu' || screen === 'settings' || screen === 'credits'
  const jogo = screen === 'playing' || screen === 'paused'
  return (
    <Canvas
      className="game-canvas"
      dpr={dpr}
      flat
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.05, far: 140, position: [0, 2, 6] }}
    >
      <color attach="background" args={['#050506']} />
      <fogExp2 attach="fog" args={['#050506', 0.035]} />
      <LightPool />
      <MusicTicker />
      {titulo && <MenuScene />}
      {jogo && <RegionScene />}
    </Canvas>
  )
}
