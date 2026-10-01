// Testes de ponta a ponta da SPA (Playwright). Rodar com: npm run test:e2e
import { test, expect } from '@playwright/test';

/** Navega como um link da SPA faz: só troca o hash (sem recarregar a página). */
async function irPara(page, hash) {
  await page.evaluate((destino) => { window.location.hash = destino; }, hash);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('main h1')).toHaveText('Cuidar dos animais é cuidar da comunidade');
});

test('navega entre as views sem recarregar a página', async ({ page }) => {
  await page.evaluate(() => { window.marcaDaSessao = 'sem-recarga'; });
  await irPara(page, '#/projetos');
  await expect(page.locator('main h1')).toHaveText('Projetos sociais');
  await expect(page).toHaveTitle('Projetos sociais | Instituto Elo Animal');
  await expect(page.locator('main h1')).toBeFocused();
  await page.goBack();
  await expect(page.locator('main h1')).toHaveText('Cuidar dos animais é cuidar da comunidade');
  expect(await page.evaluate(() => window.marcaDaSessao)).toBe('sem-recarga');
});

test('rota com parâmetro e página 404', async ({ page }) => {
  await irPara(page, '#/projetos/castracao-solidaria');
  await expect(page.locator('main h1')).toHaveText('Castração Solidária');
  await irPara(page, '#/projetos/nao-existe');
  await expect(page.locator('main h1')).toHaveText('Página não encontrada');
});

test('busca filtra os projetos enquanto a pessoa digita', async ({ page }) => {
  await irPara(page, '#/projetos');
  const cartoes = page.locator('[data-lista-projetos] article');
  await expect(cartoes).toHaveCount(4);
  await page.getByLabel('Buscar por palavra').fill('adoção');
  await expect(cartoes).toHaveCount(1);
  await expect(page.locator('[data-resultado]')).toContainText('1 projeto encontrado');
});

test('favorito fica salvo no localStorage e aparece na Minha área', async ({ page }) => {
  await irPara(page, '#/projetos');
  const botao = page.getByRole('button', { name: 'Favoritar Clínica Veterinária Social' });
  await botao.click();
  await expect(botao).toHaveAttribute('aria-pressed', 'true');
  await irPara(page, '#/minha-area');
  await expect(page.locator('[data-lista-favoritos] li')).toHaveCount(1);
});

test('cadastro: mostra o resumo de erros e guarda rascunho sem o CPF', async ({ page }) => {
  await irPara(page, '#/cadastro');
  await page.getByRole('button', { name: 'Enviar cadastro' }).click();
  await expect(page.locator('#resumo-erros')).toBeVisible();
  await expect(page.locator('#resumo-erros')).toBeFocused();
  await page.locator('#nome').fill('Ana Souza');
  await page.locator('#cpf').pressSequentially('52998224725');
  await expect(page.locator('#cpf')).toHaveValue('529.982.247-25');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('eloAnimal:rascunho-cadastro'))).not.toBeNull();
  const rascunho = await page.evaluate(() => JSON.parse(localStorage.getItem('eloAnimal:rascunho-cadastro')).valor);
  expect(rascunho.nome).toBe('Ana Souza');
  expect(rascunho.cpf).toBeUndefined(); // LGPD: o CPF não fica no navegador
  await page.reload();
  await expect(page.locator('#nome')).toHaveValue('Ana Souza');
  await expect(page.locator('[data-aviso-rascunho]')).toBeVisible();
});

test('simulador recalcula o impacto da doação', async ({ page }) => {
  await irPara(page, '#/doacoes');
  await page.getByLabel('Ou digite o valor (R$)').fill('120');
  await expect(page.locator('[data-resultado-lista]')).toContainText('castração');
  await expect(page.locator('[data-link-doar]')).toHaveAttribute('href', '#/cadastro?tipo=doador&valor=120');
});

test('transparência desenha os gráficos com a biblioteca externa e os destrói ao sair', async ({ page }) => {
  await irPara(page, '#/transparencia');
  await expect.poll(() => page.evaluate(() => (window.Chart ? Object.keys(window.Chart.instances).length : 0)), { timeout: 15000 }).toBe(2);
  await irPara(page, '#/');
  await expect.poll(() => page.evaluate(() => Object.keys(window.Chart.instances).length)).toBe(0);
});
