/**
 * Instituto Elo Animal – componentes/favoritos.js
 * Projetos favoritos guardados no localStorage. Os botões
 * [data-favoritar="id"] podem estar em qualquer view: um único ouvinte
 * de clique no document (delegação) atende a todos.
 */
import * as armazenamento from '../core/armazenamento.js';
import { projetos } from '../dados/conteudo.js';
import { mostrarToast } from './toast.js';
import { emitir } from '../utils/dom.js';

const CHAVE = armazenamento.CHAVES.favoritos;

/** Ids favoritados que ainda existem nos dados (descarta ids antigos). */
export function listarFavoritos() {
  const salvos = armazenamento.ler(CHAVE, []);
  return Array.isArray(salvos) ? salvos.filter((id) => projetos.some((projeto) => projeto.id === id)) : [];
}

export const ehFavorito = (id) => listarFavoritos().includes(id);

/** Liga/desliga o favorito e devolve o novo estado. */
export function alternarFavorito(id) {
  const lista = new Set(listarFavoritos());
  if (lista.has(id)) lista.delete(id);
  else lista.add(id);
  armazenamento.salvar(CHAVE, [...lista]);
  emitir('favoritos:alterados', { total: lista.size });
  return lista.has(id);
}

/** Sincroniza o estado visual (aria-pressed) de todos os botões da tela. */
export function atualizarBotoesFavorito(raiz = document) {
  const favoritos = listarFavoritos();
  raiz.querySelectorAll('[data-favoritar]').forEach((botao) => {
    botao.setAttribute('aria-pressed', String(favoritos.includes(botao.dataset.favoritar)));
  });
}

/** Número de favoritos ao lado do link "Minha área" no menu. */
function atualizarContador() {
  const total = listarFavoritos().length;
  document.querySelectorAll('[data-contador-favoritos]').forEach((contador) => {
    contador.hidden = total === 0;
    contador.querySelector('[data-numero]').textContent = total;
    contador.querySelector('[data-rotulo]').textContent = total === 1 ? ' favorito' : ' favoritos';
  });
}

export function iniciarFavoritos() {
  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-favoritar]');
    if (!botao) return;
    const projeto = projetos.find((item) => item.id === botao.dataset.favoritar);
    const ativo = alternarFavorito(botao.dataset.favoritar);
    mostrarToast(ativo
      ? `${projeto.titulo} foi adicionado aos favoritos.`
      : `${projeto.titulo} foi removido dos favoritos.`);
  });

  // Mudou aqui ou em outra aba: atualiza botões e contador
  document.addEventListener('favoritos:alterados', () => {
    atualizarBotoesFavorito();
    atualizarContador();
  });
  armazenamento.aoAlterarEmOutraAba(CHAVE, () => emitir('favoritos:alterados'));

  // Cada view nova chega com botões "desligados": acerta o estado após montar
  document.addEventListener('rota:alterada', () => atualizarBotoesFavorito());
  atualizarContador();
}
