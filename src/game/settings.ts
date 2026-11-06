import { create } from 'zustand'
import { readJSON, writeJSON } from './storage'

export interface Settings {
  retro: boolean // o filtro PS1 (resolução baixa e vértices tremidos); desligado = modo limpo
  musicVolume: number // 0 a 1
  sfxVolume: number
  sensitivity: number // 0.2 a 3
  invertY: boolean
}

const KEY = 'cros.settings.v1'
export const DEFAULT_SETTINGS: Settings = { retro: true, musicVolume: 0.8, sfxVolume: 0.9, sensitivity: 1, invertY: false }

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...readJSON(KEY, DEFAULT_SETTINGS),
  set: (patch) => {
    set(patch)
    const { retro, musicVolume, sfxVolume, sensitivity, invertY } = { ...get(), ...patch }
    writeJSON(KEY, { retro, musicVolume, sfxVolume, sensitivity, invertY })
  },
  reset: () => get().set(DEFAULT_SETTINGS),
}))
