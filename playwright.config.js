// Configuração dos testes de ponta a ponta (npm run test:e2e)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './testes/e2e',
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5500/',
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
  },
  // Sobe o servidor estático antes dos testes (a SPA usa módulos ES e fetch)
  webServer: {
    command: 'npx --yes serve -l 5500 .',
    url: 'http://localhost:5500/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
});
