# Instituto Elo Animal – plataforma web para ONG

Projeto das **Experiências Práticas I e II** da disciplina **Desenvolvimento Front-end para Web**
(CST em Análise e Desenvolvimento de Sistemas).
Autora: **Natasha Natividade dos Santos**.

O Instituto Elo Animal é uma **ONG fictícia** de proteção animal que trabalha com o conceito de
**Saúde Única** (a saúde dos animais, das pessoas e do ambiente está conectada). O site apresenta a
organização, os projetos sociais e um formulário de cadastro de voluntários e doadores.

- **Experiência Prática I:** estrutura em HTML5 semântico, acessibilidade e formulário com validação nativa.
- **Experiência Prática II:** design system em CSS, layout responsivo com Grid de 12 colunas e
  componentes visuais e interativos (menu responsivo com dropdown, cartões, feedback de formulário,
  alertas, modais e notificações toast).

## Estrutura de diretórios

```
instituto-elo-animal/
├── index.html         → início: apresentação, impacto, projetos em destaque, como ajudar, transparência, perguntas e contato
├── projetos.html      → projetos sociais (4 iniciativas), tabela de resultados, voluntariado e campanhas de doação
├── cadastro.html      → formulário de cadastro de voluntários e doadores
├── css/
│   ├── variaveis.css  → DESIGN SYSTEM: cores, tipografia, espaçamentos, raios, sombras e camadas (tokens)
│   ├── base.css       → reset leve e estilos dos elementos HTML (títulos, links, foco visível)
│   ├── layout.css     → container, grid de 12 colunas, seções e os 5 breakpoints
│   ├── componentes.css→ cabeçalho, menu, botões, cartões, formulários, alertas, modal, toast, rodapé
│   └── utilitarios.css→ classes de propósito único (texto só para leitores de tela, margens...)
├── js/
│   ├── interface.js   → menu hambúrguer, submenu, modais (dialog), toasts e botão "copiar chave Pix"
│   └── cadastro.js    → máscaras, validações, mensagens de erro, envio com carregamento e confirmações
├── img/               → logotipo e ilustrações em SVG + ícones PNG (favicon e tela inicial do celular)
└── README.md
```

Os arquivos CSS são carregados nesta ordem em todas as páginas: `variaveis` → `base` → `layout` →
`componentes` → `utilitarios`. Assim, cada camada só usa o que foi definido antes dela.

## Como abrir

Basta abrir o arquivo `index.html` no navegador. Não é preciso instalar nada nem usar servidor.
No VS Code, a extensão *Live Server* também funciona.

## Design system (css/variaveis.css)

| Grupo | Tokens |
|---|---|
| Cores primárias (verde) | `--cor-primaria-700` #08513a · `-500` #0b6e4f · `-100` #e9f4ef |
| Cores secundárias (terracota) | `--cor-secundaria-700` #8f3907 · `-500` #b4480a · `-100` #fdf1e6 |
| Neutras | `--cor-neutra-900` #1d2a26 · `-600` #4a5a55 · `-400` #7b8c86 · `-200` #cfd8d3 · `-50` #fbf8f3 · `--cor-branca` |
| Feedback | erro #b42318/#fdecea · alerta #7a4d00/#fff4d6 · informação #1a5fb4/#e8f0fb · foco em fundo escuro #ffd166 |
| Tipografia | escala modular 1,25: 12,8 · 16 · 20 · 25 · 31 · 39 px; pesos 400, 600 e 700; entrelinha 1,6 (texto) e 1,2 (títulos) |
| Espaçamentos | escala de 8 px: 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96 px (`--espaco-1` a `--espaco-8`) |
| Outros | raios 4/8/12 px e pílula, 2 sombras, transição de 200 ms, camadas de z-index, container de 1200 px, toque mínimo de 44 px |

Todos os pares de texto e fundo passam no contraste WCAG 2.1 AA (texto principal 14:1, texto de apoio 6,9:1,
branco sobre o verde 6,3:1, branco sobre a terracota 5,4:1).

## Layout responsivo (css/layout.css)

- `body` em grid de 3 linhas (`auto 1fr auto`): o rodapé fica sempre no fim da tela.
- `.grade`: grid de 12 colunas (`repeat(12, minmax(0, 1fr))`); no celular todo item ocupa as 12 colunas e as
  classes `.col-sm-6`, `.col-md-4…8` e `.col-lg-3…8` mudam o espaço a partir de cada breakpoint.
- 5 breakpoints *mobile-first*: **sm 36rem (576 px)**, **md 48rem (768 px)**, **lg 62rem (992 px)**,
  **xl 75rem (1200 px)** e **xxl 90rem (1440 px)**. Testado de 320 a 1920 px sem rolagem horizontal.

## Componentes (css/componentes.css + js)

- **Menu:** horizontal a partir de 768 px, com o submenu "Projetos" em *dropdown* (abre com o mouse ou pelo
  botão com `aria-expanded`); abaixo de 768 px vira um painel aberto pelo botão hambúrguer. Esc fecha e devolve o
  foco; clicar fora ou escolher um link também fecha. Sem JavaScript, o menu aparece aberto.
- **Cartões:** Flexbox em coluna; imagem no topo com `order` (o título vem primeiro no HTML), etiquetas
  (*badges*), rodapé alinhado com `margin-top: auto` e o cartão inteiro clicável ("link esticado"), com
  efeitos de `:hover` e `:focus-within`.
- **Botões:** variações primária, secundária, contorno, clara, perigo e pequena; estados `:hover`, `:active`,
  `:focus-visible`, desabilitado e carregando ("Enviando..." com ícone girando).
- **Formulário:** cada erro aparece junto do campo, com ícone e texto, ligado por `aria-describedby` e marcado com
  `aria-invalid`; campo válido ganha borda verde e ✓; `:user-invalid` marca erros mesmo sem JavaScript;
  resumo de erros com links para cada campo.
- **Feedback:** alertas contextuais (informação, aviso, erro e sucesso), janelas modais com `<dialog>` (Política de
  Privacidade e confirmação antes de limpar o formulário) e notificações *toast* (chave Pix copiada, formulário
  limpo) anunciadas por `role="status"`.
- Animações curtas (200–300 ms) e desligadas para quem ativa "reduzir movimento" no sistema.

## Validação

- **W3C Nu HTML Checker:** 0 erros e 0 avisos nas três páginas; os 5 arquivos CSS também sem erros.
- **axe-core** (WCAG 2.1/2.2 AA): nenhuma violação, inclusive com menu, modal, toast e erros do formulário abertos.
- **Testes automatizados (Playwright):** 100 verificações de menu, dropdown, teclado, modais, toasts, máscaras,
  validações, envio e limpeza do formulário; sem rolagem horizontal de 320 a 1920 px.

## Próximos passos

- consultar o CEP (API ViaCEP) para preencher o endereço automaticamente;
- criar um back-end para guardar os cadastros;
- publicar o site no GitHub Pages.

---
*Projeto acadêmico. A ONG e os dados de contato são fictícios.*
