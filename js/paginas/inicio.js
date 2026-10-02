/**
 * Instituto Elo Animal – paginas/inicio.js
 * Controlador da view "inicio": preenche indicadores, projetos em
 * destaque e perguntas a partir dos dados, anima os números quando
 * entram na tela e mantém a contagem regressiva do próximo mutirão.
 */
import { projetos, impacto, perguntas, proximoEvento } from '../dados/conteudo.js';
import { renderizarLista } from '../core/templates.js';
import { modeloCartaoProjeto } from '../componentes/cartoes.js';
import { atualizarBotoesFavorito } from '../componentes/favoritos.js';
import { formatarNumero, pluralizar } from '../utils/formatacao.js';
import { $, prefereMenosMovimento } from '../utils/dom.js';

const DURACAO_ANIMACAO = 1200; // ms

/** Conta de 0 até o valor final com desaceleração (easeOutCubic). */
function animarNumero(elemento, valorFinal, sinal) {
  if (prefereMenosMovimento()) {
    elemento.textContent = formatarNumero(valorFinal);
    return;
  }
  const inicio = performance.now();
  let quadro;
  const passo = (agora) => {
    const progresso = Math.min(1, (agora - inicio) / DURACAO_ANIMACAO);
    const suavizado = 1 - (1 - progresso) ** 3;
    elemento.textContent = formatarNumero(Math.round(valorFinal * suavizado));
    if (progresso < 1) quadro = requestAnimationFrame(passo);
  };
  quadro = requestAnimationFrame(passo);
  sinal.addEventListener('abort', () => cancelAnimationFrame(quadro));
}

/** Os números só começam a contar quando a seção aparece na tela. */
function prepararIndicadores(lista, sinal) {
  renderizarLista(lista, 'tpl-numero', impacto.map((item) => ({
    ...item,
    valorFormatado: formatarNumero(item.valor),
  })));

  const observador = new IntersectionObserver((entradas) => {
    if (!entradas.some((entrada) => entrada.isIntersecting)) return;
    observador.disconnect(); // anima uma vez só
    lista.querySelectorAll('data').forEach((dado) => animarNumero(dado, Number(dado.value), sinal));
  }, { threshold: 0.4 });
  observador.observe(lista);
  sinal.addEventListener('abort', () => observador.disconnect());
}

/** "Faltam 15 dias, 9 horas e 12 minutos" – atualizado a cada minuto. */
function iniciarContagem(raiz, sinal) {
  const inicio = new Date(proximoEvento.inicio);
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Fortaleza',
  }).format(inicio);

  $('[data-evento-titulo]', raiz).textContent = proximoEvento.titulo;
  const tempo = $('[data-evento-data]', raiz);
  tempo.dateTime = proximoEvento.inicio;
  tempo.textContent = `${dataFormatada.charAt(0).toUpperCase()}${dataFormatada.slice(1)},`;
  $('[data-evento-descricao]', raiz).textContent = proximoEvento.descricao;

  const contagem = $('[data-evento-contagem]', raiz);
  const atualizar = () => {
    const restante = inicio - Date.now();
    if (restante <= 0) {
      contagem.textContent = 'O mutirão já começou: venha até a sede!';
      return;
    }
    const dias = Math.floor(restante / 86400000);
    const horas = Math.floor((restante % 86400000) / 3600000);
    const minutos = Math.floor((restante % 3600000) / 60000);
    contagem.textContent = `Faltam ${pluralizar(dias, 'dia', 'dias')}, ${pluralizar(horas, 'hora', 'horas')} e ${pluralizar(minutos, 'minuto', 'minutos')}.`;
  };
  atualizar();
  const relogio = setInterval(atualizar, 60000);
  sinal.addEventListener('abort', () => clearInterval(relogio)); // sem vazamento ao trocar de página
}

export function montar({ raiz, sinal }) {
  prepararIndicadores($('[data-impacto]', raiz), sinal);

  renderizarLista($('[data-destaques]', raiz), 'tpl-cartao-projeto', projetos.map(modeloCartaoProjeto));
  atualizarBotoesFavorito(raiz);

  renderizarLista($('[data-perguntas]', raiz), 'tpl-pergunta', perguntas);

  iniciarContagem(raiz, sinal);
}
