import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarMascara, mascaraCPF, mascaraTelefone, mascaraCEP } from '../../js/utils/mascaras.js';

test('aplicarMascara encaixa os dígitos no molde', () => {
  assert.equal(aplicarMascara('12345678', '00000-000'), '12345-678');
  assert.equal(aplicarMascara('12a3', '000'), '123'); // letras são ignoradas
});

test('máscara de CPF funciona durante a digitação (parcial) e completa', () => {
  assert.equal(mascaraCPF('5299'), '529.9');
  assert.equal(mascaraCPF('52998224725'), '529.982.247-25');
  assert.equal(mascaraCPF('529.982.247-25999'), '529.982.247-25'); // não passa do tamanho
});

test('máscara de telefone diferencia celular (11 dígitos) de fixo (10)', () => {
  assert.equal(mascaraTelefone('85987654321'), '(85) 98765-4321');
  assert.equal(mascaraTelefone('8532345678'), '(85) 3234-5678');
});

test('máscara de CEP', () => {
  assert.equal(mascaraCEP('60000000'), '60000-000');
});
