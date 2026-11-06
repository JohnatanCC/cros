// @ts-nocheck -- porta literal do laboratório (JavaScript sem tipos); os tipos públicos ficam em CombatPreset e CombatEngine
// A música de combate sintetizada, portada do laboratório (laboratorio.html, makeCombat).
// Um laço de 40 compassos (1:00) a 160 BPM em Ré menor, tocado em tempo real: um compasso agendado por vez.
// Todos os fantasmas usam a mesma partitura (tambores desde o primeiro tempo, baixo e cordas em semicolcheias,
// o motivo Ré Fá Mi Mi♭ Ré como tema); muda a cor: o instrumento do tema, a caixa e os efeitos de cada um.
// Código mantido igual ao do laboratório de propósito, para as duas versões soarem idênticas.

export interface CombatPreset {
  lead: 'musicbox' | 'toypiano' | 'harpsi' | 'glitch' | 'horn' | 'wail' | 'gut'
  oct: number
  extras: string[]
  snare: 'snare' | 'metal' | 'anvil'
  heavy?: boolean
  orch?: boolean
  wobble?: boolean
}

export interface CombatEngine {
  bar: (b: number, t0: number) => void
  master: GainNode
  NB: number
  BAR: number
}

export const COMBAT: Record<string, CombatPreset> = {
  mae: { lead: 'musicbox', oct: 3, extras: ['hum', 'glass'], snare: 'snare' },
  amigo: { lead: 'toypiano', oct: 2, extras: ['limp', 'roar', 'spider'], snare: 'metal', heavy: true },
  sombra: { lead: 'glitch', oct: 2, extras: ['static'], snare: 'metal' },
  desc: { lead: 'harpsi', oct: 2, extras: ['scream', 'screech'], snare: 'anvil', orch: true },
  garota: { lead: 'musicbox', oct: 3, wobble: true, extras: ['bite'], snare: 'snare' },
  observador: { lead: 'horn', oct: 1, extras: ['gallop', 'crack'], snare: 'snare' },
  espectral: { lead: 'wail', oct: 3, extras: ['hiss', 'bones', 'screech'], snare: 'snare' }, // um lamento que desliza como cobra, chiado e vértebras estalando
  glutao: { lead: 'gut', oct: 1, extras: ['roar', 'bones', 'gulp'], snare: 'metal', heavy: true }, // o tema rosnado no grave, os engolidos
}
export function makeCombat(name: string, ac: BaseAudioContext, dest: AudioNode, verbIn: AudioNode | null): CombatEngine { // ac: o contexto (o do jogo, ou um offline para gerar a prévia); verbIn: para onde vai o eco
  const C = COMBAT[name], ST = 60 / 160 / 4, BAR = ST * 16, NB = 40 // 160 BPM: 40 compassos = 1:00
  let seed = 1234 + name.length * 77; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1
  const master = ac.createGain(); master.gain.value = 0.7
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 4; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12
  master.connect(comp); comp.connect(dest)
  let verb = verbIn
  if (!verb) { const ir = ac.createBuffer(2, Math.floor(ac.sampleRate * 1.8), ac.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3) * 0.5 } verb = ac.createConvolver(); verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.3; verb.connect(vg); vg.connect(master) }
  const vSend = ac.createGain(); vSend.gain.value = verbIn ? 0.5 : 1; vSend.connect(verb)
  const pan = (x) => { const p = ac.createStereoPanner(); p.pan.value = x; p.connect(master); return p }
  const P = { c: pan(0), l: pan(-0.35), r: pan(0.35), ll: pan(-0.7), rr: pan(0.7) }
  const wet = (n, amt = 1) => { const s = ac.createGain(); s.gain.value = amt; n.connect(s); s.connect(vSend) }
  const shp = (k) => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k) } const w = ac.createWaveShaper(); w.curve = c; return w }
  // barramentos fixos: o baixo saturado; as cordas graves e os violinos com um filtro só cada; o sintetizador do tema distorcido
  const bassSat = shp(4), bassBus = ac.createGain(); bassBus.gain.value = 0.55; bassBus.connect(bassSat); const bsG = ac.createGain(); bsG.gain.value = 0.5; bassSat.connect(bsG); bsG.connect(P.c)
  const filt = (type, f, q, to) => { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; x.connect(to); return x }
  const lowL = filt('lowpass', 2600, 0.8, P.l), lowR = filt('lowpass', 2600, 0.8, P.r); wet(lowL, 0.3); wet(lowR, 0.3)
  const vioL = filt('lowpass', 7000, 0.7, P.ll), vioR = filt('lowpass', 7000, 0.7, P.rr); wet(vioL, 0.5); wet(vioR, 0.5)
  const synSat = shp(3), synF = filt('lowpass', 3200, 1.5, P.c); synSat.connect(synF); wet(synF, 0.4)
  const brSat = shp(2.5), brG = ac.createGain(); brG.gain.value = 0.6; brSat.connect(brG); brG.connect(P.c); wet(brG, 0.6)
  const vca = (t, a, peak, d, to) => { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(to); return g }
  const osc = (type, f, t, dur, to, f2, glide) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || dur)); o.connect(to); o.start(t); o.stop(t + dur + 0.05); return o }
  const noise = (t, dur, type, f, q, gain, to, a = 0.001) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(vca(t, a, gain, dur, to)); s.start(t, rnd() * 0.9); s.stop(t + a + dur + 0.05); return fl }
  // percussão
  const kick = (t, g = 1) => { osc('sine', C.heavy ? 140 : 165, t, 0.4, vca(t, 0.001, 1.0 * g, C.heavy ? 0.42 : 0.3, P.c), 44, 0.07); noise(t, 0.012, 'bandpass', 3200, 1, 0.35 * g, P.c); if (C.heavy) osc('sine', 48, t, 0.35, vca(t, 0.005, 0.5 * g, 0.3, P.c)) }
  const snare = (t, g = 1) => {
    osc('triangle', 210, t, 0.15, vca(t, 0.001, 0.45 * g, 0.11, P.c), 160, 0.06)
    const n = noise(t, 0.2, 'highpass', 1600, 0.7, 0.55 * g, P.c); wet(n, 0.35)
    if (C.snare === 'metal') { const v = vca(t, 0.001, 0.05 * g, 0.2, P.c); ;[540, 803, 1271].forEach((fr) => osc('square', fr, t, 0.25, v)) }
    if (C.snare === 'anvil') { const v = vca(t, 0.001, 0.08 * g, 0.4, P.r); ;[1180, 1870, 2950].forEach((f) => osc('triangle', f, t, 0.45, v)); wet(v, 0.5) }
  }
  const hat = (t, g = 1, open) => noise(t, open ? 0.22 : 0.03, 'highpass', 8500, 0.8, (open ? 0.12 : 0.09) * g, open ? P.r : P.rr)
  const crash = (t, g = 1) => { const n = noise(t, 1.6, 'highpass', 4200, 0.6, 0.22 * g, P.l); wet(n, 0.5); noise(t, 1.0, 'bandpass', 9000, 2, 0.08 * g, P.r) }
  const tom = (t, f, g = 1, p = P.c) => { osc('sine', f * 1.8, t, 0.35, vca(t, 0.001, 0.6 * g, 0.28, p), f, 0.06); noise(t, 0.08, 'bandpass', f * 3, 1.2, 0.15 * g, p) }
  const timp = (t, f, g = 1) => { const v = vca(t, 0.003, 0.75 * g, 0.7, P.c); osc('sine', f * 1.03, t, 0.8, v, f, 0.12); osc('triangle', f * 1.5, t, 0.4, vca(t, 0.003, 0.15 * g, 0.35, P.c)); noise(t, 0.06, 'lowpass', 500, 0.8, 0.4 * g, P.c); wet(v, 0.5) }
  const impact = (t, g = 1) => { osc('sine', 75, t, 1.6, vca(t, 0.002, 1.1 * g, 1.4, P.c), 28, 1.2); const n = noise(t, 0.9, 'lowpass', 500, 0.7, 0.6 * g, P.c); wet(n, 0.8); crash(t, 1.2 * g) }
  const riser = (t, dur, g = 1) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 2.5; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur); const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.3 * g, t + dur); v.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02); s.connect(fl); fl.connect(v); v.connect(P.c); wet(v, 0.6); s.start(t); s.stop(t + dur + 0.05); osc('sawtooth', 110, t, dur, vca(t, dur * 0.9, 0.07 * g, dur * 0.1, synSat), 880, dur) }
  // harmonia e melodia
  const bass = (t, f, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(1300, t); fl.frequency.exponentialRampToValueAtTime(220, t + dur); fl.connect(vca(t, 0.002, 0.55 * g, dur, bassBus)); osc('sawtooth', f, t, dur, fl); osc('square', f / 2, t, dur, fl) }
  const low = (t, f, dur, g = 1, bus = lowL) => { const v = vca(t, 0.004, 0.2 * g, dur, bus); osc('sawtooth', f, t, dur, v).detune.value = 8; osc('sawtooth', f, t, dur, v).detune.value = -8 }
  const vio = (t, f, dur, g = 1, bus = vioL) => { const v = vca(t, 0.003, 0.085 * g, dur, bus); osc('sawtooth', f, t, dur, v).detune.value = 6; osc('sawtooth', f * 1.002, t, dur, v).detune.value = -9 }
  const braam = (t, f, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(180, t); fl.frequency.exponentialRampToValueAtTime(1600, t + 0.25); fl.frequency.exponentialRampToValueAtTime(400, t + dur); fl.connect(vca(t, 0.03, 0.32 * g, dur, brSat)); ;[f, f * 1.498, f * 2, f / 2].forEach((x) => { osc('sawtooth', x, t, dur + 0.1, fl).detune.value = (rnd() - 0.5) * 16 }) }
  const stab = (t, fs, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(600, t); fl.frequency.linearRampToValueAtTime(2800, t + 0.02); fl.frequency.exponentialRampToValueAtTime(600, t + dur); fl.connect(vca(t, 0.005, 0.22 * g, dur, brSat)); fs.forEach((f) => { osc('sawtooth', f, t, dur, fl).detune.value = (rnd() - 0.5) * 12 }) }
  const choir = (t, fs, dur, g = 1) => { const v = vca(t, 0.25, 0.05 * g, dur, P.l); wet(v, 1.2); const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.value = 4; vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.4); ;[[760, 6, 1], [1220, 8, 0.6], [2650, 10, 0.25]].forEach(([fr, q, a]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; const ga = ac.createGain(); ga.gain.value = a * 3; b.connect(ga); ga.connect(v); fs.forEach((f) => { const o = osc('sawtooth', f, t, dur + 0.3, b); vg.connect(o.detune) }) }) }
  const synth = (t, f, dur, g = 1) => { const v = vca(t, 0.004, 0.13 * g, dur, synSat); osc('sawtooth', f, t, dur, v).detune.value = 10; osc('square', f, t, dur, v).detune.value = -10 }
  const lead = (t, f, dur, g0 = 1) => {
    const k = C.lead, g = g0 * 1.5
    if (k === 'musicbox') { const fw = C.wobble ? f * (1 - 0.025 * rnd()) : f; const v = vca(t, 0.002, 0.22 * g, 0.9, P.ll); wet(v, 0.9); osc('sine', fw, t, 1.0, v, C.wobble ? fw * 0.985 : 0, 0.8); osc('sine', fw * 3.01, t, 0.4, vca(t, 0.002, 0.06 * g, 0.3, P.ll)); osc('sine', fw * 5.4, t, 0.2, vca(t, 0.002, 0.025 * g, 0.15, P.ll)) }
    if (k === 'toypiano') { const v = vca(t, 0.002, 0.26 * g, 0.5, P.ll); wet(v, 0.6); osc('triangle', f, t, 0.55, v).detune.value = 28; osc('sine', f * 2.76, t, 0.3, vca(t, 0.002, 0.09 * g, 0.25, P.ll)); osc('sine', f * 5.4, t, 0.15, vca(t, 0.002, 0.04 * g, 0.12, P.ll)) }
    if (k === 'harpsi') { const fl = ac.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 350; const v = vca(t, 0.001, 0.16 * g, 0.45, P.ll); fl.connect(v); wet(v, 0.6); osc('sawtooth', f, t, 0.5, fl).detune.value = -18; osc('sawtooth', f * 2, t, 0.35, fl).detune.value = 14 }
    if (k === 'glitch') { const v = ac.createGain(); v.connect(P.ll); wet(v, 0.4); v.gain.setValueAtTime(0, t); for (let u = 0; u < dur; u += 0.03) v.gain.setValueAtTime(rnd() < 0.7 ? 0.1 * g : 0, t + u); v.gain.setValueAtTime(0, t + dur); osc('square', f, t, dur, v); osc('square', f * 1.005, t, dur, v) }
    if (k === 'wail') { const v = vca(t, 0.03, 0.11 * g, dur, P.l); wet(v, 1); const o = osc('sine', f * 0.94, t, dur + 0.05, v, f, Math.min(0.12, dur * 0.4)); const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5; vg.gain.value = f * 0.02; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.1); osc('triangle', f * 2, t, dur, vca(t, 0.03, 0.03 * g, dur, P.r)) } // lamento de fantasma, deslizando para a nota
    if (k === 'gut') { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 700; fl.Q.value = 4; const v = vca(t, 0.01, 0.3 * g, dur, P.c); fl.connect(v); wet(v, 0.5); osc('sawtooth', f, t, dur, fl).detune.value = 12; osc('sawtooth', f * 0.5, t, dur, fl).detune.value = -12; const am = ac.createOscillator(), ag = ac.createGain(); am.frequency.value = 27; ag.gain.value = 0.15 * g; am.connect(ag); ag.connect(v.gain); am.start(t); am.stop(t + dur + 0.1) } // o tema rosnado, de garganta enorme
    if (k === 'horn') { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900; fl.Q.value = 2; const v = vca(t, 0.04, 0.28 * g, dur, P.l); fl.connect(v); wet(v, 0.7); osc('sawtooth', f, t, dur, fl, f * 0.95, dur); osc('sawtooth', f / 2, t, dur, fl, f / 2 * 0.95, dur) }
  }
  // as cores dos fantasmas
  const roar = (t, dur = 1.3, g = 1) => { const v = vca(t, 0.06, 0.5 * g, dur, P.c); wet(v, 0.5); const am = ac.createOscillator(), ag = ac.createGain(); am.frequency.value = 31; ag.gain.value = 0.3; am.connect(ag); ag.connect(v.gain); am.start(t); am.stop(t + dur + 0.2); osc('sawtooth', 62, t, dur, v, 41, dur); osc('sawtooth', 93, t, dur, v, 60, dur); noise(t, dur, 'bandpass', 340, 1.5, 0.35 * g, v) }
  const scrape = (t, g = 1) => { const f = noise(t, 0.4, 'bandpass', 900, 3, 0.35 * g, P.c, 0.02); f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.4) }
  const click = (t, g = 1) => noise(t, 0.012, 'bandpass', 3800, 3, 0.25 * g, rnd() < 0.5 ? P.ll : P.rr)
  const stat = (t, dur, g = 1) => { const v = ac.createGain(); v.connect(P.rr); v.gain.setValueAtTime(0, t); for (let u = 0; u < dur; u += 0.02) v.gain.setValueAtTime(rnd() < 0.55 ? 0.16 * g : 0, t + u); v.gain.setValueAtTime(0, t + dur); const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 2400; fl.Q.value = 1; s.connect(fl); fl.connect(v); s.start(t); s.stop(t + dur + 0.05) }
  const bite = (t, g = 1) => { osc('sine', 85, t, 0.3, vca(t, 0.003, 0.7 * g, 0.22, P.c), 45, 0.1); const f = noise(t + 0.02, 0.16, 'lowpass', 700, 6, 0.35 * g, P.c); f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(250, t + 0.18) }
  const hum = (t, dur, f, g = 1) => { const v = vca(t, 0.3, 0.09 * g, dur, P.l); wet(v, 1); const vib = ac.createOscillator(), vgn = ac.createGain(); vib.frequency.value = 5; vgn.gain.value = f * 0.012; vib.connect(vgn); vib.start(t); vib.stop(t + dur + 0.5); ;[[330, 6], [820, 8]].forEach(([fr, q]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; b.connect(v); const o = osc('sawtooth', f, t, dur + 0.4, b, f * 0.94, dur); vgn.connect(o.frequency) }) }
  const glass = (t, f, dur, g = 1) => { const v = vca(t, dur * 0.5, 0.06 * g, dur * 0.5, P.rr); wet(v, 1); const o = osc('sine', f, t, dur, v); const vib = ac.createOscillator(), vgn = ac.createGain(); vib.frequency.value = 6.5; vgn.gain.value = f * 0.012; vib.connect(vgn); vgn.connect(o.frequency); vib.start(t); vib.stop(t + dur) }
  const scream = (t, dur, g = 1) => { const v = vca(t, 0.12, 0.07 * g, dur, P.r); wet(v, 1); ;[[760, 5], [1220, 6]].forEach(([fr, q]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; b.connect(v); ;[587, 622, 880].forEach((f) => { osc('sawtooth', f, t, dur, b, f * (1.12 + rnd() * 0.1), dur).detune.value = (rnd() - 0.5) * 30 }) }) }
  const screech = (t, dur, g = 1) => { ;[1175, 1245].forEach((f, i) => { const v = vca(t, 0.02, 0.03 * g, dur, i ? P.rr : P.ll); wet(v, 0.8); osc('sawtooth', f, t, dur, v, f * 1.06, dur) }) }
  const crack = (t, g = 1) => noise(t, 0.05, 'bandpass', 2200, 3, 0.35 * g, rnd() < 0.5 ? P.l : P.r)
  // a partitura: Rém, Si♭, Dó, Lá, Rém, Si♭, Mi♭ (o pavor), Lá
  const ROOTS = [0, -4, -2, -5, 0, -4, 1, -5], QUAL = [3, 4, 4, 4, 3, 4, 4, 4] // terça menor (3) ou maior (4)
  const D2 = 73.42, hz = (base, semi) => base * Math.pow(2, semi / 12)
  const LOWP = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, 12] // cordas graves em semicolcheias
  const VIOP = [12, 7, 3, 7, 12, 7, 3, 7, 15, 12, 7, 12, 15, 12, 7, 3] // violinos: arpejo rápido do acorde (a terça entra conforme o acorde)
  const MOTIF = [[0, 0, 2], [2, 3, 2], [4, 2, 2], [6, 1, 2], [8, 0, 4], [12, 3, 2], [14, 5, 2], [16, 7, 4], [20, 5, 2], [22, 3, 2], [24, 2, 4], [28, 1, 4]] // o motivo em colcheias: Ré Fá Mi Mi♭ Ré · Fá Sol Lá Sol Fá Mi Mi♭
  const KA = [0, 3, 4, 6, 8, 10, 11, 12, 14], KB = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15], GALLOP = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
  const sec = (b) => (b < 8 ? 'combate' : b < 16 ? 'tema' : b < 24 ? 'ataque' : b < 28 ? 'quebra' : b < 36 ? 'tema2' : 'combate')
  const EX = new Set(C.extras)
  function bar(b, t0) {
    const S = sec(b), r = ROOTS[b % 8], q3 = QUAL[b % 8], quebra = S === 'quebra', atk = S === 'ataque', tema = S === 'tema' || S === 'tema2', big = atk || S === 'tema2'
    const spider = EX.has('spider') && b >= 20 && b < 24, limp = EX.has('limp') && b >= 16 && b < 20
    const fill = b % 4 === 3, secStart = b === 0 || b === 8 || b === 16 || b === 28 || b === 36
    if (secStart) impact(t0, b === 0 || b === 28 ? 1 : 0.7); else if (b % 2 === 0 && big) crash(t0, 0.8)
    if (b === 7 || b === 15 || b === 35) riser(t0, BAR, 0.8)
    if (b === 26) riser(t0, BAR * 2, 1)
    for (let s = 0; s < 16; s++) {
      const t = t0 + s * ST
      if (quebra) {
        if (s === 0 || s === 8) { kick(t, 1.2); if (C.orch) timp(t, hz(D2, r)) }
        if (s === 8) snare(t, 1.2)
        if (s % 4 === 2) tom(t, s < 8 ? 120 : 90, 1)
        if (b >= 26) hat(t, 0.4 + 0.6 * ((b - 26) * 16 + s) / 32) // a quebra volta a acelerar
        if (s === 0) bass(t, hz(D2, r), BAR * 0.9, 1.2)
        if (s === 0) braam(t, hz(D2, r), BAR * 0.95, 1)
        continue
      }
      // bateria
      const kp = EX.has('gallop') ? GALLOP : big || spider ? KB : KA
      if (kp.includes(s)) kick(t, s % 4 === 0 ? 1 : 0.75)
      if (C.orch && s % 8 === 0) timp(t, s ? hz(D2, r + 7) / 2 : hz(D2, r), 0.9)
      if (s === 4 || s === 12) snare(t)
      else if (big && (s === 7 || s === 15)) snare(t, 0.35) // nota fantasma
      if (fill && s >= 12) { snare(t, 0.5 + (s - 12) * 0.18); snare(t + ST / 2, 0.4 + (s - 12) * 0.15) } // virada: a caixa em fusas no último tempo
      if (fill && s >= 8 && s < 12) tom(t, [140, 120, 100, 85][s - 8], 0.9, s % 2 ? P.l : P.r)
      if (!C.orch) { hat(t, s % 2 ? 0.55 : 1); if (s % 4 === 2) hat(t, 0.9, true) } else noise(t, 0.02, 'bandpass', 2500, 4, 0.12 * (s % 2 ? 0.6 : 1), P.rr) // o Desconhecido: madeira do arco (col legno) no lugar do chimbal
      if (big && s % 4 === 3 && !fill) tom(t, 110, 0.7, P.l)
      if (spider) { click(t + ST * 0.33); click(t + ST * 0.66) }
      // baixo em colcheias saltando de oitava, cordas graves em semicolcheias, violinos em arpejo
      if (s % 2 === 0) bass(t, hz(D2, r + (s % 4 === 2 ? 12 : 0)), ST * 1.8)
      low(t, hz(D2 * 2, r + LOWP[s]), ST * 0.85, tema || atk ? 1.1 : 1, s % 2 ? lowL : lowR)
      if (b >= 4 || tema || atk) { let iv = VIOP[s]; if (iv === 3 || iv === 15) iv += q3 - 3; vio(t, hz(D2 * 4, r + iv), ST * 0.8, big ? 1.2 : 0.9, s % 2 ? vioL : vioR) }
      if (atk && s % 4 === 2) stab(t, [hz(D2 * 2, r), hz(D2 * 2, r + 7), hz(D2 * 4, r + 1)], 0.16)
    }
    // metais graves (braam) a cada 2 compassos; coro no acorde; o tema em colcheias, dobrado pelo sintetizador distorcido
    if (!quebra && b % 2 === 0) braam(t0, hz(D2, r), BAR * 1.6, big ? 1.1 : 0.85)
    if (tema || atk) choir(t0, [hz(D2 * 4, r), hz(D2 * 4, r + q3), hz(D2 * 4, r + 7)], BAR * 0.98, big ? 1.2 : 1)
    if (quebra) choir(t0, [hz(D2 * 4, r), hz(D2 * 4, r + 3), hz(D2 * 4, r + 7)], BAR * 0.98, 1.3)
    if (tema && b % 2 === 0) MOTIF.forEach(([s, n, d]) => { const t = t0 + s * ST, gg = S === 'tema2' ? 1.25 : 1; lead(t, hz(D2 * Math.pow(2, C.oct), n), d * ST, gg); synth(t, hz(D2 * 2, n), d * ST * 0.95, gg) })
    if (S === 'combate' && b % 4 === 2) [[0, 0], [2, 3], [4, 2], [6, 1], [8, 0]].forEach(([s, n]) => synth(t0 + s * ST, hz(D2 * 2, n), ST * 1.8, 0.8)) // o começo do motivo, como chamada
    // cores
    if (EX.has('hum') && (tema || atk) && b % 4 === 0) hum(t0, BAR * 4 - 0.3, hz(D2 * 4, r))
    if (EX.has('glass') && (b === 16 || b === 20 || b === 30 || b === 34)) glass(t0, hz(D2 * 16, 1), BAR * 1.5)
    if (limp) { kick(t0, 1.5); scrape(t0 + 0.12); kick(t0 + 8 * ST, 1.4); scrape(t0 + 8 * ST + 0.12) }
    if (EX.has('roar') && (b === 16 || b === 24 || b === 32)) roar(t0, b === 24 ? 2.4 : 1.4)
    if (EX.has('static') && (big || quebra || rnd() < 0.35)) stat(t0 + Math.floor(rnd() * 12) * ST, 0.2 + rnd() * 0.35, big ? 1 : 0.7)
    if (EX.has('bite') && (big || tema)) { bite(t0); if (big) bite(t0 + 8 * ST, 0.8) }
    if (EX.has('scream') && (b === 16 || b === 20 || b === 24 || b === 30 || b === 34)) scream(t0, BAR * 2)
    if (EX.has('screech') && big) screech(t0, BAR * 0.95)
    if (EX.has('crack') && (big || rnd() < 0.3)) crack(t0 + Math.floor(rnd() * 16) * ST)
    if (EX.has('gallop') && b % 8 === 6) roar(t0 + 8 * ST, 0.9, 0.55) // um berro grave
    if (EX.has('hiss') && (b % 2 === 1 || big)) noise(t0 + 12 * ST, ST * 4, 'highpass', 5200, 1.5, big ? 0.14 : 0.09, P.rr, 0.05) // o chiado do bando
    if (EX.has('bones')) for (let s = 1; s < 16; s += 2) if (rnd() < (big ? 0.8 : 0.4)) click(t0 + s * ST) // vértebras estalando nos contratempos
    if (EX.has('gulp') && (b === 16 || b === 24 || b === 32)) { osc('sine', 160, t0, 0.6, vca(t0, 0.005, 0.6, 0.5, P.c), 35, 0.5); bite(t0 + 0.05, 0.8) } // engole
  }
  return { bar, master, NB, BAR }
}
