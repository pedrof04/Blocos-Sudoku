# Blocos Sudoku

Clone simples de puzzle de blocos com regras de Sudoku, **sem anuncios**. Feito com Vite + TypeScript + Canvas e empacotado para Android com Capacitor.

## Regras
- Arrasta as 3 pecas para a grelha 9x9 (as pecas nao rodam).
- Limpas linhas, colunas ou quadrados 3x3 completos.
- Limpar varias unidades de uma vez e jogadas seguidas dao mais pontos.
- O jogo acaba quando nenhuma das pecas restantes cabe no tabuleiro.

## Correr no browser
```bash
npm install
npm run dev
```

## Gerar a app Android
Precisas do Android Studio instalado.
```bash
npm install
npx cap add android   # so a primeira vez
npm run android       # build + sync + abre o Android Studio
```
No Android Studio: `Build > Build APK(s)` (ou ligas o telemovel por USB e carregas em Run).

## Estrutura
- `src/pieces.ts` - formas das pecas e geracao aleatoria
- `src/game.ts` - logica do tabuleiro (colocar, limpar, pontuacao, fim de jogo)
- `src/main.ts` - desenho em canvas e drag and drop
- `capacitor.config.ts` - configuracao da app
