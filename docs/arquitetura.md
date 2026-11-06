# Arquitetura

Vite + React 19 + TypeScript + React Three Fiber (three.js) + zustand.

## Pastas

```
src/
  App.tsx            o Canvas do jogo e a interface por cima, de acordo com a tela atual
  main.tsx           ponto de entrada
  game/              regras e estado, sem nada de 3D
    tuning.ts        TODOS os números de jogo (vida, dano, tempos, distâncias)
    store.ts         a tela atual (menu, configurações, carregando, jogando, pausado) e a região
    regions.ts       as regiões do mapa, seus checkpoints e como carregar cada uma
    settings.ts      configurações do jogador (salvas no navegador)
    save.ts          o save (região + checkpoint)
    storage.ts       leitura e escrita no localStorage, protegidas contra erro
  audio/
    engine.ts        o AudioContext e os volumes (música, efeitos)
    music.ts         gerente de música: prioridades, transições, loops
    combat.ts        o motor de música de combate sintetizada (copiado do laboratório)
  render/
    psx.ts           o visual PS1: vértices tremidos e materiais prontos (std, basic)
    textures.ts      texturas desenhadas em código (ladrilho, reboco, tábua, lambri)
    lightPool.tsx    as 8 luzes compartilhadas e o useLightSource
  scenes/
    GameCanvas.tsx   o <Canvas>: resolução retrô, neblina, qual cena mostrar
    MenuScene.tsx    o salão visto no menu, com olhos na galeria
    DevCamera.tsx    câmera de desenvolvimento (sai na etapa 1)
  world/
    Salao.tsx        o salão principal em blocos
    medidas.ts       as medidas dos cômodos
    regions/         um arquivo por região, carregado sob demanda
  ui/
    Menus.tsx        todas as telas: título, configurações, créditos, carregamento, pausa, HUD
    ui.css           o visual da interface
public/audio/        as músicas
referencia/          o laboratório (modelos e animações do Espectral e do Glutão, sons)
docs/                especificação, arquitetura e roteiro
```

## Regras da casa

- **Números de jogo só em `tuning.ts`.** Nada de `vida = 60` solto num componente.
- **Todo material 3D passa por `psx()`** (ou usa `std()` e `basic()` de `render/psx.ts`).
  Senão o objeto não treme e destoa do resto.
- **Nada de `<pointLight>` direto nas cenas.** Use `useLightSource(posição, cor, intensidade, alcance)`.
  O conjunto de 8 luzes cuida do resto.
- **localStorage só por `game/storage.ts`.** Em aba anônima ele pode falhar; o jogo tem que seguir.
- Nomes de jogo em português (`vida`, `esquiva`), nomes técnicos em inglês quando é o costume
  da biblioteca (`useFrame`, `mesh`).

## Como fazer

### Uma região nova
1. Acrescente o id em `RegionId` e uma entrada em `REGIONS` (`src/game/regions.ts`),
   com nome, lugar, ficha, checkpoints e `load: () => import('../world/regions/NovaRegion')`.
2. Crie `src/world/regions/NovaRegion.tsx` com `export default function NovaRegion()`.
   Nela, chame `music.want('...')` num `useEffect`.
3. Para ir até ela: `useGame.getState().goTo('nova', 'idDoCheckpoint')`.

### Uma textura nova
Em `render/textures.ts`, desenhe num canvas com `canvasTex(largura, altura, (g, w, h) => { ... })`.
Use `rng(semente)` para o ruído ficar igual sempre. Repita com `tiled(textura, x, y)`.

### Um fantasma novo
1. Os números vão em `tuning.ts`.
2. O modelo: porte do laboratório (`referencia/laboratorio.html`, funções `buildSkull`,
   `buildEspectral`, `buildGlutao`). Troque os materiais por `psx()`.
3. A luz dos olhos: `useLightSource` (não uma SpotLight solta, por causa do conjunto de luzes).
4. A música de caça: `music.want('combate:espectral')` enquanto ele caça.

### Uma música nova
Ponha o mp3 em `public/audio/`, acrescente uma entrada em `FILES` e o id em `MusicId` e na função `rank` (a prioridade) em `src/audio/music.ts`.

## Comandos

```
npm install       instala as dependências (uma vez)
npm run dev       abre o jogo em modo desenvolvimento (recarrega sozinho)
npm run build     confere os tipos e gera a versão final em dist/
npm run preview   serve a versão de dist/ para testar
npm run lint      procura problemas no código
```
