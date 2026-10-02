import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/** localStorage de mentira (o Node não tem o do navegador). */
class ArmazenamentoFalso {
  constructor() { this.dados = new Map(); this.cheio = false; }
  get length() { return this.dados.size; }
  key(i) { return [...this.dados.keys()][i] ?? null; }
  getItem(chave) { return this.dados.has(chave) ? this.dados.get(chave) : null; }
  setItem(chave, valor) {
    if (this.cheio) throw new Error('QuotaExceededError');
    this.dados.set(chave, String(valor));
  }
  removeItem(chave) { this.dados.delete(chave); }
}

const armazenamento = await import('../../js/core/armazenamento.js');

beforeEach(() => {
  globalThis.localStorage = new ArmazenamentoFalso();
  globalThis.sessionStorage = new ArmazenamentoFalso();
});

test('salvar e ler devolvem o mesmo valor, com prefixo e envelope versionado', () => {
  armazenamento.salvar('favoritos', ['castracao-solidaria']);
  assert.deepEqual(armazenamento.ler('favoritos'), ['castracao-solidaria']);
  const bruto = JSON.parse(localStorage.getItem('eloAnimal:favoritos'));
  assert.equal(bruto.v, 1);
  assert.ok(bruto.salvoEm > 0);
});

test('ler devolve o padrão quando não existe ou o JSON está corrompido', () => {
  assert.deepEqual(armazenamento.ler('inexistente', []), []);
  localStorage.setItem('eloAnimal:quebrado', '{isso não é JSON');
  assert.equal(armazenamento.ler('quebrado', 'padrão'), 'padrão');
});

test('dado vencido é descartado na leitura (rascunho com validade)', () => {
  const agora = Date.now;
  try {
    armazenamento.salvar('rascunho-cadastro', { nome: 'Ana' }, { validadeDias: 7 });
    Date.now = () => agora() + 8 * 24 * 60 * 60 * 1000; // 8 dias depois
    assert.equal(armazenamento.ler('rascunho-cadastro'), null);
    assert.equal(localStorage.getItem('eloAnimal:rascunho-cadastro'), null);
  } finally {
    Date.now = agora;
  }
});

test('salvar devolve false (sem lançar erro) quando o navegador recusa', () => {
  localStorage.cheio = true;
  assert.equal(armazenamento.salvar('inscricoes', [1, 2, 3]), false);
});

test('limparTudo apaga só as chaves do site', () => {
  armazenamento.salvar('favoritos', ['a']);
  localStorage.setItem('outro-app', 'manter');
  armazenamento.limparTudo();
  assert.equal(armazenamento.chaves().length, 0);
  assert.equal(localStorage.getItem('outro-app'), 'manter');
});

test('sessao usa o sessionStorage, separado do localStorage', () => {
  armazenamento.sessao.salvar('filtros-projetos', { busca: 'gato' });
  assert.deepEqual(armazenamento.sessao.ler('filtros-projetos'), { busca: 'gato' });
  assert.equal(armazenamento.ler('filtros-projetos'), null);
});
