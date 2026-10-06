# Como contribuir

Este guia reúne as regras do repositório: fluxo de branches, padrão das mensagens de commit,
versionamento, pull requests e o que conferir antes de pedir revisão.

## Preparar o ambiente

Requisitos: [Node.js](https://nodejs.org/) 20 ou mais recente e Git.

```bash
git clone https://github.com/natashasantosmk-boop/instituto-elo-animal.git
cd instituto-elo-animal
npm ci                  # instala as dependências exatas do package-lock.json
npm run hooks           # ativa o verificador de mensagens de commit (.githooks/commit-msg)
npm start               # servidor local em http://localhost:5500
```

## Fluxo de branches (GitFlow)

| Branch | Sai de | Volta para | Para quê |
|---|---|---|---|
| `main` | — | — | Código em produção. Só recebe merge de `release/*` ou `hotfix/*`; cada merge ganha uma tag (`vX.Y.Z`) e é publicado no GitHub Pages. |
| `develop` | `main` | — | Integração: reúne as funcionalidades prontas para a próxima versão. |
| `feature/<assunto>` | `develop` | `develop` (pull request) | Uma funcionalidade ou correção não urgente. Ex.: `feature/acessibilidade-wcag`. |
| `release/X.Y.Z` | `develop` | `main` e `develop` (pull requests) | Congela a versão: número no `package.json`, data no `CHANGELOG.md` e últimos ajustes. |
| `hotfix/X.Y.Z` | `main` | `main` e `develop` | Correção urgente de algo que já está em produção. Ex.: `hotfix/3.0.1`. |

```bash
git switch develop && git pull
git switch -c feature/minha-funcionalidade
# ...commits pequenos e com mensagem no padrão...
git push -u origin feature/minha-funcionalidade   # e abra o pull request para develop
```

As branches `main` e `develop` são protegidas: não aceitam push direto e só recebem pull request
com a verificação automática (CI) aprovada.

## Mensagens de commit (Conventional Commits)

```
tipo(escopo opcional): resumo em minúsculas, no presente e sem ponto final

Corpo opcional explicando o porquê da mudança.
```

| Tipo | Quando usar | Efeito na versão |
|---|---|---|
| `feat` | funcionalidade nova | MINOR |
| `fix` | correção de erro | PATCH |
| `perf` | melhora de desempenho | PATCH |
| `docs` | só documentação | — |
| `style` | formatação, sem mudar o comportamento | — |
| `refactor` | reorganização do código, sem mudar o comportamento | — |
| `test` | testes novos ou ajustados | — |
| `build` | script de build e dependências | — |
| `ci` | GitHub Actions | — |
| `chore` | tarefas gerais (versão, configuração) | — |
| `revert` | desfaz um commit anterior | — |

Uma mudança incompatível leva `!` depois do tipo (`feat!:`) ou a linha `BREAKING CHANGE:` no corpo,
e gera versão MAJOR. Exemplos do histórico:

```
feat(tema): modo escuro automático e escolha de tema na Minha área
fix(a11y): ícones e barras de progresso visíveis no modo de cores forçadas
perf(layout): reserva a altura do conteúdo e elimina o deslocamento do rodapé
build: script de build de produção com esbuild e Lightning CSS
chore(release): versão 4.0.0
```

Com `npm run hooks`, o Git passa a usar a pasta `.githooks`, e o script `commit-msg` recusa
mensagens fora desse padrão (merges e reverts gerados pelo Git são aceitos).

## Versionamento semântico (MAJOR.MINOR.PATCH)

- **MAJOR**: mudança incompatível. Neste site, quando endereços, arquivos publicados ou a forma de
  executar o projeto mudam (ex.: 3.0.0 trocou as páginas `.html` pela SPA; 4.0.0 passou a publicar
  o build da pasta `dist/`).
- **MINOR**: funcionalidade nova compatível com a versão anterior.
- **PATCH**: correção compatível (ex.: 3.0.1).

A versão fica no `package.json`, na tag do Git (`v4.0.0`), na release do GitHub e no `CHANGELOG.md`.

## Pull requests

1. Abra o pull request para `develop` (ou para `main`, no caso de `release/*` e `hotfix/*`).
2. Preencha o modelo: o que muda, por quê, como testar e o checklist.
3. Aguarde a CI (testes de unidade, build, testes de ponta a ponta e de acessibilidade).
4. Faça o merge com **Create a merge commit**: equivale ao `git merge --no-ff` e mantém junto o bloco
   de commits da funcionalidade. Depois do merge, apague a branch.

### Checklist antes de pedir revisão

- [ ] `npm test` e `npm run test:e2e` passam.
- [ ] `npm run test:a11y` não aponta violações das WCAG 2.1 AA.
- [ ] A mudança funciona só com o teclado e com o tema escuro.
- [ ] `npm run build` termina sem erros e `npm run preview` mostra o site funcionando.
- [ ] README e CHANGELOG atualizados, se a mudança for visível para quem usa o site.

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | servidor de desenvolvimento (código-fonte) em http://localhost:5500 |
| `npm test` | testes de unidade (`node --test`) |
| `npm run test:e2e` | testes de ponta a ponta e de acessibilidade (Playwright, desktop e celular) |
| `npm run test:a11y` | só os testes de acessibilidade (axe-core, teclado, temas e cores forçadas) |
| `ALVO=dist npx playwright test` | os mesmos testes na versão de produção (depois de `npm run build`) |
| `npm run build` | gera a versão de produção em `dist/` |
| `npm run preview` | serve a pasta `dist/` em http://localhost:5600 |
| `npm run hooks` | ativa o verificador de mensagens de commit |
