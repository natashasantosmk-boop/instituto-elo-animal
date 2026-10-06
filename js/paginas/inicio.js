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
    // Anima só a cópia visual (aria-hidden): o leitor de tela lê o valor final, nunca "0" ou um número pela metade
    lista.querySelectorAll('data').forEach((dado) => animarNumero($('[data-animado]', dado), Number(dado.value), sinal));
  }, { threshold: 0.4 });
  observador.observe(lista);
  sinal.addEventListener('abort', () => observador.disconnect());
}

/**
 * Texto da contagem regressiva em três momentos: antes do mutirão ("Faltam..."),
 * durante (até o horário de término) e depois dele. Função pura: recebe o "agora".
 */
export function textoDaContagem(evento, agora = Date.now()) {
  const inicio = new Date(evento.inicio).getTime();
  const fim = new Date(evento.fim).getTime();
  if (agora >= fim) {
    return { texto: 'Este mutirão já aconteceu. Obrigado a quem participou! A próxima data será divulgada aqui.', encerrado: true };
  }
  if (agora >= inicio) {
    return { texto: 'O mutirão está acontecendo agora: venha até a sede!', encerrado: false };
  }
  const restante = inicio - agora;
  const dias = Math.floor(restante / 86400000);
  const horas = Math.floor((restante % 86400000) / 3600000);
  const minutos = Math.floor((restante % 3600000) / 60000);
  return {
    texto: `Faltam ${pluralizar(dias, 'dia', 'dias')}, ${pluralizar(horas, 'hora', 'horas')} e ${pluralizar(minutos, 'minuto', 'minutos')}.`,
    encerrado: false,
  };
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
  let relogio;
  const atualizar = () => {
    const { texto, encerrado } = textoDaContagem(proximoEvento);
    contagem.textContent = texto;
    if (encerrado) clearInterval(relogio); // depois do mutirão não há mais o que contar
  };
  relogio = setInterval(atualizar, 60000);
  atualizar();
  sinal.addEventListener('abort', () => clearInterval(relogio)); // sem vazamento ao trocar de página
}

export function montar({ raiz, sinal }) {
  prepararIndicadores($('[data-impacto]', raiz), sinal);

  renderizarLista($('[data-destaques]', raiz), 'tpl-cartao-projeto', projetos.map(modeloCartaoProjeto));
  atualizarBotoesFavorito(raiz);

  renderizarLista($('[data-perguntas]', raiz), 'tpl-pergunta', perguntas);

  iniciarContagem(raiz, sinal);
}
