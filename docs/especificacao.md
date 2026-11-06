# C.R.O.S. · Caso 01 · O Palacete Monteval

Especificação da fatia jogável: tudo o que foi decidido até agora, num lugar só.
Os números de jogo vivem em `src/game/tuning.ts`. Se mudar um número aqui, mude lá também.

---

## 1. O que é a fatia

Uma casa assombrada, uma chefe e dois tipos de inimigo comum. O jogador explora o térreo,
aprende a lutar, abre caminho para o andar de cima, se esconde da Mãe e a enfrenta no berçário.
Termina descendo a escada de serviço para o porão (só a tela de carregamento, por enquanto).

Visual: estilo PS1. Resolução interna baixa (300 linhas), vértices tremidos, texturas pixeladas,
neblina escura. Câmera em terceira pessoa por cima do ombro. Nos esconderijos, primeira pessoa.

## 2. A casa

**Escala.** Tudo largo: o jogador precisa de espaço para a câmera por cima do ombro, para esquivar e
para rodear os fantasmas. A casa tem uns 72 × 56 m. Corredores de 6 m de largura. Nenhum cômodo menor
que 18 × 20 m. O salão tem 28 × 32 m e pé-direito duplo (10 m), com uma galeria em U de 6 m de fundo,
a 5 m de altura. A escadaria tem 6 m de largura e 20 degraus. O buraco tem 10,4 × 7,6 m.
(Na primeira versão era tudo metade disso; ficou apertado.)

**Térreo**
- **Salão principal.** A chegada pela porta da frente. A escadaria principal está bloqueada por um
  **grande buraco** no piso (os quatro primeiros degraus caíram, manchas de Luto em volta).
  Em cima, um andaime de pintor está pendurado, preso por cordas.
- **Sala de jantar.** 1 Espectral. A primeira luta: ensina mirar e atirar.
- **Copa.** 3 Espectrais. Ensina a esquiva e o círculo de batalha (só um ataca por vez).
- **Cozinha.** O Glutão, guardando a **manivela do guincho**.
- **Porta escondida.** Um atalho que volta para o salão depois da cozinha.

**Subida.** Com a manivela, o jogador baixa o andaime por cima do buraco e sobe pela escada.

**Andar de cima**
- **Patamar.** Checkpoint. Aqui acontece a cena de apresentação da Mãe (seção 4).
- **Corredores e quartos.** Furtividade: a Mãe faz a ronda. O jogador usa os esconderijos (armários).
- **Berçário.** 24 × 32 m. A luta contra a Mãe. (A testar: arena grande demais dilui a pressão da chefe.)
- **Escada de serviço.** Depois da captura, desce para o porão (tela de carregamento).

**Checkpoints:** chegada (salão), patamar, porta do berçário. Ficam em `src/game/regions.ts`.

## 3. O agente

**Visual.** Técnico de campo. A jaqueta azul-marinho da opção B, mas com o comprimento longo da
opção A. O equipamento aparece nas costas (mochila com as cápsulas de orbe). Pescoço curto e
cabelo um pouco mais longo. Referência: o quadro AgenteFinal do canvas de concept arts.

**Números**
- Vida 200. Todo golpe de fantasma tira 30, por enquanto.
- Kit de vida cura 60. Há 3 no térreo e 2 no andar de cima.
- Velocidades: andar 2 m/s, correr 4,5 m/s, agachado 1,2 m/s, andando mirando 1,2 m/s.
- Fôlego: 6 s de corrida.
- Esquiva: 2,5 m, invulnerável por 0,25 s, intervalo de 0,8 s.
- Troca de arma: 0,5 s.

**Animações (só as principais):** parado, andar, correr, agachar, mirar, atirar, esquivar,
trocar de arma, levar golpe, morrer.

**Câmera.** Por cima do ombro, como no RE4 remake. Um braço-mola encurta a câmera quando ela bate
numa parede (até 0,35 m).
- Explorando: 2,4 m atrás, 0,55 m de lado, 1,75 m de altura, campo de visão 60°.
- Mirando: 1,2 m atrás, 0,6 m de lado, 1,65 m de altura, campo de visão 48°.

**Detector.** Mostra o objeto procurado através das paredes até 24 m. Além disso só bipa,
mais rápido quanto mais perto, até 80 m.

## 4. A Mãe: apresentação e ronda

O jogo **não** começa lutando com ela. Primeiro o jogador explora e enfrenta os fantasmas básicos.

**A cena no patamar**
1. A porta do quarto principal se abre.
2. O jogador vê a Mãe.
3. Corte para a primeira pessoa, de dentro de um armário próximo.
4. Ela fareja, chega perto e vai embora.

Essa cena apresenta a mecânica de se esconder. Nos esconderijos a visão vira primeira pessoa.

**Ronda.** No andar de cima a Mãe patrulha. Se ela vê o jogador, toca a música de perseguição da
Mãe. O jogador quebra a linha de visão e se esconde.

## 5. A Mãe: a luta no berçário

**Ideia central: o Luto.** O líquido preto que cobre o berçário é o luto da Mãe. Ela mora nele.

**Começo**
1. O berçário está escuro. Só um foco de luz sobre o berço.
2. A 4 m do berço, uma barreira se fecha atrás do jogador.
3. A sala acende e o Luto cobre paredes e chão.
4. A música da luta começa (a faixa do Suno) e a Mãe sobe do chão atrás do berço.

**A barreira** não pode ser quebrada. Ela se quebra sozinha quando a Mãe fica atordoada.

**Vida.** 4 barras: 20%, 25%, 25% e 30%. Cada barra zerada deixa a Mãe atordoada por 6 s.

**Cambaleio escondido.** Muito dano em pouco tempo (120 em 3 s) também a atordoa por 3 s.
Recarga de 12 s. O jogador não vê uma barra para isso.

**O ciclo básico**
1. Rodeia o jogador.
2. Mergulha no Luto.
3. 2 s depois surge com uma investida. Um brilho vermelho avisa onde ela vai sair.
4. Garradas.
5. Fica parada 2 s (a janela para atirar).
6. Repete.

**Fases**
- **Fase 1.** O ciclo básico. Rodeia 10 s, 2 garradas.
- **Fase 2.** Rodeia 7 s e acrescenta uma finta (finge que vai surgir num lugar e sai em outro).
- **Fase 3.** Rodeia 7 s, 3 garradas. Manchas de Luto no chão deixam o jogador lento.
- **Fase 4.** Travada enquanto o berço existir: a última barra não desce. O berço tem muita vida.
  Quando o berço quebra, o Luto seca, ela não consegue mais mergulhar e só investe.

**Fim.** A Mãe enfraquecida é capturada. A escada de serviço se abre.

## 6. Regra dos chefes antes de enfraquecer

Atirar sempre tira vida. Se o chefe chega ao limite (25%) **sem** estar enfraquecido,
fica atordoado por 4 s e a vida volta inteira. Isso dá tempo para o jogador ganhar distância.

## 7. Inimigos comuns

Os dois são caveiras de manto azul transparente, como os fantasmas de Ghosthunter.
**Não** são amigáveis. Os modelos e as animações já existem no laboratório
(`referencia/laboratorio.html`).

**Visual em comum**
- Crânio grande e magro, órbitas inclinadas, rachaduras, dentes em cone, mandíbula que abre.
- Olhos azuis brilhantes que emitem luz de verdade.
- Um cone de luz azul sai dos olhos e mostra para onde estão olhando.
- O corpo é uma serpente esquelética com braços, sob um véu transparente. A cabeça acompanha
  o movimento do corpo.

### Espectral
- Vida 60.
- Rodeia o jogador num raio de 5 m.
- Ataque: aviso de 0,6 s, depois o bote. Fica tonto 1,5 s depois de atacar.
- Círculo de batalha: só um ataca por vez.
- Tem música de caça própria (sintetizada), que toca quando ele está com o jogador na mira.

### Glutão
Uma versão maior e evoluída do Espectral. O corpo é igual ao dele (a mesma serpente), só maior,
com costelas nas vértebras e um núcleo brilhando no peito.

- Vida 400.
- **Dano:** o núcleo leva dano cheio. Qualquer outra parte leva só 50%.
- **Almas:** começa com 3 almas no núcleo. Cada uma vira um Espectral.
- **Cuspir:** a cada 30 s cospe uma alma. No máximo 2 Espectrais vivos ao mesmo tempo
  e 3 no total.
- **Devorar:** abaixo de 25% de vida, suga um Espectral próximo. Leva 4 s e cura 50% da vida.
  O jogador pode matar ou capturar o Espectral antes de ser engolido. Uma vez por luta
  (ainda em aberto: pode ser toda vez que ele volta a 25% com um Espectral perto).
- **Investida** se o jogador está a mais de 6 m.
- **Morte:** ele explode e solta as almas que sobraram, tontas por 1,5 s.
- Deixa cair a manivela do guincho.
- Tem música de caça própria (sintetizada).

## 8. Música

| Situação | Faixa |
| --- | --- |
| Menu | `menu.mp3` |
| Explorando a casa | `amb_casa.mp3` (volta de onde parou) |
| Porão | `tensao.mp3` (volta de onde parou) |
| Espectral caçando | combate sintetizado, preset `espectral` |
| Glutão caçando | combate sintetizado, preset `glutao` |
| Mãe na ronda, perseguindo | perseguição sintetizada da Mãe, **mais alta** que as de batalha |
| Luta no berçário | `batalha_mae.mp3` (a faixa do Suno), em volume 0,5, loop de 2,2 s a 152,4 s |

Quando a caça acaba, a música de combate segura 4 s antes de baixar. As outras seguram 2,5 s.
Música de maior prioridade sempre ganha (ordem em `src/audio/music.ts`).

## 9. Interface

- **Menu:** Continuar (se houver save), Novo jogo, Configurações, Créditos.
  O primeiro clique destrava o som (exigência do navegador).
- **Configurações:** filtro retrô, volume da música, volume dos efeitos,
  sensibilidade do mouse, inverter o eixo Y. Salvas no navegador.
- **Carregamento:** nome do lugar e uma linha da ficha do caso.
- **HUD:** objetivo (some sozinho), vida, arma e estado do orbe.
- **Pausa:** Esc. Continuar, Configurações, Sair para o menu.

## 10. Montagem técnica

- O mapa é dividido em regiões (`casa`, `porao`). Cada uma é carregada sob demanda,
  atrás da tela de carregamento.
- Luzes: um conjunto fixo de 8 luzes pontuais. Cada lâmpada da casa é uma "fonte";
  a cada quadro as 8 fontes mais perto da câmera ganham uma luz. Assim os shaders não
  recompilam quando se anda pela casa.
- O save guarda a região e o checkpoint. É gravado ao chegar num checkpoint.
