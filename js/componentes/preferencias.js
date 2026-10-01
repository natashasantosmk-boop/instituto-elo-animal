/**
 * Instituto Elo Animal – componentes/preferencias.js
 * Preferências de exibição salvas no localStorage: tamanho do texto e
 * animações. Viram atributos no <html> (data-fonte, data-movimento) e o
 * CSS faz o resto. Um script curto no <head> do index.html aplica as
 * mesmas preferências antes da primeira pintura, para a tela não "piscar".
 */
import * as armazenamento from '../core/armazenamento.js';
import { emitir } from '../utils/dom.js';

const CHAVE = armazenamento.CHAVES.preferencias;

/** Valores aceitos (dado salvo fora do padrão é ignorado). */
export const OPCOES = {
  fonte: ['padrao', 'grande', 'maior'],
  movimento: ['padrao', 'reduzido'],
};

export function lerPreferencias() {
  const salvas = armazenamento.ler(CHAVE, {}) || {};
  const preferencias = {};
  for (const [nome, valores] of Object.entries(OPCOES)) {
    preferencias[nome] = valores.includes(salvas[nome]) ? salvas[nome] : valores[0];
  }
  return preferencias;
}

export function aplicarPreferencias(preferencias = lerPreferencias()) {
  const raiz = document.documentElement;
  for (const [nome, valor] of Object.entries(preferencias)) {
    if (valor === 'padrao') delete raiz.dataset[nome];
    else raiz.dataset[nome] = valor;
  }
}

export function salvarPreferencia(nome, valor) {
  if (!OPCOES[nome]?.includes(valor)) return false;
  const preferencias = { ...lerPreferencias(), [nome]: valor };
  const salvou = armazenamento.salvar(CHAVE, preferencias);
  aplicarPreferencias(preferencias);
  emitir('preferencias:alteradas', preferencias);
  return salvou;
}

export function iniciarPreferencias() {
  aplicarPreferencias();
  // Mudou em outra aba aberta do site: aplica aqui também
  armazenamento.aoAlterarEmOutraAba(CHAVE, () => {
    aplicarPreferencias();
    emitir('preferencias:alteradas', lerPreferencias());
  });
}
