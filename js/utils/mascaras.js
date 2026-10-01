/**
 * Instituto Elo Animal – utils/mascaras.js
 * Máscaras de digitação: a pessoa digita só números e os pontos,
 * traços e parênteses entram sozinhos. Funções puras e testáveis.
 */
import { somenteDigitos } from './validacoes.js';

/**
 * Aplica um molde em que cada "0" representa um dígito.
 * Ex.: aplicarMascara("12345678", "00000-000") -> "12345-678"
 */
export function aplicarMascara(valor, molde) {
  const digitos = somenteDigitos(valor);
  let resultado = '';
  let posicao = 0;

  for (const caractere of molde) {
    if (posicao >= digitos.length) break;
    if (caractere === '0') {
      resultado += digitos[posicao];
      posicao++;
    } else {
      resultado += caractere; // ponto, traço, parênteses ou espaço
    }
  }
  return resultado;
}

export const mascaraCPF = (valor) => aplicarMascara(valor, '000.000.000-00');

export const mascaraCEP = (valor) => aplicarMascara(valor, '00000-000');

/** 11 dígitos = celular (00) 00000-0000; até 10 = fixo (00) 0000-0000. */
export function mascaraTelefone(valor) {
  const molde = somenteDigitos(valor).length > 10 ? '(00) 00000-0000' : '(00) 0000-0000';
  return aplicarMascara(valor, molde);
}

/** Mapa usado pelo formulário: id do campo -> função de máscara. */
export const mascarasPorCampo = {
  cpf: mascaraCPF,
  telefone: mascaraTelefone,
  cep: mascaraCEP,
};
