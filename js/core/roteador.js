/**
 * Instituto Elo Animal – core/roteador.js
 * ------------------------------------------------------------
 * Roteador da SPA baseado no hash da URL (#/caminho?consulta).
 *
 * Por que hash? Mudar o que vem depois do "#" NÃO recarrega a página e
 * não faz pedido ao servidor. Assim a SPA funciona em qualquer servidor
 * estático (inclusive GitHub Pages), sem configurar redirecionamentos;
 * os botões Voltar/Avançar e os favoritos do navegador continuam valendo,
 * e os links são <a href="#/projetos"> comuns (abrem em nova aba, etc.).
 *
 * Fluxo de cada navegação:
 *  clique no link -> o hash muda -> evento "hashchange" -> renderizar():
 *   1. interpretarHash: separa caminho e parâmetros de consulta;
 *   2. encontrarRota: acha a rota (aceita parâmetros como /projetos/:id) ou a 404;
 *   3. desmonta a view anterior (AbortController remove todos os ouvintes dela);
 *   4. carrega em paralelo o HTML da view (fetch + cache) e o controlador (import());
 *   5. LIMPA o <main> e INJETA o novo fragmento (replaceChildren);
 *   6. chama montar() do controlador, que preenche os dados e liga os eventos;
 *   7. atualiza título da aba, link ativo do menu (aria-current) e foco.
 */
import { carregarView, criarFragmento } from './templates.js';
import { focarElemento, emitir } from '../utils/dom.js';

const NOME_DO_SITE = 'Instituto Elo Animal';
const TITULO_INICIAL = `${NOME_DO_SITE} | Cuidar dos animais é cuidar da comunidade`;

/** "#/projetos/castracao?busca=gato" -> { caminho: "/projetos/castracao", consulta } */
export function interpretarHash(hash) {
  const semCerquilha = String(hash || '').replace(/^#/, '');
  const [bruto = '', textoConsulta = ''] = semCerquilha.split('?');
  let caminho;
  try {
    caminho = decodeURIComponent(bruto);
  } catch {
    caminho = bruto; // "%" solto na URL não derruba o roteador
  }
  caminho = `/${caminho}`.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
  return { caminho, consulta: new URLSearchParams(textoConsulta) };
}

/** Compara o caminho com cada rota; ":nome" captura um parâmetro. */
export function encontrarRota(caminho, rotas) {
  const partes = caminho.split('/').filter(Boolean);
  for (const rota of rotas) {
    const partesDaRota = rota.caminho.split('/').filter(Boolean);
    if (partesDaRota.length !== partes.length) continue;
    const params = {};
    const combina = partesDaRota.every((parte, i) => {
      if (parte.startsWith(':')) {
        params[parte.slice(1)] = partes[i];
        return true;
      }
      return parte === partes[i];
    });
    if (combina) return { rota, params };
  }
  return null;
}

/** O link aponta para uma rota da SPA? (âncoras como "#conteudo" não são rotas) */
export const ehLinkDeRota = (href) => /^#\//.test(href || '');

function decodificar(texto) {
  try {
    return decodeURIComponent(texto);
  } catch {
    return texto;
  }
}

export function criarRoteador({ rotas, rotaNaoEncontrada, saida, preparar = null }) {
  let navegacaoAtual = 0;          // número da navegação mais recente
  let controleDaView = null;       // AbortController da view montada
  let desmontarView = null;        // função de limpeza devolvida pelo controlador
  let primeiraCarga = true;
  let ultimoHashDeRota = '#/';

  /** Remove ouvintes, temporizadores e gráficos da view que está saindo. */
  function desmontar() {
    controleDaView?.abort();
    controleDaView = null;
    try {
      desmontarView?.();
    } catch (erro) {
      console.error('[roteador] Erro ao desmontar a view:', erro);
    }
    desmontarView = null;
  }

  /** Marca no menu (e no rodapé) o link da seção atual. */
  function marcarLinksAtivos(caminho) {
    document.querySelectorAll('a[data-rota]').forEach((link) => {
      const rota = link.dataset.rota;
      const ativo = rota === '/' ? caminho === '/' : caminho === rota || caminho.startsWith(`${rota}/`);
      if (ativo) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /** Leva a pessoa ao início da nova tela (ou à seção pedida em ?secao=). */
  function posicionar(secao) {
    const alvo = secao ? saida.querySelector(`#${CSS.escape(secao)}`) : null;
    if (alvo) {
      focarElemento(alvo.querySelector('h2, h3') || alvo);
      return;
    }
    if (primeiraCarga) return; // ao abrir o site, o foco fica no começo do documento
    window.scrollTo(0, 0);
    // O foco vai para o título: o leitor de tela anuncia a nova página
    focarElemento(saida.querySelector('h1'), { rolar: false });
  }

  function mostrarErro(erro) {
    const secao = document.createElement('section');
    secao.className = 'container secao erro-rota';
    const titulo = document.createElement('h1');
    titulo.textContent = 'Não foi possível abrir esta página';
    const texto = document.createElement('p');
    texto.textContent = navigator.onLine === false
      ? 'Parece que você está sem conexão. Verifique a internet e tente de novo.'
      : 'Ocorreu um erro ao carregar o conteúdo. Tente de novo em instantes.';
    const detalhe = document.createElement('p');
    detalhe.className = 'texto-suave';
    detalhe.textContent = `Detalhe técnico: ${erro.message}`;
    const acoes = document.createElement('div');
    acoes.className = 'grupo-botoes';
    const tentar = document.createElement('button');
    tentar.type = 'button';
    tentar.className = 'botao';
    tentar.textContent = 'Tentar novamente';
    tentar.addEventListener('click', renderizar);
    const inicio = document.createElement('a');
    inicio.className = 'botao botao--contorno';
    inicio.href = '#/';
    inicio.textContent = 'Ir para o início';
    acoes.append(tentar, inicio);
    secao.append(titulo, texto, detalhe, acoes);
    saida.replaceChildren(secao);
    document.title = `Erro | ${NOME_DO_SITE}`;
    focarElemento(titulo, { rolar: false });
  }

  /** Função principal: troca o conteúdo do <main> pela view da rota atual. */
  async function renderizar() {
    const hash = location.hash || '#/';
    let secaoPedida = null;

    // Âncora interna (ex.: #conteudo ou um link antigo #quem-somos): não é rota
    if (!ehLinkDeRota(hash)) {
      const id = decodificar(hash.slice(1));
      history.replaceState(null, '', ultimoHashDeRota); // devolve a URL da rota atual
      if (!primeiraCarga) {
        focarElemento(document.getElementById(id));
        return;
      }
      secaoPedida = id; // primeira visita com #ancora: abre o início e rola até ela
    } else {
      ultimoHashDeRota = hash;
    }

    const numero = ++navegacaoAtual;
    const { caminho, consulta } = interpretarHash(ehLinkDeRota(hash) ? hash : '#/');
    const encontrada = encontrarRota(caminho, rotas);
    let rota = encontrada ? encontrada.rota : rotaNaoEncontrada;
    const params = encontrada ? encontrada.params : {};

    desmontar();
    saida.setAttribute('aria-busy', 'true');
    // O indicador "carregando" só aparece se a troca demorar (evita piscar)
    const aviso = setTimeout(() => saida.classList.add('conteudo--carregando'), 200);

    try {
      let [html, controlador] = await Promise.all([
        carregarView(rota.view),
        rota.controlador ? rota.controlador() : null,
        preparar?.(), // ex.: garantir que os moldes de componentes já chegaram
      ]);
      if (numero !== navegacaoAtual) return; // a pessoa já pediu outra página: descarta esta

      saida.replaceChildren(criarFragmento(html)); // limpa o contêiner e injeta a view
      controleDaView = new AbortController();
      const resultado = (await controlador?.montar?.({
        raiz: saida,
        params,
        consulta,
        sinal: controleDaView.signal,
      })) || {};
      if (numero !== navegacaoAtual) return;

      // O controlador pode avisar que o recurso não existe (ex.: projeto inválido)
      if (resultado.naoEncontrada) {
        desmontar();
        rota = rotaNaoEncontrada;
        html = await carregarView(rota.view);
        if (numero !== navegacaoAtual) return;
        saida.replaceChildren(criarFragmento(html));
      } else {
        desmontarView = resultado.desmontar || controlador?.desmontar || null;
      }

      const titulo = resultado.titulo || rota.titulo;
      document.title = caminho === '/' ? TITULO_INICIAL : `${titulo} | ${NOME_DO_SITE}`;
      marcarLinksAtivos(caminho);
      posicionar(secaoPedida || consulta.get('secao'));
      emitir('rota:alterada', { caminho, titulo });
    } catch (erro) {
      if (numero !== navegacaoAtual) return;
      console.error('[roteador]', erro);
      mostrarErro(erro);
    } finally {
      if (numero === navegacaoAtual) {
        clearTimeout(aviso);
        saida.classList.remove('conteudo--carregando');
        saida.removeAttribute('aria-busy');
        primeiraCarga = false;
      }
    }
  }

  /** Links "#id" (pular para o conteúdo, sumários): rolam sem mexer no histórico. */
  function tratarAncoras(evento) {
    if (evento.defaultPrevented) return; // outro módulo já cuidou deste clique
    const link = evento.target.closest('a[href^="#"]');
    if (!link || ehLinkDeRota(link.getAttribute('href'))) return;
    const alvo = document.getElementById(decodificar(link.getAttribute('href').slice(1)));
    if (!alvo) return;
    evento.preventDefault();
    focarElemento(alvo);
  }

  /** Ao apontar para um link de rota, já baixa o HTML da view (navegação mais rápida). */
  function preCarregar(evento) {
    const link = evento.target.closest?.('a[href^="#/"]');
    if (!link) return;
    const { caminho } = interpretarHash(link.getAttribute('href'));
    const encontrada = encontrarRota(caminho, rotas);
    if (encontrada) carregarView(encontrada.rota.view).catch(() => {});
  }

  return {
    iniciar() {
      window.addEventListener('hashchange', renderizar);
      document.addEventListener('click', tratarAncoras);
      document.addEventListener('pointerover', preCarregar);
      document.addEventListener('focusin', preCarregar);
      return renderizar();
    },
    renderizar,
  };
}
