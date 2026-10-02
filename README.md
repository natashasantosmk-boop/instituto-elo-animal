# Instituto Elo Animal – SPA para uma ONG de proteção animal

Projeto das **Experiências Práticas I, II e III** da disciplina **Desenvolvimento Front-end para Web**
(CST em Análise e Desenvolvimento de Sistemas). Autora: **Natasha Natividade dos Santos**.

O Instituto Elo Animal é uma **ONG fictícia** de proteção animal que trabalha com o conceito de
**Saúde Única** (a saúde dos animais, das pessoas e do ambiente está conectada).

- **Experiência Prática I:** estrutura em HTML5 semântico, acessibilidade e formulário com validação nativa.
- **Experiência Prática II:** design system em CSS, Grid de 12 colunas responsivo e componentes visuais.
- **Experiência Prática III (esta versão):** o site estático virou uma **SPA (Single Page Application)** em
  JavaScript puro, com roteador por hash, templates dinâmicos, eventos, validação de formulário,
  dados no navegador (localStorage/sessionStorage), biblioteca externa (Chart.js), código em módulos ES
  e testes automatizados.

## Como executar

Por usar **módulos ES** (`<script type="module">`) e `fetch`, a SPA precisa de um servidor local
(o navegador bloqueia módulos abertos com duplo clique, no endereço `file://`; nesse caso o site
mostra um aviso explicando o motivo). Qualquer uma das opções abaixo funciona:

| Opção | Comando | Endereço |
|---|---|---|
| VS Code | extensão **Live Server** → "Go Live" | o que o Live Server abrir |
| Node.js | `npm start` (usa `npx serve`) | http://localhost:5500 |
| Python | `python -m http.server 8000` | http://localhost:8000 |

## Estrutura de diretórios

```
instituto-elo-animal/
├── index.html              → SHELL da SPA: cabeçalho, menu, <main id="conteudo"> (onde as views entram),
│                             rodapé, área de notificações e diálogo de confirmação
├── html/
│   ├── views/              → um fragmento HTML por tela, carregado pelo roteador com fetch (e guardado em cache)
│   │   ├── inicio.html  projetos.html  projeto.html  doacoes.html
│   │   └── transparencia.html  cadastro.html  minha-area.html  nao-encontrada.html
│   └── componentes.html    → moldes <template>: cartão de projeto, cartão de campanha, pergunta, inscrição...
├── css/                    → variaveis.css (design tokens) → base → layout → componentes → utilitarios
├── imagens/                → logo e ilustração, projetos/ (uma por projeto) e icones/ (favicon e tela inicial)
├── js/
│   ├── main.js             → ponto de entrada: MAPA DE ROTAS e inicialização dos componentes globais
│   ├── core/               → infraestrutura da SPA
│   │   ├── roteador.js     → rotas por hash, :parâmetros, 404, troca de view, título, foco e aria-current
│   │   ├── templates.js    → carrega views e moldes; preenche data-campo/data-atributo/data-lista
│   │   ├── armazenamento.js→ única porta para o localStorage/sessionStorage (prefixo, versão, validade, try/catch)
│   │   └── bibliotecas.js  → carrega bibliotecas externas sob demanda (CDN com SRI + cópia local de reserva)
│   ├── componentes/        → comportamentos reutilizáveis: menu, modal, toast, favoritos, preferências,
│   │                         validação de formulários e modelos dos cartões
│   ├── paginas/            → um controlador por view: montar() liga os eventos; a saída da rota os desliga
│   ├── dados/conteudo.js   → fonte única de projetos, campanhas, indicadores, perguntas e custos
│   ├── utils/              → funções puras: dom, formatacao (Intl), validacoes (CPF, idade), mascaras
│   └── vendor/             → cópia local do Chart.js 4.5.1 (licença MIT), usada se a CDN falhar
├── testes/
│   ├── unidade/            → testes das funções puras com o executor nativo do Node (node --test)
│   └── e2e/                → testes de ponta a ponta no navegador (Playwright)
├── package.json            → scripts start, test e test:e2e
└── README.md
```

## Rotas da SPA

| Hash | View | O que tem |
|---|---|---|
| `#/` | inicio | apresentação, números animados, projetos em destaque, contagem regressiva do mutirão, perguntas |
| `#/projetos` | projetos | busca em tempo real, filtro por categoria, ordenação, "só favoritos", tabela de resultados |
| `#/projetos/:id` | projeto | detalhe de qualquer projeto (uma view para todos), anterior/próximo |
| `#/doacoes` | doacoes | campanhas com situação calculada pela data, alerta de prazo, simulador de doação, chave Pix |
| `#/transparencia` | transparencia | gráficos de rosca e de barras (Chart.js) + tabelas com os mesmos dados |
| `#/cadastro` | cadastro | formulário com validação, máscaras, rascunho automático e envio simulado |
| `#/minha-area` | minha-area | inscrições salvas, favoritos, preferências, baixar ou apagar os dados (LGPD) |
| qualquer outro | nao-encontrada | página 404 |

Parâmetros aceitos: `#/?secao=perguntas` rola até a seção; `#/projetos?busca=gato&categoria=saude`
abre a lista já filtrada; `#/cadastro?tipo=doador&valor=60&campanha=vacina-solidaria` chega pré-preenchido.

## Como a navegação funciona

1. Os links são `<a href="#/projetos">` comuns. Trocar o hash não recarrega a página.
2. O evento `hashchange` chama `renderizar()` no `core/roteador.js`, que separa caminho e consulta,
   encontra a rota (ou a 404) e **desmonta a view anterior**: um `AbortController` remove de uma vez
   todos os ouvintes de eventos, temporizadores e gráficos que ela criou.
3. O HTML da view (`fetch`, com cache) e o controlador (`import()` sob demanda) são carregados em paralelo.
4. `main.replaceChildren(fragmento)` limpa o contêiner e injeta a view; `montar()` preenche os dados e
   liga os eventos. Um contador de navegação descarta respostas atrasadas (vale sempre o último clique).
5. O título da aba e o `aria-current` do menu são atualizados, e o foco vai para o `<h1>` da nova tela.

## Dados no navegador

| Chave (`eloAnimal:` + …) | Onde | Conteúdo |
|---|---|---|
| `preferencias` | localStorage | tamanho do texto e animações (aplicados antes da 1ª pintura por um script no `<head>`) |
| `favoritos` | localStorage | ids dos projetos favoritados (contador no menu, sincronizado entre abas) |
| `rascunho-cadastro` | localStorage | formulário em andamento, **sem o CPF**; expira em 7 dias |
| `inscricoes` | localStorage | resumo dos cadastros enviados (sem CPF, telefone ou endereço completo) |
| `filtros-projetos` | sessionStorage | filtros da lista de projetos durante a visita |

Cada valor é salvo como `{ v, valor, salvoEm, expira }`. Toda leitura e escrita tem `try/catch`: se o
navegador recusar (modo privativo, cota cheia) ou o JSON estiver corrompido, o site continua funcionando.

## Biblioteca externa

**Chart.js 4.5.1** desenha os gráficos da Transparência. É baixado só quando essa página abre, da CDN
jsDelivr com **Subresource Integrity** (`integrity="sha384-…"` + `crossorigin`); se a CDN falhar, vem a
cópia em `js/vendor/`; se tudo falhar, a página mostra as tabelas. As cores vêm dos tokens do design system
e cada `<canvas>` tem `role="img"` com `aria-label` descrevendo os dados.

## Testes

```bash
npm test            # 32 testes de unidade (node --test), sem instalar nada
npm install         # só para os testes de ponta a ponta
npx playwright install chromium
npm run test:e2e    # testes no navegador (sobe o servidor sozinho)
```

## Validação

- **W3C Nu HTML Checker:** 0 erros no index.html, no componentes.html, nas 8 views e também no DOM já
  renderizado de cada rota; CSS sem erros.
- **axe-core** (WCAG 2.1/2.2 AA): nenhuma violação em 30 estados de tela (8 rotas, lista vazia, formulário
  com erros, rascunho restaurado, modais, menu, dropdown e toast), no desktop e no celular.
- **Testes de unidade:** 32 aprovados (`npm test`), inclusive no fuso America/Fortaleza.
- **Testes de ponta a ponta:** 7 cenários aprovados no desktop e no celular (14 execuções).
- Na validação final também rodei uma bateria de interação com 123 verificações (navegação, voltar/avançar,
  404, filtros, favoritos entre abas, simulador, gráficos, formulário, rascunho, Minha área e menu) e testes de
  largura de 320 a 1920 px: sem rolagem horizontal e sem erros no console.

## Problemas encontrados e corrigidos

| Problema | Correção |
|---|---|
| Entre 992 e 1199 px, itens do menu quebravam em duas linhas | hambúrguer até 991 px, `white-space: nowrap` e nome da ONG só para leitores de tela nessa faixa |
| A 404 de um projeto inexistente deixava "Projetos" ativo no menu | o roteador limpa o `aria-current` quando a rota é a 404 |
| Erros no validador W3C (link com `rel` sem `href`, `time` vazio, `mask` abreviada) | valores de reserva nas views e propriedades `mask-*` separadas |
| Gráficos ficariam acumulados na memória (sem `destroy`, `Chart.instances` ia a 4, 6, 8) | `desmontar()` chama `chart.destroy()`; ouvintes e timers saem pelo `AbortController` |
| `new Date("2026-12-15")` vira 14/12 às 21h no fuso do Brasil | `paraDataLocal()` e `diasAte()` com datas locais, cobertos por testes |
| CDN indisponível na rede de testes | carregamento com SRI → cópia local → tabelas como alternativa |
| Site em branco ao abrir com duplo clique (`file://`) | aviso explicativo e menu sempre aberto nesse caso |
| `node --test pasta/` falha no Node 22 | script `npm test` com padrão glob |

---
*Projeto acadêmico. A ONG e os dados de contato são fictícios.*
