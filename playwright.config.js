// Configuração dos testes de ponta a ponta (npm run test:e2e)
// Por padrão testa o código-fonte. Com ALVO=dist, testa a versão de produção
// gerada por npm run build (é o que a CI faz antes de publicar).
import { defineConfig, devices } from '@playwright/test';

const PRODUCAO = process.env.ALVO === 'dist';
const PORTA = PRODUCAO ? 5600 : 5500;

export default defineConfig({
  testDir: './testes/e2e',
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
  },
  // Sobe o servidor estático antes dos testes (a SPA usa módulos ES e fetch)
  webServer: {
    command: `npx serve -l ${PORTA} ${PRODUCAO ? 'dist -c ../serve.json' : '.'}`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
});
