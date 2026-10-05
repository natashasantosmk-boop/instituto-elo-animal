// Fontes do Chart.js: em desenvolvimento, CDN com SRI e cópia local de reserva
// (a versão de produção é conferida pelos testes de ponta a ponta com ALVO=dist)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONTES_CHART_JS, VERSAO_CHART_JS } from '../../js/core/bibliotecas.js';
import { PRODUCAO } from '../../js/core/ambiente.js';

test('código-fonte roda em modo de desenvolvimento', () => {
  assert.equal(PRODUCAO, false);
});

test('Chart.js: CDN com integridade SHA-384 primeiro e cópia local depois', () => {
  const [cdn, local] = FONTES_CHART_JS;
  assert.equal(cdn.src, `https://cdn.jsdelivr.net/npm/chart.js@${VERSAO_CHART_JS}/dist/chart.umd.min.js`);
  assert.match(cdn.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
  assert.equal(local.src, 'js/vendor/chart.umd.min.js');
});
