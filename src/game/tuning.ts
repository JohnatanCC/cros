// Números de jogo da fatia, num lugar só. Unidades: metros, segundos, pontos de vida.
// Tudo aqui vem da especificação (docs/especificacao.md); ajuste aqui, não espalhado pelo código.

export const AGENTE = {
  vida: 200,
  kitDeVida: 60, // cada kit cura isso; 3 no térreo e 2 no andar de cima
  velocidade: { andar: 2.0, correr: 4.5, agachado: 1.2, mirando: 1.2 },
  folego: 6, // segundos de corrida
  esquiva: { distancia: 2.5, invulneravel: 0.25, intervalo: 0.8 },
  trocaDeArma: 0.5,
} as const

export const CAMERA = {
  explorar: { atras: 2.4, ombro: 0.55, altura: 1.75, campo: 60 },
  mirar: { atras: 1.2, ombro: 0.6, altura: 1.65, campo: 48 },
  bracoMinimo: 0.35, // o braço-mola encurta até aqui quando bate numa parede
} as const

export const DANO = {
  golpePadrao: 30, // todo golpe de fantasma, por enquanto
} as const

export const DETECTOR = {
  revelaAte: 24, // através das paredes, até esta distância
  bipeAte: 80, // além disso, só o bipe (mais rápido quanto mais perto)
} as const

// Fantasmas chefes, antes de enfraquecer: no limite, ficam atordoados e a vida volta inteira
export const CHEFE_ANTES = {
  limiteDeVida: 0.25,
  atordoado: 4,
} as const

export const MAE = {
  barras: [0.2, 0.25, 0.25, 0.3], // as 4 barras de vida da luta no berçário
  atordoadaPorBarra: 6,
  cambaleio: { danoEm3s: 120, dura: 3, recarga: 12 }, // o atordoamento escondido
  rodeia: [10, 7, 7, 0], // segundos rodeando por fase (na 4 ela só investe)
  avisoSurgir: 2, // o brilho vermelho antes de sair do Luto
  garradas: [2, 2, 3, 3],
  parada: 2, // a janela depois das garradas
  aproximaBerco: 4, // a esta distância do berço, a luta começa
} as const

export const ESPECTRAL = {
  vida: 60,
  rodaRaio: 5,
  aviso: 0.6,
  tonto: 1.5,
  atacamJuntos: 1, // o círculo de batalha: só um ataca por vez
} as const

export const GLUTAO = {
  vida: 400,
  danoForaDoNucleo: 0.5, // só o núcleo leva dano cheio
  almas: 3, // começa com 3 no núcleo; cada uma vira um Espectral
  cuspeACada: 30,
  vivosAoMesmoTempo: 2,
  geraNoMaximo: 3,
  devoraAbaixoDe: 0.25,
  curaAoDevorar: 0.5,
  devorarDura: 4,
  devoraPorLuta: 1,
  investidaSeLongeDe: 6,
  soltasTontas: 1.5, // as almas que escapam na explosão
} as const

export const MUSICA = {
  segurarCombate: 4, // a caça acabou: a música segura isso antes de baixar
  segurarOutras: 2.5,
} as const
