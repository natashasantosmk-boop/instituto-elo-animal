/**
 * Instituto Elo Animal – core/templates.js
 * ------------------------------------------------------------
 * Sistema de templates dinâmicos.
 *
 * 1) VIEWS: cada tela da SPA é um fragmento HTML em html/views/*.html,
 *    buscado com fetch na primeira visita e guardado em cache (Map).
 *
 * 2) COMPONENTES: html/componentes.html reúne elementos <template>
 *    (cartão de projeto, de campanha, pergunta, inscrição...). O HTML
 *    fica no HTML; o JavaScript só clona o molde e o preenche com dados
 *    usando atributos data-*:
 *      data-campo="titulo"            -> textContent = dados.titulo
 *      data-atributo="src:imagem;alt:alt" -> setAttribute para cada par
 *      data-classes="variante"        -> classList.add(dados.variante)
 *      data-se="campo" / data-se-nao="campo" -> remove o elemento conforme o valor
 *      data-lista="objetivos" data-item="tpl-item-texto" -> repete o molde para cada item
 *    O valor "." representa o próprio item (listas de textos simples).
 *
 * Como tudo é inserido com textContent e setAttribute (nunca innerHTML
 * com dados), um texto com "<script>" aparece como texto: sem risco de XSS.
 */

const cacheViews = new Map();
let moldes = new Map();

/** Busca o HTML de uma view (com cache). Falhas não ficam no cache: dá para tentar de novo. */
export function carregarView(nome) {
  if (!cacheViews.has(nome)) {
    const promessa = fetch(`html/views/${nome}.html`).then((resposta) => {
      if (!resposta.ok) throw new Error(`Não foi possível carregar a view "${nome}" (HTTP ${resposta.status}).`);
      return resposta.text();
    });
    cacheViews.set(nome, promessa);
    promessa.catch(() => cacheViews.delete(nome));
  }
  return cacheViews.get(nome);
}

/** Lê html/componentes.html e guarda cada <template id="..."> em um Map. */
export async function carregarComponentes(url = 'html/componentes.html') {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Não foi possível carregar os componentes (HTTP ${resposta.status}).`);
  const documento = new DOMParser().parseFromString(await resposta.text(), 'text/html');
  moldes = new Map(Array.from(documento.querySelectorAll('template[id]'), (molde) => [molde.id, molde]));
  return moldes;
}

let carregamentoDosMoldes = null;

/** Carrega os componentes uma única vez; se falhar, a próxima chamada tenta de novo. */
export function garantirComponentes() {
  if (!carregamentoDosMoldes) {
    carregamentoDosMoldes = carregarComponentes();
    carregamentoDosMoldes.catch(() => { carregamentoDosMoldes = null; });
  }
  return carregamentoDosMoldes;
}

/** Converte um texto HTML (de uma view) em fragmento pronto para inserir no DOM. */
export function criarFragmento(html) {
  const molde = document.createElement('template');
  molde.innerHTML = html; // HTML dos nossos próprios arquivos, nunca dado digitado
  return molde.content;
}

/** Lê "a.b.c" dentro do objeto; "." devolve o próprio objeto. */
export function valorDe(dados, caminho) {
  if (caminho === '.') return dados;
  return caminho.split('.').reduce((objeto, chave) => (objeto == null ? undefined : objeto[chave]), dados);
}

const vazio = (valor) => valor === undefined || valor === null || valor === false || valor === ''
  || (Array.isArray(valor) && valor.length === 0);

/**
 * Preenche os atributos data-* de uma raiz (fragmento ou elemento) com os dados.
 * Os elementos são coletados ANTES de inserir os itens das listas, para que
 * o conteúdo de cada item não seja sobrescrito com os dados do pai.
 */
export function preencher(raiz, dados = {}) {
  const seletor = '[data-campo], [data-atributo], [data-classes], [data-se], [data-se-nao], [data-lista]';
  const elementos = Array.from(raiz.querySelectorAll(seletor));
  if (raiz instanceof Element && raiz.matches(seletor)) elementos.unshift(raiz);

  for (const elemento of elementos) {
    const { se, seNao, campo, atributo, classes, lista, item } = elemento.dataset;

    if (se !== undefined && vazio(valorDe(dados, se))) { elemento.remove(); continue; }
    if (seNao !== undefined && !vazio(valorDe(dados, seNao))) { elemento.remove(); continue; }

    if (campo !== undefined) {
      const valor = valorDe(dados, campo);
      elemento.textContent = valor ?? '';
    }

    if (atributo !== undefined) {
      atributo.split(';').filter(Boolean).forEach((par) => {
        const [nome, chave] = par.split(':').map((parte) => parte.trim());
        const valor = valorDe(dados, chave);
        if (valor === undefined || valor === null || valor === false) {
          elemento.removeAttribute(nome);
        } else {
          elemento.setAttribute(nome, valor === true ? '' : String(valor));
        }
      });
    }

    if (classes !== undefined) {
      const valor = valorDe(dados, classes);
      if (valor) elemento.classList.add(...String(valor).split(' ').filter(Boolean));
    }

    if (lista !== undefined) {
      const itens = valorDe(dados, lista) || [];
      elemento.replaceChildren(...itens.map((dadosDoItem) => renderizar(item, dadosDoItem)));
    }
  }
  return raiz;
}

/** Clona um <template> de componentes.html e o preenche com os dados. */
export function renderizar(idDoMolde, dados = {}) {
  const molde = moldes.get(idDoMolde);
  if (!molde) throw new Error(`Template "${idDoMolde}" não encontrado em html/componentes.html.`);
  const fragmento = document.importNode(molde.content, true);
  return preencher(fragmento, dados);
}

/** Limpa o contêiner e coloca um componente para cada item da lista. */
export function renderizarLista(conteiner, idDoMolde, itens) {
  conteiner.replaceChildren(...itens.map((dados) => renderizar(idDoMolde, dados)));
  return conteiner;
}
