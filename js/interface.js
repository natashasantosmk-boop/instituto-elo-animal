/*
 * Instituto Elo Animal – interface.js
 * ------------------------------------------------------------
 * Comportamentos compartilhados pelas três páginas:
 *  1. Menu hambúrguer (celular) e submenu "Projetos" (dropdown);
 *  2. Notificações toast;
 *  3. Janelas modais com o elemento dialog;
 *  4. Botões que copiam um texto (chave Pix).
 *
 * O CSS cuida da aparência e das animações; o JavaScript só troca
 * atributos de estado (aria-expanded) e chama as APIs nativas.
 */
'use strict';

(function () {
  // ---------- 1. Menu principal e submenu ----------

  const botaoMenu = document.querySelector('.menu__botao');
  const botoesSubmenu = document.querySelectorAll('.submenu__botao');
  const telaLarga = window.matchMedia('(min-width: 48rem)');

  function estaAberto(botao) {
    return botao.getAttribute('aria-expanded') === 'true';
  }

  function alternar(botao, abrir) {
    if (botao) botao.setAttribute('aria-expanded', String(abrir));
  }

  function fecharSubmenus(exceto) {
    botoesSubmenu.forEach((botao) => {
      if (botao !== exceto) alternar(botao, false);
    });
  }

  function fecharTudo() {
    alternar(botaoMenu, false);
    fecharSubmenus();
  }

  if (botaoMenu) {
    botaoMenu.addEventListener('click', () => {
      const abrir = !estaAberto(botaoMenu);
      alternar(botaoMenu, abrir);
      if (!abrir) fecharSubmenus();
    });

    // Escolher um link (inclusive uma âncora da mesma página) fecha o painel
    const lista = document.getElementById(botaoMenu.getAttribute('aria-controls'));
    if (lista) {
      lista.addEventListener('click', (evento) => {
        if (evento.target.closest('a')) fecharTudo();
      });
    }
  }

  botoesSubmenu.forEach((botao) => {
    botao.addEventListener('click', () => {
      const abrir = !estaAberto(botao);
      fecharSubmenus(botao);
      alternar(botao, abrir);
    });

    // Quando o foco sai do item (Tab), o submenu fecha sozinho
    const item = botao.closest('.menu__item');
    item.addEventListener('focusout', (evento) => {
      if (!item.contains(evento.relatedTarget)) alternar(botao, false);
    });
  });

  // Esc fecha primeiro o submenu, depois o menu, e devolve o foco ao botão
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const submenuAberto = document.querySelector('.submenu__botao[aria-expanded="true"]');
    if (submenuAberto) {
      alternar(submenuAberto, false);
      submenuAberto.focus();
    } else if (botaoMenu && estaAberto(botaoMenu)) {
      alternar(botaoMenu, false);
      botaoMenu.focus();
    }
  });

  // Clique fora do menu fecha tudo
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.menu')) fecharTudo();
  });

  // Ao passar do celular para o desktop (ou o contrário), o menu volta ao estado inicial
  telaLarga.addEventListener('change', fecharTudo);

  // ---------- 2. Notificações toast ----------

  const areaToast = document.getElementById('area-toast');

  /**
   * Mostra um aviso temporário no canto da tela.
   * A área tem role="status": o leitor de tela anuncia o texto sem tirar o foco.
   */
  function mostrarToast(texto, duracao = 6000) {
    if (!areaToast) return;

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
    areaToast.append(toast);

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
    // Pausa enquanto o mouse ou o foco estiverem no aviso (WCAG 2.2.1: tempo ajustável)
    toast.addEventListener('mouseenter', () => clearTimeout(temporizador));
    toast.addEventListener('mouseleave', agendar);
    toast.addEventListener('focusin', () => clearTimeout(temporizador));
    toast.addEventListener('focusout', agendar);
    agendar();
  }

  // ---------- 3. Janelas modais (elemento dialog) ----------

  let focoAnterior = null;

  /** Abre a modal com showModal(): o navegador prende o foco dentro dela e o Esc fecha. */
  function abrirModal(modal) {
    if (!modal || typeof modal.showModal !== 'function') return false;
    focoAnterior = document.activeElement;
    modal.returnValue = '';
    modal.showModal();
    document.documentElement.classList.add('modal-aberto');
    return true;
  }

  document.querySelectorAll('dialog.modal').forEach((modal) => {
    modal.addEventListener('close', () => {
      document.documentElement.classList.remove('modal-aberto');
      // Devolve o foco para o botão que abriu a modal
      if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
    });

    // Clique no fundo escurecido (fora da caixa) fecha a modal
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) modal.close();
    });

    modal.querySelectorAll('[data-fechar-modal]').forEach((botao) => {
      botao.addEventListener('click', () => modal.close());
    });
  });

  document.querySelectorAll('[data-abrir-modal]').forEach((botao) => {
    botao.addEventListener('click', () => {
      abrirModal(document.getElementById(botao.dataset.abrirModal));
    });
  });

  // ---------- 4. Copiar texto (chave Pix) ----------

  document.querySelectorAll('[data-copiar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const texto = botao.dataset.copiar;
      try {
        await navigator.clipboard.writeText(texto);
        mostrarToast(`Chave Pix copiada: ${texto}`);
      } catch (erro) {
        mostrarToast(`Não foi possível copiar. Anote a chave Pix: ${texto}`);
      }
    });
  });

  // Funções usadas também pelo cadastro.js
  window.EloAnimal = { mostrarToast, abrirModal };
})();
