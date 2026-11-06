# C.R.O.S. · Caso 01 · O Palacete Monteval

Jogo de terror em terceira pessoa, no estilo PS1, feito para o navegador.

- O que o jogo é e tudo o que já foi decidido: [docs/especificacao.md](docs/especificacao.md)
- Como o código está organizado: [docs/arquitetura.md](docs/arquitetura.md)
- O que falta e em que ordem: [docs/roteiro.md](docs/roteiro.md)

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173).

Para gerar a versão final: `npm run build` (sai na pasta `dist/`).

## Estado atual

Etapa 0 (base) pronta: menu, configurações, créditos, carregamento, pausa, save, música
e o salão em blocos. Ainda não dá para jogar: na tela de jogo, arraste para olhar em volta.
