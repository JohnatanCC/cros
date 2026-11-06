import { MUSICA } from '../game/tuning'
import { audio } from './engine'
import { COMBAT, makeCombat, type CombatEngine } from './combat'

// Quem decide a música é o jogo, a cada quadro: music.want('tensao'), music.want('combate:espectral')...
// O gerenciador sobe na hora para uma faixa mais urgente e, para descer, segura uns segundos (não fica piscando).
//
//  menu        tela de título
//  amb         explorando a casa
//  tensao      um fantasma procurando você
//  combate:X   perseguição sintetizada de cada fantasma (X = mae, espectral, glutao...); mais alta que a batalha
//  batalha_mae a luta no berçário (faixa do Suno)

export type MusicId = 'menu' | 'amb' | 'tensao' | 'batalha_mae' | `combate:${string}`

interface FileTrack {
  url: string
  vol: number // ganho da faixa (a perseguição sintetizada toca em 1.0: ela fica mais alta que a batalha)
  loop?: [number, number] // trecho em laço, em segundos (sem: a faixa inteira)
  resume?: boolean // volta de onde parou (ambiente e tensão); as outras recomeçam
}

const FILES: Record<string, FileTrack> = {
  menu: { url: 'audio/menu.mp3', vol: 0.6, resume: true },
  amb: { url: 'audio/amb_casa.mp3', vol: 0.6, resume: true },
  tensao: { url: 'audio/tensao.mp3', vol: 0.55, resume: true },
  batalha_mae: { url: 'audio/batalha_mae.mp3', vol: 0.5, loop: [2.2, 152.4] }, // os 2 primeiros segundos são mais baixos
}

const rank = (id: MusicId | null) => (!id ? 0 : id === 'menu' ? 0 : id === 'amb' ? 1 : id === 'tensao' ? 2 : id.startsWith('combate:') ? 3 : 4)

interface Playing {
  id: MusicId
  gain: GainNode
  src?: AudioBufferSourceNode
  t0?: number
  combat?: { eng: CombatEngine; b: number; tNext: number; dead: boolean }
}

interface LoopBuffer {
  buf: AudioBuffer
  a: number // início do laço (s)
  b: number // fim do laço (s)
}

class MusicManager {
  private bus: GainNode | null = null
  private buffers = new Map<string, LoopBuffer>()
  private loading = new Set<string>()
  private pos = new Map<string, number>()
  private cur: Playing | null = null
  private wanted: MusicId | null = null
  private lowT = 0

  /** o que deveria estar tocando agora (null = silêncio) */
  want(id: MusicId | null) {
    this.wanted = id
    if (id && FILES[id]) this.load(id)
  }

  get current() {
    return this.cur?.id ?? null
  }

  /** chamar a cada quadro */
  update(dt: number) {
    const ctx = audio.ctx
    if (!ctx) return
    if (!this.bus) {
      this.bus = ctx.createGain()
      this.bus.connect(audio.music)
    }
    this.tickCombat()
    const w = this.wanted, c = this.cur?.id ?? null
    if (w === c) { this.lowT = 0; return }
    if (rank(w) >= rank(c) || !c) { this.lowT = 0; this.play(w) }
    else {
      this.lowT += dt
      if (this.lowT > (rank(c) >= 3 ? MUSICA.segurarCombate : MUSICA.segurarOutras)) { this.lowT = 0; this.play(w) }
    }
  }

  private load(id: string) {
    const ctx = audio.ctx, f = FILES[id]
    if (!ctx || !f || this.buffers.has(id) || this.loading.has(id)) return
    this.loading.add(id)
    fetch(f.url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((a) => ctx.decodeAudioData(a))
      .then((b) => this.buffers.set(id, seamless(b, f.loop)))
      .catch(() => { /* faixa ausente: fica em silêncio */ })
      .finally(() => this.loading.delete(id))
  }

  private stopCurrent(fast: boolean) {
    const c = this.cur, ctx = audio.ctx
    if (!c || !ctx) return
    const t = ctx.currentTime
    c.gain.gain.cancelScheduledValues(t)
    c.gain.gain.setTargetAtTime(0.0001, t, fast ? 0.02 : c.id === 'amb' || c.id === 'menu' ? 0.35 : 0.9)
    if (c.src && c.t0 !== undefined) {
      const lb = this.buffers.get(c.id)
      if (lb && FILES[c.id]?.resume) this.pos.set(c.id, (t - c.t0) % (lb.b - lb.a))
      c.src.stop(t + (fast ? 0.2 : 5))
    }
    if (c.combat) c.combat.dead = true
    const g = c.gain
    setTimeout(() => { try { g.disconnect() } catch { /* já desligado */ } }, 6000)
    this.cur = null
  }

  private play(id: MusicId | null, fast = false) {
    const ctx = audio.ctx
    if (!ctx || !this.bus) return
    if (id && !id.startsWith('combate:') && !this.buffers.has(id)) { this.load(id); return } // ainda carregando: tenta no próximo quadro
    this.stopCurrent(fast)
    if (!id) return
    const t = ctx.currentTime, gain = ctx.createGain()
    gain.connect(this.bus)
    if (id.startsWith('combate:')) { // sintetizada: entra já no máximo, do começo
      const name = id.slice(8)
      if (!COMBAT[name]) return
      gain.gain.setValueAtTime(0.0001, t); gain.gain.setTargetAtTime(1, t, 0.04)
      this.cur = { id, gain, combat: { eng: makeCombat(name, ctx, gain, null), b: 0, tNext: t + 0.03, dead: false } }
      this.tickCombat()
      return
    }
    const f = FILES[id], lb = this.buffers.get(id)!
    const src = ctx.createBufferSource()
    src.buffer = lb.buf; src.loop = true; src.loopStart = lb.a; src.loopEnd = lb.b
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.setTargetAtTime(f.vol, t, id === 'amb' || id === 'menu' ? 1.2 : id === 'tensao' ? 0.6 : 0.12)
    src.connect(gain)
    const off = f.resume ? this.pos.get(id) ?? 0 : 0, L = lb.b - lb.a
    src.start(t, lb.a + (off % L))
    this.cur = { id, gain, src, t0: t - off }
  }

  private tickCombat() {
    const c = this.cur?.combat, ctx = audio.ctx
    if (!c || c.dead || !ctx) return
    while (c.tNext < ctx.currentTime + 0.35) { c.eng.bar(c.b % c.eng.NB, c.tNext); c.b++; c.tNext += c.eng.BAR }
  }
}

// o fim do trecho se funde no começo dele: o laço não tem emenda (e já começa no trecho)
function seamless(b: AudioBuffer, loop?: [number, number], fade = 1.5): LoopBuffer {
  const sr = b.sampleRate, a = Math.floor((loop?.[0] ?? 0) * sr), e = Math.min(b.length, loop ? Math.floor(loop[1] * sr) : b.length)
  const f = Math.min(Math.floor(fade * sr), (e - a) >> 2)
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c)
    for (let i = 0; i < f; i++) { const u = i / f; d[a + i] = d[a + i] * Math.sin((u * Math.PI) / 2) + d[e - f + i] * Math.cos((u * Math.PI) / 2) }
  }
  return { buf: b, a: a / sr, b: (e - f) / sr }
}

export const music = new MusicManager()
