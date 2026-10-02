/**
 * Instituto Elo Animal – componentes/modal.js
 * Janelas modais com o elemento <dialog>. Como as views são trocadas a
 * todo momento, os cliques são tratados por DELEGAÇÃO no document: um
 * único ouvinte atende aos botões de qualquer view, inclusive os que
 * ainda nem foram renderizados.
 */

let focoAnterior = null;

/** Abre a modal com showModal(): o navegador prende o foco dentro dela e o Esc fecha. */
export function abrirModal(modal) {
  if (!modal || typeof modal.showModal !== 'function' || modal.open) return false;
  focoAnterior = document.activeElement;
  modal.returnValue = '';
  modal.showModal();
  document.documentElement.classList.add('modal-aberto');
  return true;
}

/**
 * Pergunta de confirmação reutilizável (modal #modal-confirmar do index.html).
 * Uso: if (await confirmar({ titulo, texto, rotuloConfirmar })) { ... }
 */
export function confirmar({ titulo, texto, rotuloConfirmar = 'Confirmar', rotuloCancelar = 'Cancelar' }) {
  const modal = document.getElementById('modal-confirmar');
  if (!modal) return Promise.resolve(window.confirm(texto)); // alternativa nativa
  modal.querySelector('[data-confirmar-titulo]').textContent = titulo;
  modal.querySelector('[data-confirmar-texto]').textContent = texto;
  modal.querySelector('[data-confirmar-ok]').textContent = rotuloConfirmar;
  modal.querySelector('[data-confirmar-cancelar]').textContent = rotuloCancelar;

  return new Promise((resolver) => {
    modal.addEventListener('close', () => resolver(modal.returnValue === 'confirmar'), { once: true });
    if (!abrirModal(modal)) resolver(false);
  });
}

export function iniciarModais() {
  document.addEventListener('click', (evento) => {
    const abrir = evento.target.closest('[data-abrir-modal]');
    if (abrir) {
      abrirModal(document.getElementById(abrir.dataset.abrirModal));
      return;
    }
    const fechar = evento.target.closest('[data-fechar-modal]');
    if (fechar) {
      fechar.closest('dialog')?.close();
      return;
    }
    // Clique no fundo escurecido (fora da caixa) fecha a modal
    if (evento.target instanceof HTMLDialogElement && evento.target.classList.contains('modal')) {
      evento.target.close();
    }
  });

  // "close" não borbulha: o ouvinte na fase de captura recebe o evento de qualquer modal
  document.addEventListener('close', (evento) => {
    if (!(evento.target instanceof HTMLDialogElement)) return;
    document.documentElement.classList.remove('modal-aberto');
    if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
    focoAnterior = null;
  }, true);
}
