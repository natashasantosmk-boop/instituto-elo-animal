/*
 * Instituto Elo Animal – cadastro.js
 * ------------------------------------------------------------
 * Complementa a validação nativa do HTML5 do formulário de cadastro:
 *  1. Máscaras de entrada para CPF, telefone e CEP;
 *  2. Verificação dos dígitos do CPF;
 *  3. Idade mínima de 18 anos;
 *  4. Exibição dos campos de voluntariado e/ou doação conforme a escolha;
 *  5. Pelo menos uma área de interesse para voluntários;
 *  6. Contador de caracteres e mensagem de confirmação.
 *
 * Tudo usa a Constraint Validation API (setCustomValidity), então os
 * avisos aparecem nos mesmos balões de erro nativos do navegador.
 */
'use strict';

(function () {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

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

  // ---------- 2. Validação dos dígitos verificadores do CPF ----------

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

  // ---------- 3. Idade mínima de 18 anos ----------

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

  // ---------- 4. Mostrar só os grupos que fazem sentido ----------

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

  // ---------- 5. Pelo menos uma área de interesse ----------

  const areas = form.querySelectorAll('input[name="areas"]');

  function validarAreas() {
    if (areas.length === 0) return;
    const algumaMarcada = Array.from(areas).some((caixa) => caixa.checked);
    areas[0].setCustomValidity(algumaMarcada ? '' : 'Escolha pelo menos uma área de interesse.');
  }

  areas.forEach((caixa) => caixa.addEventListener('change', validarAreas));
  validarAreas();

  // ---------- 6. Ajustes finos, contador e envio ----------

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

  const mensagem = document.getElementById('mensagem-form');

  // O evento "submit" só acontece quando TODOS os campos passam na validação nativa
  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // projeto sem servidor: o envio é simulado
    const primeiroNome = form.elements.nome.value.trim().split(' ')[0];
    form.reset();
    mensagem.textContent = `Obrigado, ${primeiroNome}! Recebemos seu cadastro e entraremos em contato em até 5 dias úteis.`;
    mensagem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Depois de limpar o formulário, volta tudo ao estado inicial
  form.addEventListener('reset', () => {
    setTimeout(() => {
      atualizarGrupos();
      validarAreas();
      atualizarContador();
      if (campoCPF) campoCPF.setCustomValidity('');
      if (campoNascimento) campoNascimento.setCustomValidity('');
    }, 0);
  });

  // Ao começar a preencher de novo, some a mensagem antiga
  form.addEventListener('input', () => {
    if (mensagem.textContent) mensagem.textContent = '';
  });
})();
