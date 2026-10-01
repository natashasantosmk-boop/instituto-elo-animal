/**
 * Instituto Elo Animal – componentes/validacao.js
 * ------------------------------------------------------------
 * Validação de formulários reutilizável, sobre a Constraint Validation API.
 * As REGRAS ficam no HTML (required, pattern, min, max, type="email"...)
 * ou em setCustomValidity (regras de negócio, no controlador da página).
 * Este módulo cuida da EXPERIÊNCIA:
 *  - mensagem clara junto de cada campo (ícone + texto), ligada ao campo
 *    por aria-describedby e com aria-invalid="true";
 *  - borda verde e ícone nos campos válidos já preenchidos;
 *  - resumo de erros com links que levam o foco ao campo;
 *  - momento certo de avisar: não acusa erro só porque a pessoa passou
 *    pelo campo com o Tab; depois da 1ª tentativa de envio, confere ao digitar.
 */
import { focarElemento } from '../utils/dom.js';

/** Radios e caixas de mesmo name formam um grupo: um erro só, abaixo das opções. */
function camposDoGrupo(form, campo) {
  if (campo.type !== 'radio' && campo.type !== 'checkbox') return [campo];
  const grupo = Array.from(form.querySelectorAll(`input[name="${CSS.escape(campo.name)}"]`));
  return grupo.length > 1 || campo.type === 'radio' ? grupo : [campo];
}

const ehGrupo = (form, campo) => camposDoGrupo(form, campo).length > 1;

/** O campo que carrega a regra do grupo (o primeiro) ou o próprio campo. */
const principal = (form, campo) => camposDoGrupo(form, campo)[0];

/** Texto amigável para cada problema informado pela Constraint Validation API. */
export function mensagemDeErro(campo) {
  const v = campo.validity;
  if (v.customError) return campo.validationMessage;
  if (v.valueMissing) {
    if (campo.type === 'radio') return 'Escolha uma das opções.';
    if (campo.type === 'checkbox') return campo.dataset.mensagem || 'Marque esta opção para continuar.';
    if (campo.tagName === 'SELECT') return 'Selecione uma opção da lista.';
    return 'Preencha este campo.';
  }
  if (v.typeMismatch) return 'Digite um e-mail válido, como nome@exemplo.com.';
  if (v.patternMismatch) return campo.title || 'Confira o formato do que foi digitado.';
  if (v.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
  if (v.rangeUnderflow) return campo.dataset.mensagemMinimo || `O valor mínimo é ${campo.min}.`;
  if (v.rangeOverflow) return campo.dataset.mensagemMaximo || `O valor máximo é ${campo.max}.`;
  if (v.stepMismatch) return 'Use um número inteiro.';
  if (v.badInput) return campo.type === 'date' ? 'Digite a data completa (dia, mês e ano).' : 'Digite apenas números.';
  return campo.validationMessage;
}

export function criarValidador(form, { resumo, listaErros, tituloResumo, sinal }) {
  form.noValidate = true; // o JavaScript assume a exibição; as regras nativas continuam valendo

  let tentouEnviar = false;
  const editados = new Set();

  const chaveDe = (campo) => (ehGrupo(form, campo) ? campo.name : campo.id);

  function obterElementoDeErro(campo) {
    const id = `erro-${chaveDe(campo)}`;
    let erro = form.querySelector(`#${CSS.escape(id)}`);
    if (!erro) {
      erro = document.createElement('p');
      erro.className = 'campo__erro';
      erro.id = id;
      const opcoes = ehGrupo(form, campo) ? campo.closest('.opcoes') : null;
      if (opcoes) opcoes.after(erro);
      else (campo.closest('.campo') || campo.parentElement).append(erro);
    }
    return erro;
  }

  function ligarDescricao(campo, id, ligar) {
    const ids = (campo.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    const novos = ligar ? [...new Set([...ids, id])] : ids.filter((item) => item !== id);
    if (novos.length) campo.setAttribute('aria-describedby', novos.join(' '));
    else campo.removeAttribute('aria-describedby');
  }

  function mostrarErro(campo) {
    const erro = obterElementoDeErro(campo);
    erro.textContent = mensagemDeErro(campo);
    camposDoGrupo(form, campo).forEach((item) => {
      item.setAttribute('aria-invalid', 'true');
      ligarDescricao(item, erro.id, true);
    });
    campo.closest('.campo')?.classList.remove('campo--valido');
  }

  function limparErro(campo) {
    const id = `erro-${chaveDe(campo)}`;
    const erro = form.querySelector(`#${CSS.escape(id)}`);
    if (erro) erro.textContent = '';
    camposDoGrupo(form, campo).forEach((item) => {
      item.removeAttribute('aria-invalid');
      ligarDescricao(item, id, false);
    });
  }

  /** Confere um campo, mostra ou apaga a mensagem e marca os válidos preenchidos. */
  function validarCampo(campo) {
    if (!campo.willValidate) return true;
    const alvo = principal(form, campo);
    const valido = alvo.checkValidity();
    if (valido) limparErro(alvo);
    else mostrarErro(alvo);

    const caixa = campo.closest('.campo');
    if (caixa && !ehGrupo(form, campo) && campo.type !== 'checkbox') {
      caixa.classList.toggle('campo--valido', valido && campo.value.trim() !== '');
    }
    return valido;
  }

  /** Campos inválidos, um por grupo, na ordem em que aparecem. */
  function camposInvalidos() {
    const vistos = new Set();
    return Array.from(form.elements).filter((campo) => {
      if (!campo.willValidate || campo.type === 'submit' || campo.type === 'reset') return false;
      const chave = chaveDe(campo);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return !principal(form, campo).validity.valid;
    }).map((campo) => principal(form, campo));
  }

  /** Nome curto do campo para o resumo: data-nome, legenda do grupo ou rótulo. */
  function nomeDoCampo(campo) {
    let texto = campo.dataset.nome || '';
    if (!texto && ehGrupo(form, campo)) texto = campo.closest('fieldset')?.querySelector('legend')?.textContent || campo.name;
    if (!texto && campo.labels?.length) texto = campo.labels[0].textContent;
    return texto.replace('*', '').trim();
  }

  function mostrarResumo(invalidos) {
    listaErros.replaceChildren(...invalidos.map((campo) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${campo.id}`; // âncora interna: o roteador não troca de página
      const nome = nomeDoCampo(campo);
      link.textContent = `${nome}${nome.endsWith('?') ? ' ' : ': '}${mensagemDeErro(campo)}`;
      link.addEventListener('click', (evento) => {
        evento.preventDefault();
        campo.focus(); // leva direto ao campo com problema
      });
      item.append(link);
      return item;
    }));
    const total = invalidos.length;
    tituloResumo.textContent = total === 1 ? 'Falta corrigir 1 campo para enviar:' : `Faltam corrigir ${total} campos para enviar:`;
    resumo.hidden = false;
    focarElemento(resumo);
  }

  function esconderResumo() {
    resumo.hidden = true;
    listaErros.replaceChildren();
  }

  // ----- Quando avisar -----
  form.addEventListener('input', (evento) => {
    const campo = evento.target;
    editados.add(campo);
    if (campo.getAttribute('aria-invalid') === 'true' || tentouEnviar) validarCampo(campo);
  }, { signal: sinal });

  // Ao sair do campo: só confere se a pessoa já mexeu nele (ou já tentou enviar)
  form.addEventListener('focusout', (evento) => {
    const campo = evento.target;
    if (!campo.matches('input, select, textarea') || campo.type === 'radio' || campo.type === 'checkbox') return;
    if (editados.has(campo) || tentouEnviar) validarCampo(campo);
  }, { signal: sinal });

  // Radios e caixas: confere na hora da escolha
  form.addEventListener('change', (evento) => {
    if (evento.target.type === 'radio' || evento.target.type === 'checkbox') validarCampo(evento.target);
  }, { signal: sinal });

  return {
    validarCampo,
    /** Valida tudo; mostra o resumo e devolve true se o formulário pode ser enviado. */
    validarTudo() {
      tentouEnviar = true;
      const invalidos = camposInvalidos();
      invalidos.forEach(validarCampo);
      if (invalidos.length) {
        mostrarResumo(invalidos);
        return false;
      }
      esconderResumo();
      return true;
    },
    /** Volta ao estado inicial (depois de enviar ou limpar). */
    reiniciar() {
      form.querySelectorAll('.campo__erro').forEach((erro) => { erro.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach((campo) => campo.removeAttribute('aria-invalid'));
      form.querySelectorAll('[aria-describedby]').forEach((campo) => {
        (campo.getAttribute('aria-describedby') || '').split(' ')
          .filter((id) => id.startsWith('erro-'))
          .forEach((id) => ligarDescricao(campo, id, false));
      });
      form.querySelectorAll('.campo--valido').forEach((caixa) => caixa.classList.remove('campo--valido'));
      esconderResumo();
      tentouEnviar = false;
      editados.clear();
    },
    /** Marca campos já preenchidos (ex.: rascunho restaurado) como editados. */
    marcarEditados(campos) {
      campos.forEach((campo) => editados.add(campo));
    },
  };
}
