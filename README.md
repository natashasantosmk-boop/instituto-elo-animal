# Instituto Elo Animal – plataforma web para ONG

Projeto da **Experiência Prática I** da disciplina **Desenvolvimento Front-end para Web**
(CST em Análise e Desenvolvimento de Sistemas).
Autora: **Natasha Natividade dos Santos**.

O Instituto Elo Animal é uma **ONG fictícia** de proteção animal que trabalha com o conceito de
**Saúde Única** (a saúde dos animais, das pessoas e do ambiente está conectada). O site apresenta a
organização, os projetos sociais e um formulário de cadastro de voluntários e doadores.

## Estrutura de diretórios

```
instituto-elo-animal/
├── index.html      → página inicial: apresentação, impacto, como ajudar, transparência e contato
├── projetos.html   → projetos sociais (4 iniciativas) e tabela de resultados
├── cadastro.html   → formulário de cadastro de voluntários e doadores
├── css/
│   └── estilo.css  → folha de estilo única, compartilhada pelas três páginas
├── js/
│   └── cadastro.js → máscaras (CPF, telefone, CEP) e validações complementares
├── img/            → logotipo e ilustrações em SVG (criadas para o projeto)
│                     + ícones PNG (favicon-32.png e apple-touch-icon.png)
└── README.md
```

## Como abrir

Basta abrir o arquivo `index.html` no navegador. Não é preciso instalar nada nem usar servidor.
No VS Code, a extensão *Live Server* também funciona.

## O que foi aplicado

**HTML5 semântico**
- `header`, `nav`, `main`, `section`, `article`, `aside` e `footer` em todas as páginas;
- `figure` + `figcaption` nas ilustrações dos projetos, `address` nos contatos, `time` na data do mutirão e `data` nos números de impacto;
- tabela com `caption`, `thead`, `tbody` e `th scope`;
- um único `h1` por página e hierarquia de títulos sem saltos (h1 → h2 → h3).

**Acessibilidade**
- `lang="pt-BR"`, link "Pular para o conteúdo principal" e `aria-current="page"` no menu;
- `alt` descritivo nas imagens informativas e `alt=""` no logotipo (decorativo, pois o nome da ONG já aparece ao lado);
- todo campo tem `label` associado; grupos de campos com `fieldset` + `legend`; dicas ligadas por `aria-describedby`;
- foco visível, contraste de cores adequado e mensagem de envio com `role="status"`.

**Formulário (cadastro.html)**
- validações nativas: `required`, `type="email" | "tel" | "date" | "number"`, `pattern`, `min`/`max`, `minlength`/`maxlength`, `step`;
- máscaras automáticas: CPF `000.000.000-00`, telefone `(00) 00000-0000` e CEP `00000-000`;
- conferência dos dígitos verificadores do CPF e idade mínima de 18 anos (Constraint Validation API);
- campos de voluntariado e de doação aparecem conforme a opção escolhida (`fieldset` desabilitado não é validado);
- consentimento de uso de dados conforme a LGPD.

**Imagens otimizadas**
- SVG para o logotipo e as ilustrações (vetor: nítido em qualquer tela e com poucos KB);
- PNG para o favicon e o ícone da tela inicial do celular (formatos que exigem imagem rasterizada);
- `width` e `height` em todas as imagens e `loading="lazy"` nas que ficam abaixo da primeira dobra.

**Organização e boas práticas**
- arquivos separados por tipo (HTML na raiz, `css/`, `js/`, `img/`);
- CSS *mobile-first* com variáveis, Grid e Flexbox; nenhuma rolagem horizontal em telas de 390 px;
- nomes de classes em português e padronizados; comentários explicando cada bloco.

## Validação

- **W3C Nu HTML Checker**: 0 erros e 0 avisos nas três páginas; CSS também validado;
- **axe-core** (WCAG 2.1 AA): nenhuma violação encontrada;
- 45 testes automatizados do formulário (máscaras, validações e envio): todos aprovados.

## Próximos passos

- consultar o CEP (API ViaCEP) para preencher o endereço automaticamente;
- criar um back-end para guardar os cadastros;
- publicar o site no GitHub Pages.

---
*Projeto acadêmico. A ONG e os dados de contato são fictícios.*
