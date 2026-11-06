import type { RegionId } from './regions'
import { readJSON, removeKey, writeJSON } from './storage'

// O jogo salva só nos pontos salvos (chegada, patamar, porta do berçário). Morrer volta para o último.

export interface SaveData {
  region: RegionId
  checkpoint: string
  savedAt: number
}

const KEY = 'cros.save.v1'
const EMPTY = { region: null, checkpoint: null, savedAt: 0 }

export function loadSave(): SaveData | null {
  const s = readJSON<SaveData | typeof EMPTY>(KEY, EMPTY)
  return s.region && s.checkpoint ? (s as SaveData) : null
}

export function writeSave(region: RegionId, checkpoint: string) {
  writeJSON(KEY, { region, checkpoint, savedAt: Date.now() })
}

export function clearSave() {
  removeKey(KEY)
}
