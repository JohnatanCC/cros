import { create } from 'zustand'
import { audio } from '../audio/engine'
import { music } from '../audio/music'
import { loadRegion, REGIONS, type RegionId } from './regions'
import { clearSave, loadSave, writeSave } from './save'

// Em que tela o jogo está. A cena 3D e a interface leem daqui.
export type Screen = 'menu' | 'settings' | 'credits' | 'loading' | 'playing' | 'paused'

const MIN_LOADING = 2.2 // a tela de carregamento fica pelo menos isso, para dar para ler a ficha

interface GameStore {
  screen: Screen
  settingsFrom: Screen // para onde Voltar leva, saindo das configurações
  region: RegionId | null
  checkpoint: string | null
  loadingTo: RegionId | null
  hasSave: boolean
  newGame: () => void
  continueGame: () => void
  goTo: (region: RegionId, checkpoint: string) => Promise<void>
  openSettings: () => void
  openCredits: () => void
  back: () => void
  pause: () => void
  resume: () => void
  quitToMenu: () => void
}

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000))

export const useGame = create<GameStore>((set, get) => ({
  screen: 'menu',
  settingsFrom: 'menu',
  region: null,
  checkpoint: null,
  loadingTo: null,
  hasSave: !!loadSave(),

  newGame: () => {
    audio.unlock()
    clearSave()
    void get().goTo('casa', 'chegada')
  },

  continueGame: () => {
    audio.unlock()
    const s = loadSave()
    if (s) void get().goTo(s.region, s.checkpoint)
  },

  goTo: async (region, checkpoint) => {
    set({ screen: 'loading', loadingTo: region })
    music.want(null)
    await Promise.all([loadRegion(region), wait(MIN_LOADING)])
    if (get().loadingTo !== region) return // trocou de ideia no meio
    writeSave(region, checkpoint)
    set({ screen: 'playing', region, checkpoint, loadingTo: null, hasSave: true })
  },

  openSettings: () => set({ settingsFrom: get().screen, screen: 'settings' }),
  openCredits: () => set({ screen: 'credits' }),
  back: () => set({ screen: get().screen === 'settings' ? get().settingsFrom : 'menu' }),
  pause: () => get().screen === 'playing' && set({ screen: 'paused' }),
  resume: () => get().screen === 'paused' && set({ screen: 'playing' }),
  quitToMenu: () => set({ screen: 'menu', region: null, checkpoint: null, loadingTo: null, hasSave: !!loadSave() }),
}))

export const regionName = (id: RegionId | null) => (id ? REGIONS[id].nome : '')
