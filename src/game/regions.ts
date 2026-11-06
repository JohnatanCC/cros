import type { ComponentType } from 'react'

// O mapa é dividido em regiões; trocar de região passa pela tela de carregamento.
// Cada região é um módulo carregado sob demanda (code splitting): só o que está em cena fica na memória.

export type RegionId = 'casa' | 'porao'

export interface Checkpoint {
  id: string
  nome: string
  pos: [number, number, number]
  yaw: number
}

export interface RegionDef {
  id: RegionId
  nome: string // aparece na tela de carregamento
  lugar: string
  ficha: string // uma linha da ficha do caso, embaixo do nome
  checkpoints: Checkpoint[]
  load: () => Promise<{ default: ComponentType }>
}

export const REGIONS: Record<RegionId, RegionDef> = {
  casa: {
    id: 'casa',
    nome: 'O Palacete Monteval',
    lugar: 'Interior de São Paulo · fechado desde 1952',
    ficha: 'A cidade fala de luz nas janelas e de uma canção de ninar.',
    checkpoints: [
      { id: 'chegada', nome: 'Salão principal', pos: [0, 0, 12], yaw: Math.PI },
      { id: 'patamar', nome: 'Patamar', pos: [0, 5, -12], yaw: Math.PI },
      { id: 'porta-bercario', nome: 'Porta do berçário', pos: [18, 5, -14], yaw: -Math.PI / 2 },
    ],
    load: () => import('../world/regions/CasaRegion'),
  },
  porao: {
    id: 'porao',
    nome: 'O porão',
    lugar: 'Palacete Monteval · casa da caldeira e adega',
    ficha: 'O incêndio de 23 de junho de 1930 começou aqui embaixo.',
    checkpoints: [{ id: 'escada', nome: 'Pé da escada de serviço', pos: [0, 0, 0], yaw: 0 }],
    load: () => import('../world/regions/PoraoRegion'),
  },
}

// os módulos já carregados (a cena lê daqui depois da tela de carregamento)
const loaded = new Map<RegionId, ComponentType>()
export const regionComponent = (id: RegionId) => loaded.get(id) ?? null
export async function loadRegion(id: RegionId) {
  const mod = await REGIONS[id].load()
  loaded.set(id, mod.default)
  return mod.default
}
