/**
 * Instituto Elo Animal – componentes/menu.js
 * Menu principal: botão hambúrguer (telas menores que 992 px), submenu
 * "Projetos" gerado a partir dos dados e fechamento automático quando
 * a rota muda. O CSS cuida da aparência; o JS só troca aria-expanded.
 */
import { projetos } from '../dados/conteudo.js';

const LARGURA_DESKTOP = '(min-width: 62rem)';

export function iniciarMenu() {
  const botaoMenu = document.querySelector('.menu__botao');
  const submenu = document.getElementById('submenu-projetos');

  // Submenu montado com os dados: um projeto novo aparece aqui sem editar o HTML
  if (submenu) {
    submenu.replaceChildren(...projetos.map((projeto) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#/projetos/${projeto.id}`;
      link.textContent = projeto.titulo;
      item.append(link);
      return item;
    }));
  }

  const botoesSubmenu = Array.from(document.querySelectorAll('.submenu__botao'));
  const estaAberto = (botao) => botao?.getAttribute('aria-expanded') === 'true';
  const alternar = (botao, abrir) => botao?.setAttribute('aria-expanded', String(abrir));
  const fecharSubmenus = (exceto) => botoesSubmenu.forEach((botao) => botao !== exceto && alternar(botao, false));
  const fecharTudo = () => {
    alternar(botaoMenu, false);
    fecharSubmenus();
  };

  botaoMenu?.addEventListener('click', () => {
    const abrir = !estaAberto(botaoMenu);
    alternar(botaoMenu, abrir);
    if (!abrir) fecharSubmenus();
  });

  // Escolher um link (mesmo o da página atual, que não muda o hash) fecha o painel
  document.getElementById('menu-lista')?.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) fecharTudo();
  });

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
    const submenuAberto = botoesSubmenu.find(estaAberto);
    if (submenuAberto) {
      alternar(submenuAberto, false);
      submenuAberto.focus();
    } else if (estaAberto(botaoMenu)) {
      alternar(botaoMenu, false);
      botaoMenu.focus();
    }
  });

  // Clique fora do menu fecha tudo; trocar de página (rota) também
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.menu')) fecharTudo();
  });
  document.addEventListener('rota:alterada', fecharTudo);

  // Ao passar do celular para o desktop (ou o contrário), o menu volta ao estado inicial
  window.matchMedia(LARGURA_DESKTOP).addEventListener('change', fecharTudo);
}
