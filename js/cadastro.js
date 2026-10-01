/*
 * Instituto Elo Animal – cadastro.js
 * ------------------------------------------------------------
 * Complementa a validação nativa do HTML5 do formulário de cadastro:
 *  1. Máscaras de entrada para CPF, telefone e CEP;
 *  2. Verificação dos dígitos do CPF e idade mínima de 18 anos;
 *  3. Campos de voluntariado e/ou doação conforme a escolha;
 *  4. Mensagens de erro junto de cada campo (ícone + texto) e resumo de erros;
 *  5. Estado de carregamento no envio, alerta de sucesso, modal de
 *     confirmação ao limpar e notificação toast.
 *
 * As regras continuam no HTML (required, pattern, min, max...) e na
 * Constraint Validation API (setCustomValidity). O JavaScript só troca
 * os balões padrão do navegador por mensagens mais claras na página.
 * Sem JavaScript, a validação nativa continua funcionando.
 */
'use strict';

(function () {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  // O JavaScript assume a exibição dos erros (as regras nativas continuam valendo)
  form.noValidate = true;

  const interfaceSite = window.EloAnimal || { mostrarToast() {}, abrirModal() { return false; } };

  // ---------- Utilitários ----------

  /** Remove tudo o que não for número. Ex.: "123.456" -> "123456" */
  function somenteDigitos(valor) {
    return valor.replace(/\D/g, '');
  }

  /**
   * Aplica um molde de máscara, em que cada "0" representa um dígito.
   * Ex.: aplicarMascara("12345678", "00000-000") -> "12345-678"
   */
  function aplicarMascara(valor, molde) {
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

  /** Formata uma data no padrão AAAA-MM-DD usado pelo input type="date". */
  function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // ---------- 1. Máscaras de entrada ----------

  const mascaras = {
    cpf: (valor) => aplicarMascara(valor, '000.000.000-00'),
    telefone: (valor) => {
      // 11 dígitos = celular (00) 00000-0000; até 10 = fixo (00) 0000-0000
      const molde = somenteDigitos(valor).length > 10 ? '(00) 00000-0000' : '(00) 0000-0000';
      return aplicarMascara(valor, molde);
    },
    cep: (valor) => aplicarMascara(valor, '00000-000'),
  };

  Object.keys(mascaras).forEach((id) => {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.addEventListener('input', () => {
      campo.value = mascaras[id](campo.value);
    });
  });

  // ---------- 2. Regras extras: CPF e idade mínima ----------

  function cpfValido(cpf) {
    const numeros = somenteDigitos(cpf);
    // Precisa ter 11 dígitos e não pode ser uma sequência repetida (111.111.111-11)
    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

    const calcularDigito = (base) => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) {
        soma += Number(base[i]) * (base.length + 1 - i);
      }
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };

    const digito1 = calcularDigito(numeros.slice(0, 9));
    const digito2 = calcularDigito(numeros.slice(0, 10));
    return digito1 === Number(numeros[9]) && digito2 === Number(numeros[10]);
  }

  const campoCPF = document.getElementById('cpf');
  if (campoCPF) {
    campoCPF.addEventListener('input', () => {
      campoCPF.setCustomValidity('');
      // Só confere os dígitos quando o formato já está completo
      if (campoCPF.validity.valid && !cpfValido(campoCPF.value)) {
        campoCPF.setCustomValidity('CPF inválido: confira os números digitados.');
      }
    });
  }

  const campoNascimento = document.getElementById('nascimento');
  if (campoNascimento) {
    const hoje = new Date();
    const dataLimite = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
    campoNascimento.max = formatarDataISO(dataLimite); // atualiza o max do HTML todos os dias

    campoNascimento.addEventListener('input', () => {
      campoNascimento.setCustomValidity('');
      if (campoNascimento.validity.rangeOverflow) {
        campoNascimento.setCustomValidity('É preciso ter 18 anos ou mais para se cadastrar.');
      }
    });
  }

  // ---------- 3. Mostrar só os grupos que fazem sentido ----------

  const grupoVoluntario = document.getElementById('grupo-voluntario');
  const grupoDoador = document.getElementById('grupo-doador');

  function alternarGrupo(grupo, ativo) {
    if (!grupo) return;
    grupo.hidden = !ativo;
    // Um fieldset desabilitado não é validado nem enviado junto com o formulário
    grupo.disabled = !ativo;
  }

  function atualizarGrupos() {
    const escolhido = form.querySelector('input[name="participacao"]:checked');
    const opcao = escolhido ? escolhido.value : '';
    alternarGrupo(grupoVoluntario, opcao === 'voluntario' || opcao === 'ambos');
    alternarGrupo(grupoDoador, opcao === 'doador' || opcao === 'ambos');
  }

  form.querySelectorAll('input[name="participacao"]').forEach((radio) => {
    radio.addEventListener('change', atualizarGrupos);
  });
  atualizarGrupos();

  // Pelo menos uma área de interesse (a regra fica na primeira caixa do grupo)
  const areas = form.querySelectorAll('input[name="areas"]');

  function validarAreas() {
    if (areas.length === 0) return;
    const algumaMarcada = Array.from(areas).some((caixa) => caixa.checked);
    areas[0].setCustomValidity(algumaMarcada ? '' : 'Escolha pelo menos uma área de interesse.');
  }

  areas.forEach((caixa) => caixa.addEventListener('change', validarAreas));
  validarAreas();

  // ---------- 4. Mensagens de erro junto dos campos ----------

  /** Radios e caixas de "áreas" formam um grupo: o erro aparece uma vez, abaixo das opções. */
  function ehGrupo(campo) {
    return campo.type === 'radio' || campo.name === 'areas';
  }

  function camposDoGrupo(campo) {
    return ehGrupo(campo) ? Array.from(form.querySelectorAll(`input[name="${campo.name}"]`)) : [campo];
  }

  /** Texto amigável para cada tipo de problema informado pela Constraint Validation API. */
  function mensagemDeErro(campo) {
    const v = campo.validity;
    if (v.customError) return campo.validationMessage;
    if (v.valueMissing) {
      if (campo.type === 'radio') return 'Escolha uma das opções.';
      if (campo.type === 'checkbox') return 'Para enviar, é preciso concordar com a Política de Privacidade.';
      if (campo.tagName === 'SELECT') return 'Selecione uma opção da lista.';
      return 'Preencha este campo.';
    }
    if (v.typeMismatch) return 'Digite um e-mail válido, como nome@exemplo.com.';
    if (v.patternMismatch) return campo.title || 'Confira o formato do que foi digitado.';
    if (v.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
    if (v.rangeUnderflow) return campo.type === 'date' ? 'Confira o ano de nascimento.' : `O valor mínimo é ${campo.min}.`;
    if (v.rangeOverflow) return campo.type === 'date' ? 'É preciso ter 18 anos ou mais para se cadastrar.' : `O valor máximo é ${campo.max}.`;
    if (v.stepMismatch) return 'Use um número inteiro.';
    if (v.badInput) return campo.type === 'date' ? 'Digite a data completa (dia, mês e ano).' : 'Digite apenas números.';
    return campo.validationMessage;
  }

  /** Onde a mensagem fica: no fim do .campo ou logo abaixo do grupo de opções. */
  function obterElementoDeErro(campo) {
    const chave = ehGrupo(campo) ? campo.name : campo.id;
    let erro = document.getElementById(`erro-${chave}`);
    if (!erro) {
      erro = document.createElement('p');
      erro.className = 'campo__erro';
      erro.id = `erro-${chave}`;
      const destino = ehGrupo(campo) ? campo.closest('.opcoes') : null;
      if (destino) {
        destino.after(erro);
      } else {
        (campo.closest('.campo') || campo.parentElement).append(erro);
      }
    }
    return erro;
  }

  function ligarDescricao(campo, id, ligar) {
    const ids = (campo.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    const novos = ligar ? Array.from(new Set([...ids, id])) : ids.filter((item) => item !== id);
    if (novos.length) {
      campo.setAttribute('aria-describedby', novos.join(' '));
    } else {
      campo.removeAttribute('aria-describedby');
    }
  }

  function mostrarErro(campo) {
    const erro = obterElementoDeErro(campo);
    erro.textContent = mensagemDeErro(campo);
    camposDoGrupo(campo).forEach((item) => {
      item.setAttribute('aria-invalid', 'true');
      ligarDescricao(item, erro.id, true);
    });
    const caixa = campo.closest('.campo');
    if (caixa && !ehGrupo(campo)) {
      caixa.classList.remove('campo--valido');
    }
  }

  function limparErro(campo) {
    const chave = ehGrupo(campo) ? campo.name : campo.id;
    const erro = document.getElementById(`erro-${chave}`);
    if (erro) erro.textContent = '';
    camposDoGrupo(campo).forEach((item) => {
      item.removeAttribute('aria-invalid');
      ligarDescricao(item, `erro-${chave}`, false);
    });
  }

  /** Confere um campo, mostra ou apaga a mensagem e marca os válidos preenchidos. */
  function validarCampo(campo) {
    if (!campo.willValidate) return true;
    const principal = campo.name === 'areas' ? areas[0] : campo;
    const valido = principal.checkValidity();

    if (valido) {
      limparErro(principal);
    } else {
      mostrarErro(principal);
    }

    // Borda verde + ícone de confirmação só em campos de texto/lista preenchidos
    const caixa = campo.closest('.campo');
    if (caixa && !ehGrupo(campo) && campo.type !== 'checkbox') {
      caixa.classList.toggle('campo--valido', valido && campo.value.trim() !== '');
    }
    return valido;
  }

  /** Lista de campos inválidos (um por grupo de radios/caixas). */
  function camposInvalidos() {
    const vistos = new Set();
    return Array.from(form.elements).filter((campo) => {
      if (!campo.willValidate || campo.type === 'submit' || campo.type === 'reset') return false;
      const chave = ehGrupo(campo) ? campo.name : campo.id;
      if (vistos.has(chave)) return false;
      const principal = campo.name === 'areas' ? areas[0] : campo;
      if (principal.validity.valid) return false;
      vistos.add(chave);
      return true;
    });
  }

  /** Nome do campo para o resumo de erros: o rótulo ou a legenda do grupo. */
  function nomeDoCampo(campo) {
    let texto = '';
    if (campo.dataset.nome) {
      texto = campo.dataset.nome; // nome curto definido no HTML (ex.: aceite da LGPD)
    } else if (ehGrupo(campo)) {
      const legenda = campo.closest('fieldset').querySelector('legend');
      texto = legenda ? legenda.textContent : campo.name;
    } else if (campo.labels && campo.labels.length) {
      texto = campo.labels[0].textContent;
    }
    return texto.replace('*', '').trim();
  }

  // ---------- Resumo de erros e mensagem de sucesso ----------

  const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** Leva o foco a um alerta e rola a página até o início dele (suave, se a pessoa permitir). */
  function focarAlerta(alerta) {
    alerta.focus({ preventScroll: true });
    alerta.scrollIntoView({ behavior: menosMovimento.matches ? 'auto' : 'smooth', block: 'start' });
  }

  const resumo = document.getElementById('resumo-erros');
  const listaErros = document.getElementById('lista-erros');
  const tituloResumo = document.getElementById('titulo-resumo-erros');
  const sucesso = document.getElementById('mensagem-sucesso');
  const textoSucesso = document.getElementById('texto-sucesso');

  function mostrarResumo(invalidos) {
    listaErros.innerHTML = '';
    invalidos.forEach((campo) => {
      const alvo = campo.name === 'areas' ? areas[0] : campo;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${alvo.id}`;
      const nome = nomeDoCampo(campo);
      const separador = nome.endsWith('?') ? ' ' : ': '; // evita "participar?: ..."
      link.textContent = `${nome}${separador}${mensagemDeErro(alvo)}`;
      // O link leva o foco direto para o campo com problema
      link.addEventListener('click', (evento) => {
        evento.preventDefault();
        alvo.focus();
      });
      item.append(link);
      listaErros.append(item);
    });
    const total = invalidos.length;
    tituloResumo.textContent = total === 1
      ? 'Falta corrigir 1 campo para enviar:'
      : `Faltam corrigir ${total} campos para enviar:`;
    resumo.hidden = false;
    focarAlerta(resumo);
  }

  function esconderResumo() {
    resumo.hidden = true;
    listaErros.innerHTML = '';
  }

  // ---------- Quando validar ----------

  let tentouEnviar = false;
  const editados = new Set();

  // Enquanto digita: marca o campo como editado e, se já havia erro, confere de novo
  form.addEventListener('input', (evento) => {
    const campo = evento.target;
    editados.add(campo);
    if (!sucesso.hidden) sucesso.hidden = true;
    if (campo.getAttribute('aria-invalid') === 'true' || tentouEnviar) validarCampo(campo);
  });

  // Ao sair do campo: confere se a pessoa já mexeu nele (não acusa erro só por passar com o Tab)
  form.addEventListener('focusout', (evento) => {
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement || campo instanceof HTMLTextAreaElement)) return;
    if (ehGrupo(campo) || campo.type === 'checkbox') return;
    if (editados.has(campo) || tentouEnviar) validarCampo(campo);
  });

  // Radios e caixas de seleção: confere na hora da escolha
  form.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (campo.type === 'radio' || campo.type === 'checkbox') validarCampo(campo);
  });

  // ---------- 5. Envio com estado de carregamento ----------

  const botaoEnviar = document.getElementById('botao-enviar');
  const textoBotao = botaoEnviar.querySelector('.botao__texto');
  let enviando = false;
  let limpezaConfirmada = false;

  function definirCarregando(ativo) {
    enviando = ativo;
    botaoEnviar.classList.toggle('botao--carregando', ativo);
    // aria-disabled (e não disabled) mantém o foco no botão durante o envio
    botaoEnviar.setAttribute('aria-disabled', String(ativo));
    textoBotao.textContent = ativo ? 'Enviando...' : 'Enviar cadastro';
    form.setAttribute('aria-busy', String(ativo));
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // projeto sem servidor: o envio é simulado
    if (enviando) return;
    tentouEnviar = true;
    sucesso.hidden = true;

    const invalidos = camposInvalidos();
    invalidos.forEach(validarCampo);
    if (invalidos.length) {
      mostrarResumo(invalidos);
      return;
    }

    esconderResumo();
    definirCarregando(true);

    // Simula o tempo de resposta de um servidor
    setTimeout(() => {
      const primeiroNome = form.elements.nome.value.trim().split(' ')[0];
      limpezaConfirmada = true; // limpa sem pedir confirmação
      form.reset();
      definirCarregando(false);
      textoSucesso.textContent = `Obrigado, ${primeiroNome}! Recebemos seu cadastro e entraremos em contato em até 5 dias úteis.`;
      sucesso.hidden = false;
      focarAlerta(sucesso);
    }, 1500);
  });

  // ---------- Limpar: confirmação em janela modal + toast ----------

  const modalLimpar = document.getElementById('modal-limpar');

  function formularioPreenchido() {
    return Array.from(form.elements).some((campo) => {
      if (campo.type === 'radio' || campo.type === 'checkbox') return campo.checked;
      if (campo.tagName === 'BUTTON' || campo.tagName === 'FIELDSET') return false;
      return campo.value.trim() !== '';
    });
  }

  function restaurarEstadoInicial() {
    atualizarGrupos();
    validarAreas();
    atualizarContador();
    if (campoCPF) campoCPF.setCustomValidity('');
    if (campoNascimento) campoNascimento.setCustomValidity('');
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
  }

  form.addEventListener('reset', (evento) => {
    // Pede confirmação antes de apagar dados já digitados
    if (!limpezaConfirmada && formularioPreenchido() && interfaceSite.abrirModal(modalLimpar)) {
      evento.preventDefault();
      return;
    }
    limpezaConfirmada = false;
    setTimeout(restaurarEstadoInicial, 0); // espera o navegador terminar de limpar os campos
  });

  if (modalLimpar) {
    modalLimpar.addEventListener('close', () => {
      if (modalLimpar.returnValue !== 'limpar') return;
      limpezaConfirmada = true;
      form.reset();
      sucesso.hidden = true;
      interfaceSite.mostrarToast('Formulário limpo. Você pode começar de novo.');
    });
  }

  // ---------- Ajustes finos ----------

  // Remove espaços extras do nome ("  Ana   Souza " -> "Ana Souza")
  const campoNome = document.getElementById('nome');
  if (campoNome) {
    campoNome.addEventListener('blur', () => {
      campoNome.value = campoNome.value.trim().replace(/\s+/g, ' ');
    });
  }

  // "s/n" vira "S/N"
  const campoNumero = document.getElementById('numero');
  if (campoNumero) {
    campoNumero.addEventListener('input', () => {
      campoNumero.value = campoNumero.value.toUpperCase();
    });
  }

  // Contador de caracteres da motivação
  const motivacao = document.getElementById('motivacao');
  const contador = document.getElementById('contador-motivacao');

  function atualizarContador() {
    if (!motivacao || !contador) return;
    contador.textContent = `${motivacao.value.length} de ${motivacao.maxLength} caracteres.`;
  }

  if (motivacao) {
    motivacao.addEventListener('input', atualizarContador);
    atualizarContador();
  }
})();
