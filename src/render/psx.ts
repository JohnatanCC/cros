import * as THREE from 'three'

// O visual PS1: os vértices "grudam" numa grade da tela (o tremor característico).
// Toda malha do mundo usa materiais passados por psx(); o filtro retrô liga e desliga só a uniforme.
// A resolução baixa fica no Canvas (ver GameCanvas): 300 linhas no modo retrô, a da tela no modo limpo.

export const RETRO_LINES = 300
const SNAP = 110 // grade de vértices (menor = mais tremido)
export const psxUniforms = { uSnap: { value: SNAP } }

export function setRetro(on: boolean) {
  psxUniforms.uSnap.value = on ? SNAP : 0
}

export function psx<T extends THREE.Material>(mat: T): T {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer)
    shader.uniforms.uSnap = psxUniforms.uSnap
    shader.vertexShader = 'uniform float uSnap;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\nif (uSnap > 0.0 && gl_Position.w > 0.35) { vec4 p = gl_Position; p.xyz /= p.w; p.xy = floor(p.xy * uSnap) / uSnap; p.xyz *= p.w; gl_Position = p; }',
    )
  }
  const key = mat.customProgramCacheKey.bind(mat)
  mat.customProgramCacheKey = () => key() + '|psx'
  return mat
}

// os dois materiais de base: com luz (sem brilho especular, faces chapadas) e sem luz
export const std = (o: THREE.MeshPhongMaterialParameters = {}) =>
  psx(new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 0, flatShading: true, ...o }))
export const basic = (o: THREE.MeshBasicMaterialParameters = {}) => psx(new THREE.MeshBasicMaterial(o))
