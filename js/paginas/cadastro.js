/**
 * Instituto Elo Animal – paginas/cadastro.js
 * ------------------------------------------------------------
 * Controlador da view "cadastro":
 *  1. máscaras (evento input) e regras de negócio: dígitos do CPF,
 *     idade mínima e pelo menos uma área de interesse;
 *  2. grupos de voluntariado e doação conforme a escolha (evento change);
 *  3. pré-preenchimento pela URL (?tipo=&area=&valor=&campanha=);
 *  4. RASCUNHO AUTOMÁTICO no localStorage (sem o CPF), restaurado ao voltar;
 *  5. envio simulado com estado de carregamento; a inscrição fica salva
 *     no navegador e aparece na Minha área;
 *  6. "Limpar" pede confirmação em janela modal.
 * A exibição dos erros é do componente reutilizável componentes/validacao.js.
 */
import { campanhas } from '../dados/conteudo.js';
import { escolhaDeCampanha } from '../componentes/cartoes.js';
import * as armazenamento from '../core/armazenamento.js';
import { criarValidador } from '../componentes/validacao.js';
import { confirmar } from '../componentes/modal.js';
import { mostrarToast } from '../componentes/toast.js';
import { mascarasPorCampo } from '../utils/mascaras.js';
import { cpfValido, dataMaximaNascimento } from '../utils/validacoes.js';
import { formatarDataHora } from '../utils/formatacao.js';
import { $, debounce, focarElemento, emitir } from '../utils/dom.js';

const CHAVE_RASCUNHO = armazenamento.CHAVES.rascunho;
const CHAVE_INSCRICOES = armazenamento.CHAVES.inscricoes;
const VALIDADE_DO_RASCUNHO = 7; // dias
const LIMITE_DE_INSCRICOES = 20;
const TEMPO_DE_ENVIO = 1500; // ms (simula a resposta de um servidor)
// LGPD (minimização): o CPF nunca vai para o navegador e o aceite deve ser renovado a cada envio
const FORA_DO_RASCUNHO = new Set(['cpf', 'lgpd', 'campanha']);

const ignorar = (campo) => !campo.name || ['submit', 'reset', 'button'].includes(campo.type) || campo.tagName === 'FIELDSET';

/** Formulário -> objeto simples: { nome: "Ana", areas: ["castracao"], novidades: true } */
export function serializarFormulario(form, excluir = new Set()) {
  const dados = {};
  for (const campo of form.elements) {
    if (ignorar(campo) || excluir.has(campo.name)) continue;
    if (campo.type === 'radio') {
      if (campo.checked) dados[campo.name] = campo.value;
    } else if (campo.type === 'checkbox') {
      const grupo = form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(campo.name)}"]`);
      if (grupo.length > 1) {
        dados[campo.name] ??= [];
        if (campo.checked) dados[campo.name].push(campo.value);
      } else {
        dados[campo.name] = campo.checked;
      }
    } else {
      dados[campo.name] = campo.value;
    }
  }
  return dados;
}

/** Objeto -> formulário. Devolve os campos que receberam algum valor. */
export function preencherFormulario(form, dados) {
  const preenchidos = [];
  for (const campo of form.elements) {
    if (ignorar(campo) || !(campo.name in dados)) continue;
    const valor = dados[campo.name];
    if (campo.type === 'radio') {
      campo.checked = campo.value === valor;
      if (campo.checked) preenchidos.push(campo);
    } else if (campo.type === 'checkbox') {
      campo.checked = Array.isArray(valor) ? valor.includes(campo.value) : valor === true;
      if (campo.checked) preenchidos.push(campo);
    } else if (typeof valor === 'string' && valor !== '') {
      campo.value = valor; // num <select>, um valor que não existe nas opções vira ""
      if (campo.value !== '') preenchidos.push(campo);
    }
  }
  return preenchidos;
}

const temConteudo = (dados) => Object.values(dados).some((valor) => (
  Array.isArray(valor) ? valor.length > 0 : typeof valor === 'boolean' ? valor : String(valor).trim() !== ''
));

/** Monta o resumo que fica na Minha área (sem CPF, telefone ou endereço completo). */
function criarInscricao(dados) {
  const voluntario = dados.participacao === 'voluntario' || dados.participacao === 'ambos';
  const doador = dados.participacao === 'doador' || dados.participacao === 'ambos';
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    enviadaEm: Date.now(),
    participacao: dados.participacao,
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    cidade: `${dados.cidade.trim()} – ${dados.uf}`,
    areas: voluntario ? dados.areas : [],
    disponibilidade: voluntario ? dados.disponibilidade : null,
    horas: voluntario ? Number(dados.horas) : null,
    doacao: doador ? {
      valor: Number(dados.valor), frequencia: dados.frequencia, pagamento: dados.pagamento, campanha: dados.campanha || null,
    } : null,
    novidades: dados.novidades === true,
  };
}

function salvarInscricao(inscricao) {
  const lista = armazenamento.ler(CHAVE_INSCRICOES, []);
  const atualizada = [inscricao, ...(Array.isArray(lista) ? lista : [])].slice(0, LIMITE_DE_INSCRICOES);
  const salvou = armazenamento.salvar(CHAVE_INSCRICOES, atualizada);
  emitir('inscricoes:alteradas', { total: atualizada.length });
  return salvou;
}

const esperar = (ms) => new Promise((resolver) => { setTimeout(resolver, ms); });

export function montar({ raiz, consulta, sinal }) {
  const form = $('#form-cadastro', raiz);
  const campos = form.elements;
  const grupoVoluntario = $('#grupo-voluntario', raiz);
  const grupoDoador = $('#grupo-doador', raiz);
  const areas = Array.from(form.querySelectorAll('input[name="areas"]'));
  const sucesso = $('#mensagem-sucesso', raiz);
  const avisoRascunho = $('[data-aviso-rascunho]', raiz);
  const statusRascunho = $('[data-status-rascunho]', raiz);
  const botaoEnviar = $('#botao-enviar', raiz);
  const opcoes = { signal: sinal };

  // ---------- 1. Máscaras e regras de negócio (antes do validador: rodam primeiro) ----------
  form.addEventListener('input', (evento) => {
    const campo = evento.target;
    if (mascarasPorCampo[campo.id]) campo.value = mascarasPorCampo[campo.id](campo.value);
    if (campo.id === 'numero') campo.value = campo.value.toUpperCase(); // "s/n" -> "S/N"
    if (campo.id === 'cpf') {
      campo.setCustomValidity('');
      // Só confere os dígitos quando o formato já está completo
      if (campo.validity.valid && !cpfValido(campo.value)) campo.setCustomValidity('CPF inválido: confira os números digitados.');
    }
  }, opcoes);

  campos.nascimento.max = dataMaximaNascimento(18); // o limite acompanha a data de hoje

  campos.nome.addEventListener('blur', () => {
    campos.nome.value = campos.nome.value.trim().replace(/\s+/g, ' '); // "  Ana   Souza " -> "Ana Souza"
  }, opcoes);

  function validarAreas() {
    const algumaMarcada = areas.some((caixa) => caixa.checked);
    areas[0].setCustomValidity(algumaMarcada ? '' : 'Escolha pelo menos uma área de interesse.');
  }
  areas.forEach((caixa) => caixa.addEventListener('change', validarAreas, opcoes));

  const contador = $('#contador-motivacao', raiz);
  function atualizarContador() {
    contador.textContent = `${campos.motivacao.value.length} de ${campos.motivacao.maxLength} caracteres.`;
  }
  campos.motivacao.addEventListener('input', atualizarContador, opcoes);

  // ---------- 2. Grupos conforme a forma de participação ----------
  function alternarGrupo(grupo, ativo) {
    grupo.hidden = !ativo;
    grupo.disabled = !ativo; // fieldset desabilitado não é validado nem enviado
  }
  function atualizarGrupos() {
    const opcao = form.querySelector('input[name="participacao"]:checked')?.value || '';
    alternarGrupo(grupoVoluntario, opcao === 'voluntario' || opcao === 'ambos');
    alternarGrupo(grupoDoador, opcao === 'doador' || opcao === 'ambos');
  }
  form.querySelectorAll('input[name="participacao"]').forEach((radio) => radio.addEventListener('change', atualizarGrupos, opcoes));

  // Validação visual (componente reutilizável)
  const validador = criarValidador(form, {
    resumo: $('#resumo-erros', raiz),
    listaErros: $('#lista-erros', raiz),
    tituloResumo: $('#titulo-resumo-erros', raiz),
    sinal,
  });

  // ---------- 3 e 4. Rascunho salvo + parâmetros da URL ----------
  const rascunho = armazenamento.lerComData(CHAVE_RASCUNHO);
  if (rascunho && temConteudo(rascunho.valor)) {
    validador.marcarEditados(preencherFormulario(form, rascunho.valor));
    $('[data-texto-rascunho]', raiz).textContent = `Recuperamos o que você digitou em ${formatarDataHora(rascunho.salvoEm)}. `
      + 'Confira os dados e informe o CPF de novo (ele não fica salvo).';
    avisoRascunho.hidden = false;
  }

  const tipo = consulta.get('tipo');
  if (['voluntario', 'doador', 'ambos'].includes(tipo)) campos.participacao.value = tipo;
  const area = consulta.get('area');
  const caixaDaArea = areas.find((caixa) => caixa.value === area);
  if (caixaDaArea) caixaDaArea.checked = true;
  const valor = Number(consulta.get('valor'));
  if (valor >= 10 && valor <= 10000) campos.valor.value = String(Math.round(valor));
  const campanha = campanhas.find((item) => item.id === consulta.get('campanha'));
  if (campanha) {
    // Link antigo de campanha já encerrada: avisa e não vincula a doação a ela
    const { vincular, texto } = escolhaDeCampanha(campanha);
    if (vincular) campos.campanha.value = campanha.id;
    const aviso = $('[data-campanha-escolhida]', raiz);
    aviso.textContent = texto;
    aviso.hidden = false;
  }

  atualizarGrupos();
  validarAreas();
  atualizarContador();

  // Salva 0,5 s depois da última digitação (não grava a cada tecla)
  const salvarRascunho = debounce(() => {
    const dados = serializarFormulario(form, FORA_DO_RASCUNHO);
    if (!temConteudo(dados)) {
      armazenamento.remover(CHAVE_RASCUNHO);
      statusRascunho.textContent = '';
      return;
    }
    const salvou = armazenamento.salvar(CHAVE_RASCUNHO, dados, { validadeDias: VALIDADE_DO_RASCUNHO });
    statusRascunho.textContent = salvou
      ? `Rascunho salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
      : 'Não foi possível salvar o rascunho neste navegador.';
  }, 500);
  form.addEventListener('input', salvarRascunho, opcoes);
  form.addEventListener('change', salvarRascunho, opcoes);
  sinal.addEventListener('abort', () => salvarRascunho.cancelar());

  // ---------- 5. Envio ----------
  let enviando = false;
  let limpezaConfirmada = false;

  function definirCarregando(ativo) {
    enviando = ativo;
    botaoEnviar.classList.toggle('botao--carregando', ativo);
    botaoEnviar.setAttribute('aria-disabled', String(ativo)); // mantém o foco no botão
    $('.botao__texto', botaoEnviar).textContent = ativo ? 'Enviando...' : 'Enviar cadastro';
    form.setAttribute('aria-busy', String(ativo));
  }

  function restaurarEstadoInicial() {
    atualizarGrupos();
    validarAreas();
    atualizarContador();
    campos.cpf.setCustomValidity('');
    validador.reiniciar();
    statusRascunho.textContent = '';
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // sem servidor: o envio é simulado
    if (enviando) return;
    sucesso.hidden = true;
    if (!validador.validarTudo()) return;

    salvarRascunho.cancelar();
    definirCarregando(true);
    await esperar(TEMPO_DE_ENVIO);

    const inscricao = criarInscricao(serializarFormulario(form));
    salvarInscricao(inscricao);
    armazenamento.remover(CHAVE_RASCUNHO);
    if (sinal.aborted) { // a pessoa trocou de página durante o envio
      mostrarToast('Seu cadastro foi enviado.');
      return;
    }

    limpezaConfirmada = true; // limpa sem pedir confirmação
    form.reset();
    definirCarregando(false);
    avisoRascunho.hidden = true;
    const primeiroNome = inscricao.nome.split(' ')[0];
    $('#texto-sucesso', raiz).textContent = `Obrigado, ${primeiroNome}! Recebemos seu cadastro e entraremos em contato em até 5 dias úteis.`;
    sucesso.hidden = false;
    focarElemento(sucesso);
  }, opcoes);

  // ---------- 6. Limpar e descartar rascunho ----------
  function formularioPreenchido() {
    return temConteudo(serializarFormulario(form, new Set(['campanha'])));
  }

  form.addEventListener('reset', async (evento) => {
    if (limpezaConfirmada || !formularioPreenchido()) {
      limpezaConfirmada = false;
      setTimeout(restaurarEstadoInicial, 0); // espera o navegador terminar de limpar
      return;
    }
    evento.preventDefault(); // antes do await: segura a limpeza até a resposta
    const confirmado = await confirmar({
      titulo: 'Limpar o formulário?',
      texto: 'Todos os dados preenchidos e o rascunho salvo serão apagados. Essa ação não pode ser desfeita.',
      rotuloConfirmar: 'Sim, limpar tudo',
      rotuloCancelar: 'Continuar preenchendo',
    });
    if (!confirmado || sinal.aborted) return;
    limpezaConfirmada = true;
    form.reset();
    armazenamento.remover(CHAVE_RASCUNHO);
    sucesso.hidden = true;
    avisoRascunho.hidden = true;
    mostrarToast('Formulário limpo. Você pode começar de novo.');
  }, opcoes);

  $('[data-descartar-rascunho]', raiz).addEventListener('click', () => {
    armazenamento.remover(CHAVE_RASCUNHO);
    limpezaConfirmada = true;
    form.reset();
    avisoRascunho.hidden = true;
    mostrarToast('Rascunho descartado.');
    campos.participacao[0].focus();
  }, opcoes);
}
