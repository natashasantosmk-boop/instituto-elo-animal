# Instituto Elo Animal – SPA acessível para uma ONG de proteção animal

[![CI](https://github.com/natashasantosmk-boop/instituto-elo-animal/actions/workflows/ci.yml/badge.svg)](https://github.com/natashasantosmk-boop/instituto-elo-animal/actions/workflows/ci.yml)
[![Deploy no GitHub Pages](https://github.com/natashasantosmk-boop/instituto-elo-animal/actions/workflows/deploy.yml/badge.svg)](https://github.com/natashasantosmk-boop/instituto-elo-animal/actions/workflows/deploy.yml)

**Site publicado:** <https://natashasantosmk-boop.github.io/instituto-elo-animal/>

Projeto das **Experiências Práticas I a IV** da disciplina **Desenvolvimento Front-end para Web**
(CST em Análise e Desenvolvimento de Sistemas). Autora: **Natasha Natividade dos Santos**.

O Instituto Elo Animal é uma **ONG fictícia** de proteção animal que trabalha com o conceito de
**Saúde Única**: a saúde dos animais, das pessoas e do ambiente está conectada. O site apresenta a
ONG e os projetos, recebe cadastros de voluntários e doadores, simula doações e presta contas com
gráficos.

## Sumário

- [Versões](#versões)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Acessibilidade](#acessibilidade)
- [Desempenho e build de produção](#desempenho-e-build-de-produção)
- [Deploy no GitHub Pages](#deploy-no-github-pages)
- [Versionamento e contribuição](#versionamento-e-contribuição)
- [Testes](#testes)
- [Problemas encontrados e corrigidos](#problemas-encontrados-e-corrigidos)
- [Licença e créditos](#licença-e-créditos)

## Versões

Cada Experiência Prática virou uma versão MAJOR, com tag no Git e release no GitHub.
O histórico completo está no [CHANGELOG.md](CHANGELOG.md).

| Versão | Entrega | O que trouxe |
|---|---|---|
| [v1.0.0](https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v1.0.0) | Experiência Prática I | 3 páginas em HTML5 semântico e formulário com validação nativa |
| [v2.0.0](https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v2.0.0) | Experiência Prática II | design system em CSS, grid de 12 colunas e componentes responsivos |
| [v3.0.0](https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v3.0.0) | Experiência Prática III | SPA em JavaScript: roteador, templates, localStorage, Chart.js e testes |
| [v3.0.1](https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v3.0.1) | correção (hotfix) | campanha encerrada em links antigos e contagem do mutirão |
| [v4.0.0](https://github.com/natashasantosmk-boop/instituto-elo-animal/releases/tag/v4.0.0) | Experiência Prática IV | acessibilidade WCAG 2.1 AA, temas, build de produção, CI e deploy |

## Funcionalidades

- **SPA com roteador por hash**: oito telas (início, projetos, detalhe de projeto, doações,
  transparência, cadastro, Minha área e acessibilidade) e página 404, sem recarregar a página.
- **Projetos**: busca em tempo real, filtro por categoria, ordenação e favoritos.
- **Doações**: campanhas com situação calculada pela data, alerta de prazo e simulador de impacto.
- **Transparência**: gráficos de rosca e de barras (Chart.js) acompanhados de tabelas com os mesmos dados.
- **Cadastro**: validação com a Constraint Validation API, máscaras, rascunho automático (sem o CPF)
  e envio simulado.
- **Minha área**: inscrições e favoritos guardados no navegador, preferências de exibição e
  download ou exclusão dos dados (LGPD).
- **Preferências de exibição**: tema automático, claro ou escuro; tamanho do texto; animações reduzidas.

## Tecnologias

- **HTML5** semântico, **CSS** com design tokens (paleta + tokens semânticos) e grid de 12 colunas,
  **JavaScript** em módulos ES, sem framework.
- **Chart.js 4.5.1** para os gráficos.
- **Node.js 20+** só para desenvolvimento: [esbuild](https://esbuild.github.io/),
  [Lightning CSS](https://lightningcss.dev/), html-minifier-terser, [SVGO](https://svgo.dev/) e
  sharp no build; [Playwright](https://playwright.dev/) e [axe-core](https://github.com/dequelabs/axe-core)
  nos testes.
- **Git** com GitFlow e Conventional Commits; **GitHub Actions** (CI e deploy) e **GitHub Pages**.

## Como executar

Pré-requisitos: [Node.js](https://nodejs.org/) 20 ou mais recente e Git.

```bash
git clone https://github.com/natashasantosmk-boop/instituto-elo-animal.git
cd instituto-elo-animal
npm ci        # instala as dependências exatas do package-lock.json
npm start     # http://localhost:5500 (código-fonte)
```

O site usa módulos ES e `fetch`, então precisa de um servidor: aberto com duplo clique
(`file://`), ele mostra um aviso explicando o motivo. Sem Node, também dá para usar a extensão
**Live Server** do VS Code ou `python -m http.server 8000` na pasta do projeto.

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | servidor do código-fonte em http://localhost:5500 |
| `npm test` | 36 testes de unidade com o executor nativo do Node (`node --test`) |
| `npm run test:e2e` | 34 cenários de ponta a ponta e de acessibilidade (Playwright, desktop e celular) |
| `npm run test:a11y` | só os testes de acessibilidade (axe-core, teclado, temas e cores forçadas) |
| `npm run build` | gera a versão de produção em `dist/` e mostra os tamanhos antes e depois |
| `npm run preview` | serve a pasta `dist/` em http://localhost:5600 |
| `npm run hooks` | ativa o verificador de mensagens de commit (`.githooks/commit-msg`) |

Para rodar os testes de ponta a ponta contra a versão de produção: `npm run build` e depois
`ALVO=dist npx playwright test` (no PowerShell: `$env:ALVO='dist'; npx playwright test`).

## Estrutura de pastas

```
instituto-elo-animal/
├── index.html              → shell da SPA: cabeçalho, menu, <main id="conteudo">, rodapé e diálogos
├── html/
│   ├── views/              → um fragmento HTML por tela, carregado pelo roteador (fetch + cache)
│   └── componentes.html    → moldes <template> (cartões, itens de lista, linhas de tabela)
├── css/                    → variaveis (tokens e temas) → base → layout → componentes → utilitarios
├── imagens/                → logo, ilustração, projetos/ e icones/
├── js/
│   ├── main.js             → ponto de entrada: mapa de rotas e componentes globais
│   ├── core/               → roteador, templates, armazenamento, bibliotecas e ambiente (dev/produção)
│   ├── componentes/        → menu, modal, toast, favoritos, preferências, validação e cartões
│   ├── paginas/            → um controlador por tela (montar/desmontar)
│   ├── dados/conteudo.js   → fonte única de projetos, campanhas e indicadores
│   ├── utils/              → funções puras (DOM, formatação, validações, máscaras)
│   └── vendor/             → cópia local do Chart.js (licença MIT)
├── scripts/
│   ├── build.mjs           → build de produção (npm run build)
│   └── chart-enxuto.js     → entrada do Chart.js só com rosca e barras (tree-shaking)
├── testes/
│   ├── unidade/            → node --test
│   └── e2e/                → Playwright: spa.spec.js e acessibilidade.spec.js
├── .github/
│   ├── workflows/          → ci.yml (pull requests) e deploy.yml (GitHub Pages)
│   └── pull_request_template.md
├── .githooks/commit-msg    → recusa mensagens fora do Conventional Commits
├── dist/                   → gerada pelo build (não vai para o Git)
├── CHANGELOG.md · CONTRIBUTING.md · LICENSE · README.md
└── package.json · package-lock.json · playwright.config.js · serve.json · .editorconfig
```

## Acessibilidade

Meta: **WCAG 2.1 nível AA**. A declaração completa fica no próprio site, na página
[Acessibilidade](https://natashasantosmk-boop.github.io/instituto-elo-animal/#/acessibilidade).

- **Estrutura semântica**: regiões (`header`, `nav`, `main`, `footer`), títulos em ordem, `lang="pt-BR"`,
  rótulos em todos os campos, `fieldset`/`legend` nos grupos, tabelas com `caption` e `scope`.
- **Teclado**: atalho "Pular para o conteúdo principal", foco sempre visível, menu e submenu com
  `aria-expanded` e Esc, janelas `<dialog>` que prendem e devolvem o foco, radios com setas.
- **Leitores de tela**: título da aba e foco no `<h1>` a cada troca de página, `aria-current` no menu,
  mensagens em `role="status"`, resumo de erros com links para os campos, gráficos com descrição e
  tabelas, números animados lidos já com o valor final.
- **Contraste e modos de tela**: tokens semânticos com temas claro e escuro (`prefers-color-scheme`
  ou escolha na Minha área), contraste reforçado (`prefers-contrast: more`), suporte ao alto contraste
  do Windows (`forced-colors`), tamanho do texto ajustável na Minha área, zoom de até 400% sem
  rolagem lateral e animações desligáveis.

Como foi verificado:

| Verificação | Resultado |
|---|---|
| axe-core (WCAG 2.1 A e AA) nas 9 rotas, temas claro e escuro, e em formulário com erros, janela aberta e tema escuro escolhido | 0 violações |
| 59 combinações de cor do design system (script de contraste) | texto ≥ 5,42:1 e bordas, ícones e foco ≥ 3,54:1 nos dois temas |
| Roteiro de teclado (Playwright): atalho, foco visível, Esc, janelas, troca de página | aprovado no desktop e no celular |
| Largura de 320 px (zoom de 400%) e espaçamento de texto aumentado (WCAG 1.4.12), 9 rotas × 2 temas | sem rolagem lateral e sem texto cortado |
| W3C Nu HTML Checker: index, moldes, 9 views e DOM renderizado de cada rota; CSS | 0 erros |
| Lighthouse (acessibilidade) | 100 |

## Desempenho e build de produção

`npm run build` gera a pasta `dist/`, que é a publicada:

| Tipo | Código-fonte | dist/ | Com gzip |
|---|---|---|---|
| CSS (5 arquivos → 1) | 76,1 KB | 49,0 KB (−36%) | 16,0 → 8,8 KB |
| JavaScript (25 módulos → 16 arquivos) | 112,8 KB | 52,6 KB (−53%) | 34,5 → 24,0 KB |
| Chart.js (completo → enxuto) | 203,6 KB | 166,5 KB (−18%) | 68,9 → 57,9 KB |
| HTML (index, views e moldes) | 67,8 KB | 54,4 KB (−20%) | 21,8 → 18,5 KB |
| Imagens SVG | 17,7 KB | 14,0 KB (−21%) | 5,4 → 4,9 KB |
| Imagens PNG | 4,7 KB | 2,8 KB (−40%) | 3,1 → 2,9 KB |

Lighthouse (celular simulado, mesma máquina e mesmo servidor):

| Página | v3.0.1 (antes) | v4.0.0 (`dist/`) |
|---|---|---|
| Início: desempenho / CLS | 81 / 0,411 | 100 / 0 |
| Início: requisições / bytes transferidos | 26 / 56,0 KiB | 18 / 36,3 KiB |
| Transparência: desempenho / boas práticas | 80 / 96 | 100 / 100 |
| Transparência: requisições / bytes transferidos | 26 / 123,5 KiB | 16 / 92,1 KiB |

O que foi feito: `min-height` no `<main>` (o rodapé "pulava" ao carregar: CLS de 0,41 para 0),
code splitting com `modulepreload`, CSS e HTML minificados, nomes com hash (cache busting),
imagens otimizadas com `width`/`height` e `loading="lazy"`, e Chart.js enxuto servido pelo próprio site.

## Deploy no GitHub Pages

O deploy é contínuo: a cada merge na `main`, o workflow
[`deploy.yml`](.github/workflows/deploy.yml) instala as dependências (`npm ci`), roda os testes de
unidade, gera o build com `BASE_PATH=/instituto-elo-animal/` e publica a pasta `dist/` no ambiente
`github-pages`. O workflow [`ci.yml`](.github/workflows/ci.yml) roda em todo pull request: testes
de unidade, build e os 34 cenários de ponta a ponta no código-fonte e na versão de produção.

Como o roteamento usa hash (`#/projetos`), o GitHub Pages não precisa de regra de reescrita;
o `404.html` gerado no build leva quem digitar um caminho (`/projetos`) para a rota `#/projetos`.
Para publicar um fork: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Versionamento e contribuição

- **GitFlow**: `main` (produção, só recebe `release/*` e `hotfix/*`), `develop` (integração),
  `feature/*`, `release/X.Y.Z` e `hotfix/X.Y.Z`. As duas primeiras são protegidas e só recebem
  pull request com a CI aprovada.
- **Conventional Commits** em português (`feat`, `fix`, `perf`, `docs`, `test`, `build`, `ci`...),
  conferidos pelo hook `.githooks/commit-msg`.
- **Versionamento semântico**: versão no `package.json`, tag `vX.Y.Z`, release no GitHub e
  registro no [CHANGELOG.md](CHANGELOG.md).

O passo a passo está no [CONTRIBUTING.md](CONTRIBUTING.md).

## Testes

```bash
npm test                 # 36 testes de unidade
npx playwright install chromium
npm run test:e2e         # 34 cenários: 7 da SPA e 10 de acessibilidade, no desktop e no celular
```

## Problemas encontrados e corrigidos

| Problema | Como foi descoberto | Correção |
|---|---|---|
| No alto contraste do Windows sumiam as linhas do botão Menu, o coração de favorito e as barras de progresso | capturas com `forced-colors: active` emulado no Playwright | cores do sistema (`ButtonText`, `Highlight`) com `forced-color-adjust: none` |
| Leitores de tela recebiam números pela metade na animação do início | árvore de acessibilidade no meio da animação: "620" no lugar de "1.240" | valor final em texto oculto; só a cópia visual (`aria-hidden`) é animada |
| Um Tab logo depois de abrir o submenu pulava os links | teste de teclado que falhava em execução paralela | `visibility` sem transição na abertura |
| O botão de calendário do campo de data recebia foco sem contorno | teste de foco visível em todos os elementos | `:focus-within` no campo de data |
| O rodapé "pulava" ao carregar a página (CLS 0,41) | Lighthouse (layout-shift) | `min-height: 100svh` no `<main>` |
| Link antigo de campanha encerrada vinculava a doação (v3.0.1) | teste exploratório com URLs de campanhas | `escolhaDeCampanha()` confere a situação pela data |
| Contagem do mutirão dizia "já começou" para sempre (v3.0.1) | revisão do código e teste com relógio simulado (`page.clock`) | horário de término e três estados na contagem |
| `npx serve` redirecionava `.html` (requisição a mais em cada tela) | aba Rede e relatório do Lighthouse | `serve.json` com `cleanUrls: false`, como no GitHub Pages |

## Licença e créditos

Código sob a [licença MIT](LICENSE). Chart.js © Chart.js Contributors (MIT). Logotipo e
ilustrações criados para o projeto.

---
*Projeto acadêmico. A ONG e os dados de contato são fictícios.*
