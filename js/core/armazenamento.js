/**
 * Instituto Elo Animal – core/armazenamento.js
 * ------------------------------------------------------------
 * Camada única de acesso ao Web Storage. Nenhum outro módulo chama
 * localStorage/sessionStorage diretamente; todos passam por aqui:
 *  - prefixo "eloAnimal:" (não mistura com outros dados do mesmo domínio);
 *  - JSON com envelope { v, valor, salvoEm, expira }: versão do formato,
 *    data de gravação e validade opcional (ex.: rascunho expira em 7 dias);
 *  - try/catch em toda leitura e escrita: modo privativo, cota cheia ou
 *    JSON corrompido nunca derrubam a aplicação (ela só "esquece" o dado);
 *  - aviso entre abas abertas pelo evento "storage".
 *
 * localStorage (exportado direto): dura até a pessoa apagar.
 * sessionStorage (objeto "sessao"): dura só enquanto a aba estiver aberta.
 */

export const PREFIXO = 'eloAnimal:';
const VERSAO = 1;
const UM_DIA = 24 * 60 * 60 * 1000;

/** Todas as chaves usadas pelo site, em um só lugar (salvas como "eloAnimal:<chave>"). */
export const CHAVES = {
  preferencias: 'preferencias',     // localStorage: tamanho do texto e animações
  favoritos: 'favoritos',           // localStorage: ids dos projetos favoritos
  rascunho: 'rascunho-cadastro',    // localStorage: formulário em andamento (expira em 7 dias)
  inscricoes: 'inscricoes',         // localStorage: resumo dos cadastros enviados
  filtrosProjetos: 'filtros-projetos', // sessionStorage: filtros da lista de projetos
};

/** Cria as operações sobre um Storage (o objeto é obtido na hora do uso). */
export function criarArmazenamento(obterStorage) {
  function remover(chave) {
    try {
      obterStorage().removeItem(PREFIXO + chave);
    } catch {
      /* sem acesso ao armazenamento: não há o que remover */
    }
  }

  function lerEnvelope(chave) {
    const bruto = obterStorage().getItem(PREFIXO + chave);
    if (bruto === null) return null;
    const envelope = JSON.parse(bruto);
    if (!envelope || envelope.v !== VERSAO) return null; // formato antigo/desconhecido
    if (envelope.expira && Date.now() > envelope.expira) {
      remover(chave); // vencido: apaga em vez de devolver
      return null;
    }
    return envelope;
  }

  /** Lê um valor; devolve o padrão se não existir, estiver vencido ou corrompido. */
  function ler(chave, padrao = null) {
    try {
      return lerEnvelope(chave)?.valor ?? padrao;
    } catch (erro) {
      console.warn(`[armazenamento] Não foi possível ler "${chave}":`, erro);
      return padrao;
    }
  }

  /** Valor + data em que foi salvo (para mostrar "salvo às 22:15"). */
  function lerComData(chave) {
    try {
      const envelope = lerEnvelope(chave);
      return envelope ? { valor: envelope.valor, salvoEm: envelope.salvoEm } : null;
    } catch {
      return null;
    }
  }

  /**
   * Salva qualquer valor aceito pelo JSON. validadeDias: prazo de validade.
   * Devolve false se o navegador recusar (cota cheia, modo privativo...).
   */
  function salvar(chave, valor, { validadeDias } = {}) {
    const agora = Date.now();
    const envelope = { v: VERSAO, valor, salvoEm: agora, expira: validadeDias ? agora + validadeDias * UM_DIA : null };
    try {
      obterStorage().setItem(PREFIXO + chave, JSON.stringify(envelope));
      return true;
    } catch (erro) {
      console.warn(`[armazenamento] Não foi possível salvar "${chave}":`, erro);
      return false;
    }
  }

  /** Chaves do site, sem o prefixo. */
  function chaves() {
    try {
      const storage = obterStorage();
      const lista = [];
      for (let i = 0; i < storage.length; i++) {
        const chave = storage.key(i);
        if (chave && chave.startsWith(PREFIXO)) lista.push(chave.slice(PREFIXO.length));
      }
      return lista;
    } catch {
      return [];
    }
  }

  /** Apaga só os dados deste site (direito de exclusão da LGPD). */
  function limparTudo() {
    chaves().forEach(remover);
  }

  /** O navegador permite gravar? (alguns modos privativos recusam) */
  function disponivel() {
    try {
      const teste = `${PREFIXO}__teste__`;
      obterStorage().setItem(teste, '1');
      obterStorage().removeItem(teste);
      return true;
    } catch {
      return false;
    }
  }

  return { ler, lerComData, salvar, remover, chaves, limparTudo, disponivel };
}

const local = criarArmazenamento(() => globalThis.localStorage);
export const { ler, lerComData, salvar, remover, chaves, limparTudo, disponivel } = local;

/** Mesmas operações no sessionStorage (dados que valem só durante a visita). */
export const sessao = criarArmazenamento(() => globalThis.sessionStorage);

/**
 * Executa o callback quando OUTRA aba do site altera a chave
 * (o evento "storage" não dispara na própria aba que salvou).
 * Com chave null, avisa sobre qualquer dado do site.
 */
export function aoAlterarEmOutraAba(chave, callback, sinal) {
  window.addEventListener('storage', (evento) => {
    if (evento.storageArea && evento.storageArea !== globalThis.localStorage) return;
    if (chave === null || evento.key === null || evento.key === PREFIXO + chave) callback(evento);
  }, { signal: sinal });
}
