/**
 * Instituto Elo Animal – utils/validacoes.js
 * Regras de negócio que o HTML sozinho não consegue verificar.
 * Funções puras (sem DOM), cobertas por testes em testes/unidade.
 */

/** Remove tudo o que não for número. Ex.: "123.456" -> "123456" */
export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

/** Confere os dois dígitos verificadores do CPF (algoritmo módulo 11). */
export function cpfValido(cpf) {
  const numeros = somenteDigitos(cpf);
  // 11 dígitos e não pode ser uma sequência repetida (111.111.111-11)
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

  const calcularDigito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(numeros.slice(0, 9)) === Number(numeros[9])
    && calcularDigito(numeros.slice(0, 10)) === Number(numeros[10]);
}

/** Date -> "AAAA-MM-DD" (formato do input type="date"), no horário local. */
export function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Idade completa em anos na data de hoje (considera mês e dia do aniversário). */
export function calcularIdade(nascimentoISO, hoje = new Date()) {
  const [ano, mes, dia] = nascimentoISO.split('-').map(Number);
  let idade = hoje.getFullYear() - ano;
  const aindaNaoFezAniversario = hoje.getMonth() + 1 < mes
    || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

/** Última data de nascimento aceita para quem precisa ter idadeMinima anos hoje. */
export function dataMaximaNascimento(idadeMinima = 18, hoje = new Date()) {
  return formatarDataISO(new Date(hoje.getFullYear() - idadeMinima, hoje.getMonth(), hoje.getDate()));
}

/** Nome e sobrenome com letras (acentos, apóstrofo e hífen permitidos). */
export function nomeCompletoValido(nome) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+( [A-Za-zÀ-ÖØ-öø-ÿ'-]+)+$/.test(String(nome ?? '').trim());
}
