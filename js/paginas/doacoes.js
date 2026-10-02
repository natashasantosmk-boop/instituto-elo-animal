/**
 * Instituto Elo Animal – paginas/doacoes.js
 * Campanhas geradas a partir dos dados (situação calculada pela data),
 * alerta da campanha com prazo mais próximo e simulador de doação
 * (eventos input nos dois campos, sincronizados entre si).
 */
import { campanhas, custos } from '../dados/conteudo.js';
import { renderizarLista } from '../core/templates.js';
import { modeloCartaoCampanha } from '../componentes/cartoes.js';
import {
  formatarData, formatarMoeda, formatarNumero, formatarQuantidade, pluralizar,
} from '../utils/formatacao.js';
import { $, debounce } from '../utils/dom.js';

const DIAS_PARA_ALERTA = 90;
const VALOR_MINIMO = 10;

/** O que um valor consegue pagar: quantidade de cada item ou quanto falta para 1. */
export function calcularImpacto(valor) {
  return custos.map((custo) => {
    const quantidade = Math.floor(valor / custo.valor);
    if (quantidade >= 1) {
      return { quantidade: formatarNumero(quantidade), descricao: quantidade === 1 ? custo.singular : custo.plural };
    }
    return { quantidade: `+ ${formatarMoeda(custo.valor - valor)}`, descricao: `para 1 ${custo.singular}` };
  });
}

function mostrarAlertaDePrazo(raiz, modelos) {
  const proxima = modelos
    .filter((campanha) => campanha.aberta && campanha.dias <= DIAS_PARA_ALERTA)
    .sort((a, b) => a.dias - b.dias)[0];
  const alerta = $('[data-alerta-prazo]', raiz);
  if (!proxima) return;
  const falta = formatarQuantidade(proxima.meta - proxima.arrecadado, proxima.unidade);
  $('[data-alerta-titulo]', raiz).textContent = proxima.dias <= 30 ? 'Últimos dias!' : 'Prazo se aproximando';
  $('[data-alerta-texto]', raiz).textContent = `A campanha ${proxima.titulo} termina em ${formatarData(proxima.prazo)} `
    + `(${pluralizar(proxima.dias, 'dia', 'dias')}). Ainda faltam ${falta} para a meta.`;
  alerta.hidden = false;
}

function iniciarSimulador(raiz, sinal) {
  const formulario = $('[data-simulador]', raiz);
  const { faixa, valor } = formulario.elements;
  const titulo = $('[data-resultado-titulo]', raiz);
  const lista = $('[data-resultado-lista]', raiz);
  const escolhido = $('[data-valor-escolhido]', raiz);
  const anuncio = $('[data-anuncio-simulador]', raiz);
  const linkDoar = $('[data-link-doar]', raiz);

  // Para o leitor de tela: anuncia o resumo só depois que a pessoa para de ajustar
  const anunciar = debounce((texto) => { anuncio.textContent = texto; }, 600);
  sinal.addEventListener('abort', () => anunciar.cancelar());

  function atualizar(quantia) {
    if (!Number.isFinite(quantia) || quantia < VALOR_MINIMO) {
      titulo.textContent = `Digite um valor a partir de ${formatarMoeda(VALOR_MINIMO)}.`;
      lista.replaceChildren();
      escolhido.textContent = '';
      linkDoar.hidden = true;
      anunciar(titulo.textContent);
      return;
    }
    const valorFormatado = formatarMoeda(quantia);
    const itens = calcularImpacto(quantia);
    escolhido.textContent = `Valor escolhido: ${valorFormatado}`;
    faixa.setAttribute('aria-valuetext', valorFormatado); // lê "R$ 60" em vez de "60"
    titulo.textContent = `Com ${valorFormatado} você custeia, por exemplo:`;
    renderizarLista(lista, 'tpl-item-impacto', itens);
    linkDoar.hidden = false;
    linkDoar.href = `#/cadastro?tipo=doador&valor=${Math.round(quantia)}`;
    anunciar(`${titulo.textContent} ${itens.map((item) => `${item.quantidade} ${item.descricao}`).join('; ')}.`);
  }

  // Os dois campos ficam sincronizados: mexer em um atualiza o outro
  faixa.addEventListener('input', () => {
    valor.value = faixa.value;
    atualizar(Number(faixa.value));
  }, { signal: sinal });

  valor.addEventListener('input', () => {
    const quantia = valor.value === '' ? NaN : Number(valor.value);
    if (Number.isFinite(quantia)) faixa.value = String(Math.min(Math.max(quantia, Number(faixa.min)), Number(faixa.max)));
    atualizar(quantia);
  }, { signal: sinal });

  formulario.addEventListener('submit', (evento) => evento.preventDefault(), { signal: sinal });
  atualizar(Number(faixa.value));
}

export function montar({ raiz, sinal }) {
  const modelos = campanhas.map((campanha) => modeloCartaoCampanha(campanha));
  renderizarLista($('[data-lista-campanhas]', raiz), 'tpl-cartao-campanha', modelos);
  mostrarAlertaDePrazo(raiz, modelos);
  iniciarSimulador(raiz, sinal);
}
