import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarMoeda, formatarNumero, formatarData, diasAte, pluralizar, percentual, formatarQuantidade, normalizarTexto, paraDataLocal,
} from '../../js/utils/formatacao.js';

const semEspacoDuro = (texto) => texto.replace(/ /g, ' ');

test('moeda e números no padrão brasileiro', () => {
  assert.equal(semEspacoDuro(formatarMoeda(9600)), 'R$ 9.600');
  assert.equal(formatarNumero(1240), '1.240');
});

test('paraDataLocal não "volta um dia" por causa do fuso (bug corrigido)', () => {
  const data = paraDataLocal('2026-12-15');
  assert.equal(data.getDate(), 15);
  assert.equal(data.getMonth(), 11);
  assert.equal(formatarData('2026-12-15'), '15 de dezembro de 2026');
});

test('diasAte conta dias de calendário, independentemente da hora', () => {
  assert.equal(diasAte('2026-12-15', new Date(2026, 9, 1, 0, 5)), 75);
  assert.equal(diasAte('2026-12-15', new Date(2026, 9, 1, 23, 59)), 75);
  assert.equal(diasAte('2026-09-30', new Date(2026, 9, 1)), -1);
});

test('pluralizar e percentual', () => {
  assert.equal(pluralizar(1, 'dia', 'dias'), '1 dia');
  assert.equal(pluralizar(75, 'dia', 'dias'), '75 dias');
  assert.equal(percentual(9600, 15000), 64);
  assert.equal(percentual(9000, 8000), 100); // nunca passa de 100
  assert.equal(percentual(10, 0), 0); // sem divisão por zero
});

test('formatarQuantidade usa a unidade da campanha', () => {
  assert.equal(formatarQuantidade(1200, 'kg'), '1,2 t');
  assert.equal(formatarQuantidade(800, 'kg'), '800 kg');
  assert.equal(semEspacoDuro(formatarQuantidade(15000, 'reais')), 'R$ 15.000');
});

test('normalizarTexto ignora acentos, maiúsculas e espaços nas pontas', () => {
  assert.equal(normalizarTexto('  Adoção '), 'adocao');
  assert.equal(normalizarTexto('SAÚDE Animal'), 'saude animal');
});
