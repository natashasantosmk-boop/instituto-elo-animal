/**
 * Instituto Elo Animal – main.js (ponto de entrada da SPA)
 * ------------------------------------------------------------
 * Carregado com <script type="module">: cada arquivo importa só o que
 * usa, nada vai para o escopo global e o código roda em modo estrito.
 * Aqui ficam o MAPA DE ROTAS e a inicialização dos componentes globais.
 * Os controladores das páginas são importados sob demanda (import()),
 * na primeira vez em que a rota é aberta.
 */
import { criarRoteador } from './core/roteador.js';
import { garantirComponentes } from './core/templates.js';
import { iniciarMenu } from './componentes/menu.js';
import { iniciarModais } from './componentes/modal.js';
import { iniciarFavoritos } from './componentes/favoritos.js';
import { iniciarPreferencias } from './componentes/preferencias.js';
import { mostrarToast } from './componentes/toast.js';

/** Mapa da aplicação: caminho -> view (html/views) + controlador (js/paginas). */
const rotas = [
  { caminho: '/', view: 'inicio', titulo: 'Início', controlador: () => import('./paginas/inicio.js') },
  { caminho: '/projetos', view: 'projetos', titulo: 'Projetos sociais', controlador: () => import('./paginas/projetos.js') },
  { caminho: '/projetos/:id', view: 'projeto', titulo: 'Projeto', controlador: () => import('./paginas/projeto.js') },
  { caminho: '/doacoes', view: 'doacoes', titulo: 'Doações', controlador: () => import('./paginas/doacoes.js') },
  { caminho: '/transparencia', view: 'transparencia', titulo: 'Transparência', controlador: () => import('./paginas/transparencia.js') },
  { caminho: '/cadastro', view: 'cadastro', titulo: 'Cadastre-se', controlador: () => import('./paginas/cadastro.js') },
  { caminho: '/minha-area', view: 'minha-area', titulo: 'Minha área', controlador: () => import('./paginas/minha-area.js') },
  { caminho: '/acessibilidade', view: 'acessibilidade', titulo: 'Acessibilidade' }, // conteúdo estático, sem controlador
];

const rotaNaoEncontrada = { view: 'nao-encontrada', titulo: 'Página não encontrada' };

/** Ações globais por delegação: funcionam em qualquer view, mesmo as que ainda vão ser montadas. */
function iniciarAcoesGlobais() {
  document.addEventListener('click', async (evento) => {
    const botaoCopiar = evento.target.closest('[data-copiar]');
    if (!botaoCopiar) return;
    const texto = botaoCopiar.dataset.copiar;
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast(`Chave Pix copiada: ${texto}`);
    } catch {
      mostrarToast(`Não foi possível copiar. Anote a chave Pix: ${texto}`);
    }
  });
}

function iniciar() {
  iniciarPreferencias();
  iniciarMenu();
  iniciarModais();
  iniciarFavoritos();
  iniciarAcoesGlobais();

  criarRoteador({
    rotas,
    rotaNaoEncontrada,
    saida: document.getElementById('conteudo'),
    preparar: garantirComponentes, // moldes dos cartões, listas e itens (html/componentes.html)
  }).iniciar();
}

iniciar();
