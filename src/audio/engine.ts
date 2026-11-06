import { useSettings } from '../game/settings'

// O contexto de áudio só pode nascer depois de um clique (regra dos navegadores).
// Saída: master <- music (trilhas) e master <- sfx (efeitos). Os volumes seguem as configurações.

class AudioEngine {
  ctx: AudioContext | null = null
  master!: GainNode
  music!: GainNode
  sfx!: GainNode
  private listeners: (() => void)[] = []

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      const ctx = new AudioContext()
      this.ctx = ctx
      this.master = ctx.createGain()
      this.master.connect(ctx.destination)
      this.music = ctx.createGain()
      this.music.connect(this.master)
      this.sfx = ctx.createGain()
      this.sfx.connect(this.master)
      this.applyVolumes()
      useSettings.subscribe(() => this.applyVolumes())
      this.listeners.forEach((f) => f())
    } catch {
      this.ctx = null // sem áudio neste navegador: o jogo segue mudo
    }
  }

  /** chamado quando o áudio fica disponível (ou na hora, se já estiver) */
  onReady(f: () => void) {
    if (this.ctx) f()
    else this.listeners.push(f)
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  private applyVolumes() {
    if (!this.ctx) return
    const s = useSettings.getState(), t = this.ctx.currentTime
    // curva perceptiva: o controle no meio soa "no meio"
    this.music.gain.setTargetAtTime(s.musicVolume * s.musicVolume, t, 0.05)
    this.sfx.gain.setTargetAtTime(s.sfxVolume * s.sfxVolume, t, 0.05)
  }
}

export const audio = new AudioEngine()
