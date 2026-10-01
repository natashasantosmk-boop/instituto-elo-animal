/**
 * Instituto Elo Animal – utils/formatacao.js
 * Funções puras de formatação (sem DOM): podem ser testadas no Node.
 * Usam a API Intl do próprio navegador, que já conhece o padrão brasileiro.
 */

const LOCALE = 'pt-BR';
const UM_DIA = 24 * 60 * 60 * 1000;

const moeda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat(LOCALE);
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const dataLonga = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const dataHora = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' });

/** 9600 -> "R$ 9.600" */
export const formatarMoeda = (valor) => moeda.format(valor);

/** 1240 -> "1.240" */
export const formatarNumero = (valor) => numero.format(valor);

/**
 * Converte "AAAA-MM-DD" em uma data LOCAL à meia-noite.
 * new Date("2026-12-15") seria lida como UTC e, no Brasil (UTC-3),
 * viraria 14/12 às 21h: o prazo apareceria com um dia a menos.
 */
export function paraDataLocal(iso) {
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** "2026-12-15" -> "15 de dezembro de 2026" */
export const formatarData = (iso) => dataLonga.format(paraDataLocal(iso));

/** Date ou timestamp -> "01/10/2026, 22:15" */
export const formatarDataHora = (data) => dataHora.format(new Date(data));

/** Dias de calendário entre hoje e a data (negativo = já passou). */
export function diasAte(iso, hoje = new Date()) {
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((paraDataLocal(iso) - inicioDeHoje) / UM_DIA);
}

/** (1, "dia", "dias") -> "1 dia"; (3, ...) -> "3 dias" */
export function pluralizar(quantidade, singular, plural) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : plural}`;
}

/** Porcentagem inteira, limitada entre 0 e 100. */
export function percentual(parte, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((parte / total) * 100)));
}

/** Valor de campanha conforme a unidade: reais ou quilos (toneladas a partir de 1.000 kg). */
export function formatarQuantidade(valor, unidade) {
  if (unidade === 'reais') return formatarMoeda(valor);
  if (unidade === 'kg') return valor >= 1000 ? `${decimal.format(valor / 1000)} t` : `${formatarNumero(valor)} kg`;
  return formatarNumero(valor);
}

/** Remove acentos e maiúsculas para comparar textos na busca ("Adoção" = "adocao"). */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
