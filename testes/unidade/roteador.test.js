import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretarHash, encontrarRota, ehLinkDeRota } from '../../js/core/roteador.js';

const rotas = [
  { caminho: '/', view: 'inicio' },
  { caminho: '/projetos', view: 'projetos' },
  { caminho: '/projetos/:id', view: 'projeto' },
];

test('interpretarHash separa caminho e consulta e normaliza barras', () => {
  assert.equal(interpretarHash('').caminho, '/');
  assert.equal(interpretarHash('#/').caminho, '/');
  assert.equal(interpretarHash('#/projetos/').caminho, '/projetos');
  const { caminho, consulta } = interpretarHash('#/projetos?busca=gato&categoria=saude');
  assert.equal(caminho, '/projetos');
  assert.equal(consulta.get('busca'), 'gato');
  assert.equal(consulta.get('categoria'), 'saude');
});

test('interpretarHash não quebra com "%" inválido na URL', () => {
  assert.equal(interpretarHash('#/busca%').caminho, '/busca%');
});

test('encontrarRota casa rotas fixas e com parâmetro', () => {
  assert.equal(encontrarRota('/', rotas).rota.view, 'inicio');
  assert.equal(encontrarRota('/projetos', rotas).rota.view, 'projetos');
  const detalhe = encontrarRota('/projetos/castracao-solidaria', rotas);
  assert.equal(detalhe.rota.view, 'projeto');
  assert.deepEqual(detalhe.params, { id: 'castracao-solidaria' });
});

test('encontrarRota devolve null para caminho desconhecido (vira a página 404)', () => {
  assert.equal(encontrarRota('/nao-existe', rotas), null);
  assert.equal(encontrarRota('/projetos/a/b', rotas), null);
});

test('ehLinkDeRota distingue rota (#/...) de âncora (#conteudo)', () => {
  assert.equal(ehLinkDeRota('#/doacoes'), true);
  assert.equal(ehLinkDeRota('#conteudo'), false);
  assert.equal(ehLinkDeRota(null), false);
});
