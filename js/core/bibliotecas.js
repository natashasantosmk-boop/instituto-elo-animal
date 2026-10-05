/**
 * Instituto Elo Animal – core/bibliotecas.js
 * ------------------------------------------------------------
 * Carrega bibliotecas externas SOB DEMANDA: o script só é baixado
 * quando a primeira tela que precisa dele é aberta (o Chart.js tem
 * ~200 KB e só é usado na página Transparência).
 *
 * Cada biblioteca tem uma lista de fontes, tentadas em ordem.
 * Em DESENVOLVIMENTO (código-fonte):
 *  1. CDN (jsDelivr) com Subresource Integrity (integrity + crossorigin):
 *     o navegador confere o hash SHA-384 e recusa o arquivo se ele tiver
 *     sido alterado no servidor;
 *  2. cópia completa local em js/vendor (sem internet externa ou se a CDN cair).
 * Em PRODUÇÃO (pasta dist/, gerada por npm run build):
 *  1. versão enxuta gerada no build (só rosca e barras, ~20% menor), servida
 *     pelo próprio site: sem conexão extra com outro domínio e sem enviar o
 *     IP de quem visita para a CDN;
 *  2. CDN com SRI como reserva.
 * Se nenhuma fonte funcionar, a Promise é rejeitada e a tela mostra a
 * alternativa sem a biblioteca (tabela de dados).
 */
import { PRODUCAO } from './ambiente.js';

const TEMPO_LIMITE = 8000; // ms: CDN lenta conta como falha
export const VERSAO_CHART_JS = '4.5.1'; // a mesma do package.json (o build confere)

const CDN_CHART_JS = {
  src: `https://cdn.jsdelivr.net/npm/chart.js@${VERSAO_CHART_JS}/dist/chart.umd.min.js`,
  integrity: 'sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ',
};

export const FONTES_CHART_JS = PRODUCAO
  ? [{ src: `js/vendor/chart-${VERSAO_CHART_JS}.min.js` }, CDN_CHART_JS]
  : [CDN_CHART_JS, { src: 'js/vendor/chart.umd.min.js' }];

const emAndamento = new Map();

/** Insere um <script> e resolve quando ele terminar de carregar. */
function carregarScript({ src, integrity }) {
  return new Promise((resolver, rejeitar) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous'; // exigido pelo SRI em arquivos de outro domínio
    }
    const limite = setTimeout(() => falhar(new Error(`Tempo esgotado ao carregar ${src}`)), TEMPO_LIMITE);
    function falhar(erro) {
      clearTimeout(limite);
      script.remove();
      rejeitar(erro);
    }
    script.addEventListener('load', () => { clearTimeout(limite); resolver(); }, { once: true });
    script.addEventListener('error', () => falhar(new Error(`Falha ao carregar ${src}`)), { once: true });
    document.head.append(script);
  });
}

/**
 * Garante que window[nomeGlobal] exista, tentando cada fonte em ordem.
 * Chamadas repetidas reaproveitam a mesma Promise (o arquivo é baixado uma vez).
 */
export function carregarBiblioteca(nomeGlobal, fontes) {
  if (window[nomeGlobal]) return Promise.resolve(window[nomeGlobal]);

  if (!emAndamento.has(nomeGlobal)) {
    const tentativa = (async () => {
      for (const fonte of fontes) {
        try {
          await carregarScript(fonte);
          if (window[nomeGlobal]) return window[nomeGlobal];
        } catch (erro) {
          console.warn(`[bibliotecas] ${erro.message}. Tentando a próxima fonte...`);
        }
      }
      throw new Error(`A biblioteca ${nomeGlobal} não pôde ser carregada.`);
    })();
    emAndamento.set(nomeGlobal, tentativa);
    tentativa.catch(() => emAndamento.delete(nomeGlobal)); // permite tentar de novo depois
  }
  return emAndamento.get(nomeGlobal);
}

export const carregarChartJS = () => carregarBiblioteca('Chart', FONTES_CHART_JS);
