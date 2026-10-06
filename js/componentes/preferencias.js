/**
 * Instituto Elo Animal – componentes/preferencias.js
 * Preferências de exibição salvas no localStorage: tema (automático,
 * claro ou escuro), tamanho do texto e animações. Viram atributos no
 * <html> (data-tema, data-fonte, data-movimento) e o CSS faz o resto.
 * O primeiro valor de cada lista é o padrão (sem atributo no <html>):
 * no tema "automatico" vale o modo do sistema (prefers-color-scheme). Um script curto no <head> do index.html aplica as
 * mesmas preferências antes da primeira pintura, para a tela não "piscar".
 */
import * as armazenamento from '../core/armazenamento.js';
import { emitir } from '../utils/dom.js';

const CHAVE = armazenamento.CHAVES.preferencias;

/** Valores aceitos (dado salvo fora do padrão é ignorado). */
export const OPCOES = {
  tema: ['automatico', 'claro', 'escuro'],
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
    if (valor === OPCOES[nome][0]) delete raiz.dataset[nome];
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

/** Tema que está valendo agora: o escolhido ou, no automático, o do sistema. */
export function temaEfetivo() {
  const tema = document.documentElement.dataset.tema;
  if (tema === 'claro' || tema === 'escuro') return tema;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function iniciarPreferencias() {
  aplicarPreferencias();
  // No tema automático, o sistema pode mudar de claro para escuro com o site aberto
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    emitir('preferencias:alteradas', lerPreferencias());
  });
  // Mudou em outra aba aberta do site: aplica aqui também
  armazenamento.aoAlterarEmOutraAba(CHAVE, () => {
    aplicarPreferencias();
    emitir('preferencias:alteradas', lerPreferencias());
  });
}
