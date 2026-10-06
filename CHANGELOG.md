# Changelog

Todas as mudanças relevantes do site do Instituto Elo Animal ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa
[Versionamento Semântico](https://semver.org/lang/pt-BR/) (MAJOR.MINOR.PATCH). Cada versão
tem uma tag no Git e uma release no GitHub.

## [Não lançado]

## [4.0.0] – 2026-10-06

Experiência Prática IV: versionamento, acessibilidade, otimização e deploy.

### Mudanças incompatíveis

- O site publicado passa a ser a pasta `dist/`, gerada por `npm run build`: em produção, os
  arquivos `css/*.css` e `js/**/*.js` do código-fonte dão lugar a um CSS e a pacotes de
  JavaScript minificados, com hash no nome. Endereços diretos para os arquivos antigos deixam
  de funcionar.
- O build exige Node.js 20 ou mais recente.

### Adicionado

- Tema escuro automático (`prefers-color-scheme`) e escolha de tema (automático, claro ou
  escuro) na Minha área, aplicada antes da primeira pintura.
- Camada de tokens semânticos de cor no design system (`--cor-texto`, `--cor-superficie`...),
  base dos temas.
- Contraste reforçado para quem ativa `prefers-contrast: more` no sistema.
- Suporte ao modo de cores forçadas (alto contraste do Windows).
- Página "Acessibilidade" (`#/acessibilidade`) com a declaração de acessibilidade.
- Testes de acessibilidade com axe-core e Playwright (`npm run test:a11y`) e testes de ponta a
  ponta também na versão de produção (`ALVO=dist`).
- Build de produção com esbuild, Lightning CSS, html-minifier-terser, SVGO e sharp.
- Deploy contínuo no GitHub Pages e verificação automática (CI) dos pull requests com GitHub Actions.
- `CONTRIBUTING.md`, `CHANGELOG.md`, licença MIT, modelo de pull request, `.editorconfig` e
  verificador de mensagens de commit (`npm run hooks`).

### Alterado

- Em produção, o Chart.js é uma versão enxuta (só rosca e barras), servida pelo próprio site;
  a CDN com SRI fica como reserva.
- Os gráficos da Transparência são redesenhados quando o tema muda.
- O `index.html` publicado pré-carrega os módulos iniciais (`modulepreload`) e os moldes.

### Corrigido

- O ícone do botão Menu, o coração de favorito e as barras de progresso sumiam no modo de
  cores forçadas.
- Leitores de tela podiam anunciar "0" ou valores pela metade nos números animados do início.
- O rodapé "pulava" ao carregar a primeira página (CLS de 0,41).
- O botão de calendário do campo de data recebia foco sem contorno visível.
- Um Tab logo depois de abrir o submenu Projetos pulava os links.

## [3.0.1] – 2026-10-02

### Corrigido

- Um link antigo de campanha encerrada (`#/cadastro?campanha=reforma-gatil`) vinculava a
  doação à campanha; agora a pessoa é avisada e a doação vai para o fundo geral.
- A contagem regressiva do mutirão mostrava "já começou" para sempre; agora trata o evento em
  andamento e já encerrado.

## [3.0.0] – 2026-10-02

Experiência Prática III: o site virou uma SPA em JavaScript.

### Mudanças incompatíveis

- `projetos.html` e `cadastro.html` deixam de existir: as telas viram rotas da SPA
  (`#/projetos`, `#/cadastro`) e o site precisa de um servidor local para os módulos ES.
- Imagens movidas de `img/` para `imagens/`.

### Adicionado

- Roteador por hash com parâmetros, página 404, foco no título e `aria-current`.
- Views carregadas com `fetch` e moldes `<template>` preenchidos a partir dos dados.
- Busca e filtros de projetos, favoritos, simulador de doação, gráficos com Chart.js,
  rascunho do cadastro e Minha área (localStorage e sessionStorage).
- Testes de unidade (`node --test`) e de ponta a ponta (Playwright).

## [2.0.0] – 2026-10-01

Experiência Prática II: design system e layout responsivo.

### Mudanças incompatíveis

- `css/estilo.css` foi substituído pelos arquivos do design system (`variaveis`, `base`,
  `layout`, `componentes` e `utilitarios`).

### Adicionado

- Design tokens de cor, tipografia e espaçamento; grid de 12 colunas mobile-first.
- Componentes: botões, cartões, formulários com estados de validação, alertas, modal e toast.
- Menu hambúrguer e interações em `js/interface.js`.

## [1.0.0] – 2026-09-30

Experiência Prática I: primeira versão do site.

### Adicionado

- Páginas inicial, de projetos e de cadastro em HTML5 semântico.
- Formulário de cadastro com validação nativa, máscaras e mensagens em JavaScript.
- Imagens em SVG criadas para o projeto e folha de estilo responsiva.

[Não lançado]: https://github.com/natashasantosmk-boop/instituto-elo-animal/compare/v4.0.0...develop
[4.0.0]: https://github.com/natashasantosmk-boop/instituto-elo-animal/compare/v3.0.1...v4.0.0
[3.0.1]: https://github.com/natashasantosmk-boop/instituto-elo-animal/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/natashasantosmk-boop/instituto-elo-animal/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/natashasantosmk-boop/instituto-elo-animal/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v1.0.0
