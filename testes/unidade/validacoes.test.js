// Testes das regras de negócio do formulário (rodar com: npm test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  somenteDigitos, cpfValido, calcularIdade, dataMaximaNascimento, nomeCompletoValido, formatarDataISO,
} from '../../js/utils/validacoes.js';

test('somenteDigitos remove pontuação e letras', () => {
  assert.equal(somenteDigitos('529.982.247-25'), '52998224725');
  assert.equal(somenteDigitos(undefined), '');
});

test('cpfValido aceita CPF com dígitos verificadores corretos', () => {
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('52998224725'), true);
});

test('cpfValido recusa dígito errado, sequência repetida e tamanho incorreto', () => {
  assert.equal(cpfValido('529.982.247-24'), false);
  assert.equal(cpfValido('111.111.111-11'), false);
  assert.equal(cpfValido('123.456.789'), false);
});

test('calcularIdade considera se o aniversário do ano já passou', () => {
  const hoje = new Date(2026, 9, 1); // 1º de outubro de 2026
  assert.equal(calcularIdade('2008-10-01', hoje), 18); // faz 18 hoje
  assert.equal(calcularIdade('2008-10-02', hoje), 17); // faz 18 amanhã
  assert.equal(calcularIdade('1990-12-31', hoje), 35);
});

test('dataMaximaNascimento devolve o limite para 18 anos no formato do input date', () => {
  assert.equal(dataMaximaNascimento(18, new Date(2026, 9, 1)), '2008-10-01');
  assert.equal(formatarDataISO(new Date(2026, 0, 5)), '2026-01-05');
});

test('nomeCompletoValido exige nome e sobrenome com letras', () => {
  assert.equal(nomeCompletoValido('Ana Souza'), true);
  assert.equal(nomeCompletoValido("Maria D'Ávila Lima"), true);
  assert.equal(nomeCompletoValido('Ana'), false);
  assert.equal(nomeCompletoValido('Ana 123'), false);
});
