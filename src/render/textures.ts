import * as THREE from 'three'

// Texturas pintadas em canvas, a 128 pixels por metro (a mesma densidade do laboratório).
// Pixel duro de perto; de longe, mipmaps (senão o padrão "formiga" quando a câmera anda).

export const PX_M = 128

export function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  paint(c.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestMipmapLinearFilter
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

/** uma cópia da textura repetida rx × ry vezes */
export function tiled(t: THREE.Texture, rx: number, ry: number) {
  const c = t.clone()
  c.needsUpdate = true
  c.repeat.set(rx, ry)
  return c
}

/** gerador pseudoaleatório com semente (as texturas saem iguais a cada execução) */
export function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

// ---------- a primeira leva de texturas da casa (as do salão); as outras entram por cômodo ----------

// ladrilho hidráulico geométrico: preto, terracota e creme (varanda e salão)
export const ladrilhoTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#c9b89a'; g.fillRect(0, 0, 64, 64)
  g.fillStyle = '#7a3a26'
  g.beginPath(); g.moveTo(32, 4); g.lineTo(60, 32); g.lineTo(32, 60); g.lineTo(4, 32); g.closePath(); g.fill()
  g.fillStyle = '#1c1714'
  g.beginPath(); g.moveTo(32, 16); g.lineTo(48, 32); g.lineTo(32, 48); g.lineTo(16, 32); g.closePath(); g.fill()
  for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill() }
  const r = rng(31); for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,240,210,0.06)'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1, 1) }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, 64, 1); g.fillRect(0, 0, 1, 64) // rejunte
})

// reboco cinza riscado imitando blocos de pedra (paredes do salão)
export const rebocoTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#5a5650'; g.fillRect(0, 0, 64, 64)
  const r = rng(7); for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? '#4e4a45' : '#67625b'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1, 1) }
  g.fillStyle = '#3f3b37'
  for (let y = 0; y < 64; y += 16) { g.fillRect(0, y, 64, 1); const o = (y / 16) % 2 ? 0 : 16; for (let x = o; x < 64; x += 32) g.fillRect(x, y, 1, 16) }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,26,22,0.25)'; g.fillRect(r() * 60 | 0, r() * 60 | 0, 2 + (r() * 3 | 0), 4 + (r() * 8 | 0)) } // manchas de umidade
})

// tábua corrida escura (galerias, escada)
export const tabuaTex = () => canvasTex(32, 64, (g) => {
  g.fillStyle = '#3a2618'; g.fillRect(0, 0, 32, 64)
  const r = rng(13); for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? '#2e1e13' : '#45301f'; g.fillRect(r() * 32 | 0, r() * 64 | 0, 1, 2 + (r() * 4 | 0)) }
  g.fillStyle = '#1e140c'; g.fillRect(0, 0, 1, 64); g.fillRect(16, 0, 1, 64); g.fillRect(0, 22, 16, 1); g.fillRect(16, 47, 16, 1)
})

// lambri de madeira escura até o rodaterço
export const lambriTex = () => canvasTex(32, 32, (g) => {
  g.fillStyle = '#2a1d13'; g.fillRect(0, 0, 32, 32)
  g.fillStyle = '#1c130c'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32)
  g.fillStyle = '#34261a'; g.fillRect(3, 5, 10, 24); g.fillRect(19, 5, 10, 24)
})
