import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLightSource } from '../render/lightPool'
import { basic, std } from '../render/psx'
import { ladrilhoTex, lambriTex, rebocoTex, tabuaTex, tiled } from '../render/textures'
import { SALAO } from './medidas'

// O salão principal do Palacete Monteval, em blocos (sem mobília ainda): 28 × 32 m, pé-direito duplo (10 m),
// galeria de 6 m em três lados a 5 m de altura, a escadaria no meio com o pé desabado (o buraco que o Luto abriu)
// e o andaime do pintor pendurado lá no alto (o quebra-cabeça). Medidas em docs/especificacao.md, "A planta".
// Eixos: x = largura (oeste −, leste +), z = profundidade (fundos −, frente +), y = altura. A porta da frente fica em z = +16.


const STEP = { n: 20, rise: 0.25, run: 0.5, w: 6, z0: 0 } // degrau 0 no chão em z = 0, subindo até a galeria dos fundos
const ANDAIME = 9 // comprimento do andaime, maior que o buraco (7,6 m)
const BURACO = { x0: -5.2, x1: 5.2, z0: -2.6, z1: 5, primeiroDegrau: 6 } // o Luto comeu o pé da escada: o primeiro degrau que sobrou fica a 1,75 m

function Box({ size, pos, mat, rot }: { size: [number, number, number]; pos: [number, number, number]; mat: THREE.Material; rot?: [number, number, number] }) {
  return <mesh position={pos} rotation={rot} material={mat}><boxGeometry args={size} /></mesh>
}

function Balusters({ from, to, y, mat }: { from: [number, number]; to: [number, number]; y: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = Math.max(2, Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / 0.22))
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      m.makeTranslation(from[0] + (to[0] - from[0]) * u, y + 0.45, from[1] + (to[1] - from[1]) * u)
      ref.current!.setMatrixAt(i, m)
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [from, to, y, n])
  return <instancedMesh ref={ref} args={[undefined, undefined, n]} material={mat}><boxGeometry args={[0.06, 0.9, 0.06]} /></instancedMesh>
}

export function Salao() {
  const M = useMemo(() => {
    const lad = ladrilhoTex(), reb = rebocoTex(), tab = tabuaTex(), lam = lambriTex()
    return {
      chao: std({ map: tiled(lad, SALAO.w / 0.8, SALAO.d / 0.8) }),
      parede: std({ map: tiled(reb, 12, 4) }),
      lambri: std({ map: tiled(lam, 16, 1) }),
      tabua: std({ map: tiled(tab, 4, 2) }),
      madeira: std({ color: '#2c1d13' }),
      teto: std({ color: '#141216' }),
      breu: basic({ color: '#000000' }),
      luto: std({ color: '#050304', emissive: '#0a0306' }), // o líquido preto escorrendo
      vidro: basic({ color: '#22324e' }),
      corda: std({ color: '#5a4a3a' }),
    }
  }, [])
  const { w, d, h, galeriaY: gy, galeriaFundo: gf } = SALAO
  const hw = w / 2, hd = d / 2

  // luz: o luar entra pelas janelas altas; duas arandelas quentes nas paredes (vão para o conjunto fixo de luzes)
  useLightSource([-hw + 0.3, 2.4, 6], '#ffb766', 1.8, 11)
  useLightSource([hw - 0.3, 2.4, 6], '#ffb766', 1.6, 11)
  useLightSource([-hw + 0.3, 2.4, -6], '#ffb766', 1.2, 10)
  useLightSource([hw - 0.3, 2.4, -6], '#ffb766', 1.4, 10)
  useLightSource([0, gy + 3, -hd + 0.6], '#9cb4e0', 0.9, 14) // o retrato da família, lá em cima

  const degraus = []
  for (let i = BURACO.primeiroDegrau; i < STEP.n; i++) {
    const top = (i + 1) * STEP.rise, z = STEP.z0 - i * STEP.run - STEP.run / 2
    degraus.push(<Box key={i} size={[STEP.w, top, STEP.run]} pos={[0, top / 2, z]} mat={M.tabua} />)
  }

  return (
    <group>
      {/* piso em quatro pedaços em volta do buraco */}
      <Box size={[w, 0.1, hd - BURACO.z1]} pos={[0, -0.05, (BURACO.z1 + hd) / 2]} mat={M.chao} />
      <Box size={[w, 0.1, BURACO.z0 + hd]} pos={[0, -0.05, (BURACO.z0 - hd) / 2]} mat={M.chao} />
      <Box size={[hw + BURACO.x0, 0.1, BURACO.z1 - BURACO.z0]} pos={[(-hw + BURACO.x0) / 2, -0.05, (BURACO.z0 + BURACO.z1) / 2]} mat={M.chao} />
      <Box size={[hw - BURACO.x1, 0.1, BURACO.z1 - BURACO.z0]} pos={[(hw + BURACO.x1) / 2, -0.05, (BURACO.z0 + BURACO.z1) / 2]} mat={M.chao} />
      {/* o buraco: um poço escuro até o porão, com o Luto escorrendo pela borda */}
      <Box size={[BURACO.x1 - BURACO.x0, 3, BURACO.z1 - BURACO.z0]} pos={[0, -1.6, (BURACO.z0 + BURACO.z1) / 2]} mat={M.breu} />
      <Box size={[BURACO.x1 - BURACO.x0 + 0.3, 0.02, 0.35]} pos={[0, 0.01, BURACO.z0 - 0.1]} mat={M.luto} />
      <Box size={[0.4, 0.02, BURACO.z1 - BURACO.z0]} pos={[BURACO.x1 + 0.1, 0.01, (BURACO.z0 + BURACO.z1) / 2]} mat={M.luto} />

      {/* paredes, lambri e teto */}
      <Box size={[w, h, 0.2]} pos={[0, h / 2, -hd]} mat={M.parede} />
      <Box size={[w, h, 0.2]} pos={[0, h / 2, hd]} mat={M.parede} />
      <Box size={[0.2, h, d]} pos={[-hw, h / 2, 0]} mat={M.parede} />
      <Box size={[0.2, h, d]} pos={[hw, h / 2, 0]} mat={M.parede} />
      <Box size={[w - 0.4, 1, 0.05]} pos={[0, 0.5, -hd + 0.12]} mat={M.lambri} />
      <Box size={[0.05, 1, d - 0.4]} pos={[-hw + 0.12, 0.5, 0]} mat={M.lambri} />
      <Box size={[0.05, 1, d - 0.4]} pos={[hw - 0.12, 0.5, 0]} mat={M.lambri} />
      <Box size={[w, 0.2, d]} pos={[0, h, 0]} mat={M.teto} />
      {/* a porta da frente e as janelas altas de luar */}
      <Box size={[3.6, 4.4, 0.05]} pos={[0, 2.2, hd - 0.12]} mat={M.madeira} />
      {[-9, -3, 3, 9].map((z) => <Box key={'je' + z} size={[0.05, 3.2, 1.6]} pos={[-hw + 0.12, gy + 2.2, z]} mat={M.vidro} />)}
      {[-9, -3, 3, 9].map((z) => <Box key={'jd' + z} size={[0.05, 3.2, 1.6]} pos={[hw - 0.12, gy + 2.2, z]} mat={M.vidro} />)}

      {/* galeria em U: o piso de cima nos dois lados e nos fundos, com balaustrada sobre o salão */}
      <Box size={[gf, 0.3, d - gf]} pos={[-hw + gf / 2, gy - 0.15, gf / 2]} mat={M.tabua} />
      <Box size={[gf, 0.3, d - gf]} pos={[hw - gf / 2, gy - 0.15, gf / 2]} mat={M.tabua} />
      <Box size={[w, 0.3, gf]} pos={[0, gy - 0.15, -hd + gf / 2]} mat={M.tabua} />
      <Balusters from={[-hw + gf, -hd + gf]} to={[-hw + gf, hd - 0.3]} y={gy} mat={M.madeira} />
      <Balusters from={[hw - gf, -hd + gf]} to={[hw - gf, hd - 0.3]} y={gy} mat={M.madeira} />
      <Balusters from={[-hw + gf, -hd + gf]} to={[-STEP.w / 2, -hd + gf]} y={gy} mat={M.madeira} />
      <Balusters from={[STEP.w / 2, -hd + gf]} to={[hw - gf, -hd + gf]} y={gy} mat={M.madeira} />
      <Box size={[0.1, 0.08, d - gf]} pos={[-hw + gf, gy + 0.92, gf / 2]} mat={M.madeira} />
      <Box size={[0.1, 0.08, d - gf]} pos={[hw - gf, gy + 0.92, gf / 2]} mat={M.madeira} />
      {/* portas do andar de cima e o retrato da família com o rosto do pai riscado */}
      <Box size={[2, 3, 0.05]} pos={[-9, gy + 1.5, -hd + 0.12]} mat={M.breu} />
      <Box size={[2, 3, 0.05]} pos={[9, gy + 1.5, -hd + 0.12]} mat={M.breu} />
      <Box size={[4, 2.8, 0.06]} pos={[0, gy + 3, -hd + 0.14]} mat={M.madeira} />

      {/* a escadaria, sem os primeiros degraus */}
      {degraus}
      {/* o andaime suspenso do pintor, lá no alto, com as cordas do guincho */}
      {/* comprido no sentido da escada: quando descer, faz a ponte da borda do buraco até o primeiro degrau que sobrou */}
      <Box size={[2.4, 0.12, ANDAIME]} pos={[0, h - 1.6, (BURACO.z0 + BURACO.z1) / 2]} mat={M.tabua} />
      {[-1, 1].map((x) => [-ANDAIME / 2 + 0.4, ANDAIME / 2 - 0.4].map((z) => <Box key={x + ':' + z} size={[0.03, 1.55, 0.03]} pos={[x, h - 0.8, (BURACO.z0 + BURACO.z1) / 2 + z]} mat={M.corda} />))}
    </group>
  )
}
