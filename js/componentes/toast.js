/**
 * Instituto Elo Animal – componentes/toast.js
 * Notificações temporárias no canto da tela. A área #area-toast tem
 * role="status": o leitor de tela anuncia o texto sem mover o foco.
 */

/** Mostra um aviso por alguns segundos (pausa com mouse ou foco em cima: WCAG 2.2.1). */
export function mostrarToast(texto, duracao = 6000) {
  const area = document.getElementById('area-toast');
  if (!area) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const paragrafo = document.createElement('p');
  paragrafo.className = 'toast__texto';
  paragrafo.textContent = texto;

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'toast__fechar';
  fechar.setAttribute('aria-label', 'Fechar notificação');
  fechar.textContent = '×';

  toast.append(paragrafo, fechar);
  area.append(toast);

  let temporizador;

  function remover() {
    clearTimeout(temporizador);
    toast.classList.add('toast--saindo');
    // animationend remove o aviso; o setTimeout garante a remoção se a animação não rodar
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }

  function agendar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(remover, duracao);
  }

  fechar.addEventListener('click', remover);
  toast.addEventListener('mouseenter', () => clearTimeout(temporizador));
  toast.addEventListener('mouseleave', agendar);
  toast.addEventListener('focusin', () => clearTimeout(temporizador));
  toast.addEventListener('focusout', agendar);
  agendar();
}
