/**
 * Instituto Elo Animal – componentes/cartoes.js
 * Prepara os dados de cada cartão para o template ("modelo de exibição"):
 * o template recebe textos e atributos prontos, sem precisar de lógica.
 * Assim o mesmo cartão de projeto aparece igual no Início e em Projetos.
 */
import {
  formatarData, formatarQuantidade, percentual, diasAte, pluralizar,
} from '../utils/formatacao.js';

export function modeloCartaoProjeto(projeto) {
  return {
    ...projeto,
    idTitulo: `cartao-${projeto.id}`,
    link: `#/projetos/${projeto.id}`,
    tituloOculto: ` sobre ${projeto.titulo}`,
    rotuloFavorito: `Favoritar ${projeto.titulo}`,
  };
}

/** Situação da campanha calculada pela data de hoje (aberta, últimos dias ou encerrada). */
export function situacaoDaCampanha(campanha, hoje = new Date()) {
  const dias = diasAte(campanha.prazo, hoje);
  const metaAtingida = campanha.arrecadado >= campanha.meta;
  if (dias < 0 || metaAtingida) return { aberta: false, dias, texto: metaAtingida ? 'Meta atingida' : 'Encerrada', variante: 'etiqueta--sucesso' };
  if (dias <= 30) return { aberta: true, dias, texto: dias === 0 ? 'Último dia' : `Faltam ${pluralizar(dias, 'dia', 'dias')}`, variante: 'etiqueta--alerta' };
  return { aberta: true, dias, texto: `Faltam ${pluralizar(dias, 'dia', 'dias')}`, variante: '' };
}

/**
 * Campanha recebida pelo link do cadastro (?campanha=id). Links antigos continuam
 * circulando depois que a campanha termina (redes sociais, favoritos do navegador):
 * nesse caso a doação NÃO é vinculada a ela e a pessoa é avisada do motivo.
 */
export function escolhaDeCampanha(campanha, hoje = new Date()) {
  const situacao = situacaoDaCampanha(campanha, hoje);
  if (situacao.aberta) {
    return { vincular: true, texto: `Sua doação vai para a campanha ${campanha.titulo}.` };
  }
  const motivo = campanha.arrecadado >= campanha.meta
    ? 'já atingiu a meta e foi encerrada'
    : `foi encerrada em ${formatarData(campanha.prazo)}`;
  return {
    vincular: false,
    texto: `A campanha ${campanha.titulo} ${motivo}. Sua doação irá para o fundo geral do Instituto, que atende as campanhas abertas.`,
  };
}

export function modeloCartaoCampanha(campanha, hoje = new Date()) {
  const situacao = situacaoDaCampanha(campanha, hoje);
  const porcentagem = percentual(campanha.arrecadado, campanha.meta);
  const arrecadado = formatarQuantidade(campanha.arrecadado, campanha.unidade);
  const meta = formatarQuantidade(campanha.meta, campanha.unidade);
  return {
    ...campanha,
    idTitulo: `campanha-${campanha.id}`,
    idProgresso: `progresso-${campanha.id}`,
    situacao: situacao.texto,
    varianteSituacao: situacao.variante,
    classeSituacao: situacao.aberta ? '' : 'campanha--encerrada',
    aberta: situacao.aberta,
    rotuloProgresso: `Arrecadado: ${arrecadado} de ${meta} (${porcentagem}%)`,
    percentualTexto: `${porcentagem}%`,
    prazoTexto: situacao.aberta ? `Prazo: ${formatarData(campanha.prazo)}` : `Encerrada em ${formatarData(campanha.prazo)}`,
    link: `#/cadastro?tipo=doador&campanha=${campanha.id}`,
    rotuloAcao: `Doar para ${campanha.titulo}`,
    dias: situacao.dias,
  };
}
