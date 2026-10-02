/**
 * Instituto Elo Animal – utils/dom.js
 * Atalhos pequenos para o DOM, usados por todos os módulos.
 */

/** Primeiro elemento que combina com o seletor (dentro de raiz). */
export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

/** Todos os elementos que combinam com o seletor, já como array. */
export const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

/**
 * Atrasa a execução até a pessoa parar de digitar (ex.: busca e rascunho).
 * Cada chamada nova reinicia o relógio; só a última roda.
 */
export function debounce(funcao, espera = 300) {
  let temporizador;
  const atrasada = (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcao(...args), espera);
  };
  atrasada.cancelar = () => clearTimeout(temporizador);
  return atrasada;
}

/** true quando a pessoa pediu menos movimento no sistema ou nas preferências do site. */
export function prefereMenosMovimento() {
  return document.documentElement.dataset.movimento === 'reduzido'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Leva o foco a um elemento que normalmente não recebe foco (título, alerta)
 * e rola a tela até ele, de forma suave quando permitido.
 */
export function focarElemento(elemento, { rolar = true } = {}) {
  if (!elemento) return;
  if (!elemento.hasAttribute('tabindex')) elemento.setAttribute('tabindex', '-1');
  elemento.focus({ preventScroll: true });
  if (rolar) {
    elemento.scrollIntoView({ behavior: prefereMenosMovimento() ? 'auto' : 'smooth', block: 'start' });
  }
}

/** Dispara um evento personalizado no document (comunicação entre módulos). */
export function emitir(nome, detalhe = {}) {
  document.dispatchEvent(new CustomEvent(nome, { detail: detalhe }));
}
