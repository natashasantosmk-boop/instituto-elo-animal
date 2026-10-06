// Testes de acessibilidade (WCAG 2.1 AA) com Playwright + axe-core. Rodar com: npm run test:a11y
//  - axe em todas as rotas e estados, nos temas claro e escuro;
//  - roteiro de teclado (atalho para o conteúdo, foco visível, Esc, janelas);
//  - preferências de tema, números animados e modo de cores forçadas.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const REGRAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const ROTAS = [
  ['#/', 'Cuidar dos animais é cuidar da comunidade'],
  ['#/projetos', 'Projetos sociais'],
  ['#/projetos/clinica-social', 'Clínica Veterinária Social'],
  ['#/doacoes', 'Doações'],
  ['#/transparencia', 'Transparência'],
  ['#/cadastro', 'Cadastre-se'],
  ['#/minha-area', 'Minha área'],
  ['#/acessibilidade', 'Acessibilidade'],
  ['#/nao-existe', 'Página não encontrada'],
];

async function irPara(page, hash, titulo) {
  await page.evaluate((destino) => { window.location.hash = destino; }, hash);
  if (titulo) await expect(page.locator('main h1')).toHaveText(titulo);
}

/** Roda o axe na página como está agora e devolve as violações num formato legível.
 *  Antes, espera as animações de entrada terminarem (um botão no meio do fade-in
 *  teria contraste "falso" e geraria um alarme indevido). */
async function violacoes(page) {
  await page.waitForFunction(() => document.getAnimations().every((animacao) => animacao.playState !== 'running'
    || animacao.effect?.getComputedTiming().iterations === Infinity));
  const resultado = await new AxeBuilder({ page }).withTags(REGRAS_WCAG).analyze();
  return resultado.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('main h1')).toHaveText(ROTAS[0][1]);
  await page.waitForLoadState('networkidle'); // primeira rota totalmente montada (moldes, view e controlador)
});

for (const tema of ['light', 'dark']) {
  test(`axe: nenhuma violação WCAG 2.1 AA nas ${ROTAS.length} rotas (tema ${tema === 'light' ? 'claro' : 'escuro'})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
    for (const [hash, titulo] of ROTAS) {
      await irPara(page, hash, titulo);
      if (hash === '#/transparencia') await expect(page.locator('[data-status-grafico]')).toHaveText('');
      expect(await violacoes(page), hash).toEqual([]);
    }
  });
}

test('axe: estados com erro, janela modal e preferências', async ({ page }) => {
  await irPara(page, '#/cadastro', 'Cadastre-se');
  await page.getByRole('button', { name: 'Enviar cadastro' }).click();
  await expect(page.locator('#resumo-erros')).toBeVisible();
  expect(await violacoes(page), 'formulário com erros').toEqual([]);

  await page.getByRole('button', { name: 'Ler a Política de Privacidade' }).click();
  await expect(page.getByRole('dialog', { name: 'Política de Privacidade' })).toBeVisible();
  expect(await violacoes(page), 'modal aberta').toEqual([]);
  await page.keyboard.press('Escape');

  await irPara(page, '#/minha-area', 'Minha área');
  await page.getByLabel('Escuro', { exact: true }).check();
  expect(await violacoes(page), 'tema escuro escolhido na Minha área').toEqual([]);
});

test('teclado: o primeiro Tab mostra o atalho e ele leva ao conteúdo principal', async ({ page }) => {
  await page.keyboard.press('Tab');
  const atalho = page.getByRole('link', { name: 'Pular para o conteúdo principal' });
  await expect(atalho).toBeFocused();
  await expect(atalho).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();
});

test('teclado: todo elemento que recebe foco tem contorno visível', async ({ page }) => {
  for (const [hash, titulo] of [ROTAS[1], ROTAS[3], ROTAS[5]]) {
    await irPara(page, hash, titulo);
    await page.locator('main h1').focus();
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const foco = await page.evaluate(() => {
        const el = document.activeElement;
        if (el === document.body) return null; // passou do último elemento da página
        // radios dos chips: o contorno é desenhado no rótulo ao lado
        const alvo = el.matches('.chip input') ? el.nextElementSibling : el;
        const estilo = getComputedStyle(alvo);
        return {
          nome: `${el.tagName.toLowerCase()} ${el.getAttribute('name') || el.textContent.trim().slice(0, 30)}`,
          contorno: estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) >= 2,
          sombra: estilo.boxShadow !== 'none',
        };
      });
      if (!foco) break;
      expect(foco.contorno || foco.sombra, `${hash}: foco visível em ${foco.nome}`).toBe(true);
    }
  }
});

test('teclado: Esc fecha o submenu e a janela e devolve o foco a quem abriu', async ({ page, isMobile }) => {
  if (isMobile) {
    const botaoMenu = page.getByRole('button', { name: 'Menu' });
    await botaoMenu.click();
    await expect(botaoMenu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(botaoMenu).toHaveAttribute('aria-expanded', 'false');
    await expect(botaoMenu).toBeFocused();
  } else {
    const botaoSubmenu = page.locator('.submenu__botao');
    await botaoSubmenu.focus();
    await page.keyboard.press('Enter');
    await expect(botaoSubmenu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(page.locator('#submenu-projetos a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(botaoSubmenu).toHaveAttribute('aria-expanded', 'false');
    await expect(botaoSubmenu).toBeFocused();
  }

  await irPara(page, '#/cadastro', 'Cadastre-se');
  const abrir = page.getByRole('button', { name: 'Ler a Política de Privacidade' });
  await abrir.focus();
  await page.keyboard.press('Enter');
  const janela = page.getByRole('dialog', { name: 'Política de Privacidade' });
  await expect(janela).toBeVisible();
  await expect(janela.locator(':focus')).toHaveCount(1); // o foco entrou na janela
  await page.keyboard.press('Escape');
  await expect(janela).toBeHidden();
  await expect(abrir).toBeFocused();
});

test('troca de página: título da aba muda e o foco vai para o h1', async ({ page }) => {
  await irPara(page, '#/acessibilidade', 'Acessibilidade');
  await expect(page).toHaveTitle('Acessibilidade | Instituto Elo Animal');
  await expect(page.locator('main h1')).toBeFocused();
  await expect(page.locator('footer a[href="#/acessibilidade"]')).toHaveAttribute('aria-current', 'page');
});

test('números animados: o leitor de tela recebe o valor final desde o início', async ({ page }) => {
  const primeiro = page.locator('[data-impacto] li').first();
  await expect(primeiro.locator('.visualmente-oculto')).toHaveText('1.240');
  await expect(primeiro.locator('[data-animado]')).toHaveAttribute('aria-hidden', 'true');
  const textoLido = await primeiro.evaluate((li) => {
    const visiveis = [...li.querySelectorAll('*')].filter((el) => !el.closest('[aria-hidden="true"]') && el.children.length === 0);
    return visiveis.map((el) => el.textContent.trim()).filter(Boolean).join(' ');
  });
  expect(textoLido).toBe('1.240 castrações gratuitas');
});

test('tema: a escolha vale na hora, sobrevive ao recarregar e vence o modo do sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await irPara(page, '#/minha-area', 'Minha área');
  const fundo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await fundo()).toBe('rgb(251, 248, 243)');
  await page.getByLabel('Escuro', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro');
  expect(await fundo()).toBe('rgb(15, 25, 22)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro');
  expect(await fundo()).toBe('rgb(15, 25, 22)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByLabel('Claro', { exact: true }).check();
  expect(await fundo()).toBe('rgb(251, 248, 243)'); // escolha da pessoa > sistema
  await page.getByLabel('Automático', { exact: true }).check();
  await expect(page.locator('html')).not.toHaveAttribute('data-tema');
  expect(await fundo()).toBe('rgb(15, 25, 22)'); // automático segue o sistema (escuro)
});

test('cores forçadas: ícones e barras de progresso continuam visíveis', async ({ page, isMobile }) => {
  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
  await irPara(page, '#/doacoes', 'Doações');
  const ajuste = await page.locator('progress').first().evaluate((barra) => getComputedStyle(barra).forcedColorAdjust);
  expect(ajuste).toBe('none');
  await irPara(page, '#/projetos', 'Projetos sociais');
  const coracao = await page.locator('.favorito__icone').first().evaluate((icone) => ({
    ajuste: getComputedStyle(icone).forcedColorAdjust,
    cor: getComputedStyle(icone).backgroundColor,
    fundo: getComputedStyle(document.body).backgroundColor,
  }));
  expect(coracao.ajuste).toBe('none');
  expect(coracao.cor).not.toBe(coracao.fundo);
  if (isMobile) {
    const linha = await page.locator('.menu__icone').evaluate((icone) => getComputedStyle(icone).backgroundColor);
    expect(linha).not.toBe('rgba(0, 0, 0, 0)');
  }
});
