import { useEffect } from 'react'
import { useGame } from './game/store'
import { GameCanvas } from './scenes/GameCanvas'
import { CreditsScreen, Hud, LoadingScreen, PauseScreen, SettingsScreen, TitleScreen } from './ui/Menus'

export default function App() {
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const g = useGame.getState()
      if (g.screen === 'playing') g.pause()
      else if (g.screen === 'paused') g.resume()
      else if (g.screen === 'settings' || g.screen === 'credits') g.back()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  return (
    <>
      <GameCanvas />
      <div className={'ui ' + screen}>
        {screen === 'menu' && <TitleScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'credits' && <CreditsScreen />}
        {screen === 'loading' && <LoadingScreen />}
        {screen === 'playing' && <Hud />}
        {screen === 'paused' && <PauseScreen />}
      </div>
    </>
  )
}
