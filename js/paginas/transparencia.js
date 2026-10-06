/**
 * Instituto Elo Animal – paginas/transparencia.js
 * Gráficos com a biblioteca externa Chart.js (rosca e barras).
 *  - A biblioteca é baixada só quando esta página abre (core/bibliotecas.js),
 *    da CDN com SRI ou, se falhar, da cópia local em js/vendor.
 *  - As cores vêm dos tokens semânticos do design system (variáveis CSS):
 *    ao trocar o tema (claro/escuro), os gráficos são redesenhados.
 *  - Cada gráfico tem tabela com os mesmos dados e aria-label com o resumo.
 *  - Ao sair da página, os gráficos são destruídos (chart.destroy()) para
 *    liberar memória e os ouvintes que o Chart.js coloca na janela.
 */
import { aplicacaoRecursos, historico } from '../dados/conteudo.js';
import { renderizarLista } from '../core/templates.js';
import { carregarChartJS } from '../core/bibliotecas.js';
import { formatarMoeda, formatarNumero } from '../utils/formatacao.js';
import { $, prefereMenosMovimento } from '../utils/dom.js';

const ESCALA_DA_FONTE = { grande: 1.125, maior: 1.25 };

/** Lê um token do design system (ex.: --cor-primaria-500). */
const token = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

function tamanhoDaFonte() {
  return Math.round(14 * (ESCALA_DA_FONTE[document.documentElement.dataset.fonte] || 1));
}

function preencherTabelas(raiz) {
  renderizarLista($('[data-tabela-aplicacao]', raiz), 'tpl-linha-dado', aplicacaoRecursos.itens.map((item) => ({
    rotulo: item.rotulo,
    valor: formatarMoeda(item.valor),
  })));
  renderizarLista($('[data-tabela-historico]', raiz), 'tpl-linha-historico', historico.map((ano) => ({
    ano: String(ano.ano),
    castracoes: formatarNumero(ano.castracoes),
    atendimentos: formatarNumero(ano.atendimentos),
    adocoes: formatarNumero(ano.adocoes),
  })));
}

function criarGraficoDeRosca(Chart, canvas) {
  const { itens, ano } = aplicacaoRecursos;
  canvas.setAttribute('aria-label', `Gráfico de rosca: aplicação de cada R$ 100 em ${ano}. `
    + itens.map((item) => `${item.rotulo}, ${formatarMoeda(item.valor)}`).join('; ') + '.');
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: itens.map((item) => item.rotulo),
      datasets: [{
        data: itens.map((item) => item.valor),
        backgroundColor: [token('--cor-grafico-1'), token('--cor-grafico-3'), token('--cor-grafico-2'), token('--cor-grafico-4')],
        borderColor: token('--cor-superficie'),
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      animation: prefereMenosMovimento() ? false : { duration: 800 },
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
        tooltip: { callbacks: { label: (contexto) => ` ${contexto.label}: ${formatarMoeda(contexto.parsed)} de cada R$ 100` } },
      },
    },
  });
}

function criarGraficoDeBarras(Chart, canvas) {
  const ultimo = historico[historico.length - 1];
  canvas.setAttribute('aria-label', `Gráfico de barras de ${historico[0].ano} a ${ultimo.ano}. `
    + historico.map((ano) => `${ano.ano}: ${formatarNumero(ano.castracoes)} castrações, `
      + `${formatarNumero(ano.atendimentos)} atendimentos e ${formatarNumero(ano.adocoes)} adoções`).join('; ') + '.');
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: historico.map((ano) => String(ano.ano)),
      datasets: [
        { label: 'Castrações', data: historico.map((ano) => ano.castracoes), backgroundColor: token('--cor-grafico-1') },
        { label: 'Atendimentos na clínica', data: historico.map((ano) => ano.atendimentos), backgroundColor: token('--cor-grafico-2') },
        { label: 'Adoções', data: historico.map((ano) => ano.adocoes), backgroundColor: token('--cor-grafico-3') },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      locale: 'pt-BR', // separador de milhar com ponto
      animation: prefereMenosMovimento() ? false : { duration: 800 },
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
    },
  });
}

/** Baixa o Chart.js e desenha os gráficos sem travar a abertura da página. */
async function desenharGraficos(raiz, sinal, graficos) {
  const status = $('[data-status-grafico]', raiz);
  status.textContent = 'Carregando os gráficos…';
  let Chart;
  try {
    Chart = await carregarChartJS();
  } catch (erro) {
    if (sinal.aborted) return;
    // Plano B: sem a biblioteca, os dados continuam nas tabelas
    status.textContent = 'Os gráficos não puderam ser carregados agora. Os dados completos estão nas tabelas abaixo.';
    status.classList.add('aviso-grafico--erro');
    raiz.querySelectorAll('.grafico').forEach((figura) => { figura.hidden = true; });
    $('[data-detalhes-historico]', raiz).open = true;
    return;
  }
  if (sinal.aborted) return; // a pessoa saiu da página enquanto a biblioteca baixava

  status.textContent = '';

  // Desenha (ou redesenha) com as cores e o tamanho de texto que estão valendo agora
  const desenhar = () => {
    graficos.splice(0).forEach((grafico) => grafico.destroy());
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = tamanhoDaFonte();
    Chart.defaults.color = token('--cor-texto');       // legendas e eixos
    Chart.defaults.borderColor = token('--cor-borda'); // linhas de grade
    graficos.push(criarGraficoDeRosca(Chart, $('[data-grafico-aplicacao]', raiz)));
    graficos.push(criarGraficoDeBarras(Chart, $('[data-grafico-historico]', raiz)));
  };
  desenhar();

  // Mudou o tema ou o tamanho do texto (Minha área, outra aba ou o próprio sistema)
  document.addEventListener('preferencias:alteradas', desenhar, { signal: sinal });
}

export function montar({ raiz, sinal }) {
  $('[data-titulo-aplicacao]', raiz).textContent = `Como cada R$ 100 foram aplicados em ${aplicacaoRecursos.ano}`;
  preencherTabelas(raiz);

  const graficos = [];
  desenharGraficos(raiz, sinal, graficos); // assíncrono: a página já aparece com as tabelas

  // Chamado pelo roteador ao sair da página. Sem isso, cada visita deixava
  // gráficos "fantasmas" na memória (Chart.instances crescia: 2, 4, 6...),
  // ainda ouvindo o redimensionamento da janela
  return { desmontar: () => graficos.splice(0).forEach((grafico) => grafico.destroy()) };
}
