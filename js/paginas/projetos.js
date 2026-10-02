/**
 * Instituto Elo Animal – paginas/projetos.js
 * Lista filtrável de projetos. Eventos usados:
 *  - input (busca, com debounce de 250 ms: filtra enquanto a pessoa digita);
 *  - change (categoria, ordem e "só favoritos": filtra na hora);
 *  - submit (Enter na busca não recarrega a página);
 *  - click delegado ("Limpar filtros") e o evento próprio "favoritos:alterados".
 * O estado dos filtros vai para a URL (dá para compartilhar o link) e para o
 * sessionStorage (ao voltar para a página na mesma visita, os filtros continuam).
 */
import { projetos, categorias } from '../dados/conteudo.js';
import { renderizarLista } from '../core/templates.js';
import { sessao, CHAVES } from '../core/armazenamento.js';
import { modeloCartaoProjeto } from '../componentes/cartoes.js';
import { atualizarBotoesFavorito, listarFavoritos } from '../componentes/favoritos.js';
import { formatarNumero, normalizarTexto, pluralizar } from '../utils/formatacao.js';
import { $, debounce, focarElemento } from '../utils/dom.js';

const CHAVE_SESSAO = CHAVES.filtrosProjetos;
const PADRAO = { busca: '', categoria: '', ordem: 'titulo', favoritos: false };
const ORDENS = {
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
  voluntarios: (a, b) => b.voluntarios - a.voluntarios,
  bairros: (a, b) => b.bairros - a.bairros,
};

/** Texto pesquisável de cada projeto (sem acentos e em minúsculas). */
const indice = new Map(projetos.map((projeto) => [projeto.id, normalizarTexto([
  projeto.titulo, projeto.resumo, projeto.descricao, projeto.publico,
  categorias[projeto.categoria], ...projeto.etiquetas.map((etiqueta) => etiqueta.texto), ...projeto.objetivos,
].join(' '))]));

/** Aplica busca (todas as palavras precisam aparecer), categoria, favoritos e ordem. */
export function filtrarProjetos(lista, { busca, categoria, ordem, favoritos }, idsFavoritos = []) {
  const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  return lista
    .filter((projeto) => !categoria || projeto.categoria === categoria)
    .filter((projeto) => !favoritos || idsFavoritos.includes(projeto.id))
    .filter((projeto) => palavras.every((palavra) => indice.get(projeto.id).includes(palavra)))
    .sort(ORDENS[ordem] || ORDENS.titulo);
}

/** Estado inicial: URL (link compartilhado) > sessão (volta à página) > padrão. */
function estadoInicial(consulta) {
  if ([...consulta.keys()].some((chave) => chave in PADRAO)) {
    return {
      busca: consulta.get('busca') || '',
      categoria: categorias[consulta.get('categoria')] ? consulta.get('categoria') : '',
      ordem: ORDENS[consulta.get('ordem')] ? consulta.get('ordem') : 'titulo',
      favoritos: consulta.get('favoritos') === 'sim',
    };
  }
  return { ...PADRAO, ...sessao.ler(CHAVE_SESSAO, {}) };
}

/** Atualiza a URL sem disparar "hashchange" (replaceState não recarrega a view). */
function refletirNaURL(estado) {
  const consulta = new URLSearchParams();
  if (estado.busca) consulta.set('busca', estado.busca);
  if (estado.categoria) consulta.set('categoria', estado.categoria);
  if (estado.ordem !== 'titulo') consulta.set('ordem', estado.ordem);
  if (estado.favoritos) consulta.set('favoritos', 'sim');
  const texto = consulta.toString();
  history.replaceState(null, '', `#/projetos${texto ? `?${texto}` : ''}`);
}

export function montar({ raiz, consulta, sinal }) {
  const formulario = $('[data-filtros]', raiz);
  const lista = $('[data-lista-projetos]', raiz);
  const resultado = $('[data-resultado]', raiz);
  const vazio = $('[data-vazio]', raiz);
  let estado = estadoInicial(consulta);

  // Coloca o estado nos campos do formulário
  function preencherFormulario() {
    formulario.elements.busca.value = estado.busca;
    formulario.elements.ordem.value = estado.ordem;
    formulario.elements.favoritos.checked = estado.favoritos;
    const radio = formulario.querySelector(`input[name="categoria"][value="${estado.categoria}"]`);
    if (radio) radio.checked = true;
  }

  function lerFormulario() {
    return {
      busca: formulario.elements.busca.value.trim(),
      categoria: formulario.elements.categoria.value,
      ordem: formulario.elements.ordem.value,
      favoritos: formulario.elements.favoritos.checked,
    };
  }

  function atualizar() {
    const encontrados = filtrarProjetos(projetos, estado, listarFavoritos());
    renderizarLista(lista, 'tpl-cartao-projeto', encontrados.map(modeloCartaoProjeto));
    atualizarBotoesFavorito(lista);
    vazio.hidden = encontrados.length > 0;
    resultado.textContent = encontrados.length
      ? `${pluralizar(encontrados.length, 'projeto encontrado', 'projetos encontrados')} de ${projetos.length}.`
      : 'Nenhum projeto encontrado.';
    sessao.salvar(CHAVE_SESSAO, estado);
    refletirNaURL(estado);
  }

  const aoMudar = () => {
    estado = lerFormulario();
    atualizar();
  };
  const aoDigitar = debounce(aoMudar, 250);

  formulario.addEventListener('input', (evento) => {
    if (evento.target.name === 'busca') aoDigitar();
  }, { signal: sinal });
  formulario.addEventListener('change', (evento) => {
    if (evento.target.name !== 'busca') aoMudar();
  }, { signal: sinal });
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault(); // Enter na busca: aplica na hora, sem recarregar
    aoDigitar.cancelar();
    aoMudar();
  }, { signal: sinal });

  raiz.addEventListener('click', (evento) => {
    if (!evento.target.closest('[data-limpar-filtros]')) return;
    estado = { ...PADRAO };
    preencherFormulario();
    atualizar();
    formulario.elements.busca.focus();
  }, { signal: sinal });

  // Com "só favoritos" marcado, desfavoritar um cartão o tira da lista na hora;
  // o foco (que estava no botão removido) vai para o título da lista
  document.addEventListener('favoritos:alterados', () => {
    if (!estado.favoritos) return;
    const focoNaLista = lista.contains(document.activeElement);
    atualizar();
    if (focoNaLista) focarElemento($('#titulo-lista', raiz), { rolar: false });
  }, { signal: sinal });
  sinal.addEventListener('abort', () => aoDigitar.cancelar());

  preencherFormulario();
  atualizar();

  // Tabela de resultados gerada com o template de linha
  renderizarLista($('[data-tabela-resultados]', raiz), 'tpl-linha-resultado', projetos.map((projeto) => ({
    ...projeto,
    link: `#/projetos/${projeto.id}`,
    voluntarios: formatarNumero(projeto.voluntarios),
    bairros: formatarNumero(projeto.bairros),
  })));
}
