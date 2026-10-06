/**
 * Instituto Elo Animal – paginas/minha-area.js
 * Painel dos dados guardados no navegador (localStorage):
 *  - inscrições enviadas pelo cadastro (com exclusão individual);
 *  - projetos favoritos;
 *  - preferências de exibição (tamanho do texto e animações);
 *  - portabilidade e exclusão (LGPD): baixar tudo em JSON ou apagar tudo.
 * A tela se atualiza com os eventos próprios do site e também quando
 * outra aba aberta muda os dados (evento "storage").
 */
import { projetos, areasVoluntariado, campanhas } from '../dados/conteudo.js';
import * as armazenamento from '../core/armazenamento.js';
import { renderizarLista } from '../core/templates.js';
import { listarFavoritos } from '../componentes/favoritos.js';
import { aplicarPreferencias, lerPreferencias, salvarPreferencia } from '../componentes/preferencias.js';
import { confirmar } from '../componentes/modal.js';
import { mostrarToast } from '../componentes/toast.js';
import { formatarDataHora, formatarMoeda, pluralizar } from '../utils/formatacao.js';
import { $, emitir, focarElemento } from '../utils/dom.js';

const { CHAVES } = armazenamento;
const TIPOS = { voluntario: 'Voluntariado', doador: 'Doação', ambos: 'Voluntariado e doação' };
const FREQUENCIAS = { mensal: 'mensal', unica: 'única' };
const ROTULOS = {
  tema: { automatico: 'tema automático', claro: 'tema claro', escuro: 'tema escuro' },
  fonte: { padrao: 'texto padrão', grande: 'texto grande', maior: 'texto maior' },
  movimento: { padrao: 'animações ligadas', reduzido: 'animações reduzidas' },
};

/** Inscrições válidas (um dado editado à mão no navegador não quebra a tela). */
function lerInscricoes() {
  const lista = armazenamento.ler(CHAVES.inscricoes, []);
  return Array.isArray(lista) ? lista.filter((item) => item && item.id && TIPOS[item.participacao]) : [];
}

function modeloInscricao(inscricao) {
  const campanha = campanhas.find((item) => item.id === inscricao.doacao?.campanha);
  const envio = formatarDataHora(inscricao.enviadaEm);
  return {
    id: inscricao.id,
    idTitulo: `inscricao-${inscricao.id}`,
    tipo: TIPOS[inscricao.participacao],
    dataEnvio: `Enviada em ${envio}`,
    nome: inscricao.nome,
    email: inscricao.email,
    cidade: inscricao.cidade,
    areas: (inscricao.areas || []).map((area) => areasVoluntariado[area] || area).join(', '),
    doacao: inscricao.doacao
      ? `${formatarMoeda(inscricao.doacao.valor)} (${FREQUENCIAS[inscricao.doacao.frequencia] || 'única'})${campanha ? ` para ${campanha.titulo}` : ''}`
      : '',
    rotuloExcluir: `Excluir a inscrição enviada em ${envio}`,
  };
}

/** Gera e baixa um arquivo JSON com tudo o que o site guardou neste navegador. */
function baixarDados() {
  const dados = Object.fromEntries(armazenamento.chaves().map((chave) => [chave, armazenamento.ler(chave)]));
  const conteudo = JSON.stringify({ site: 'Instituto Elo Animal', exportadoEm: new Date().toISOString(), dados }, null, 2);
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'meus-dados-instituto-elo-animal.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function montar({ raiz, sinal }) {
  const opcoes = { signal: sinal };
  const listaInscricoes = $('[data-lista-inscricoes]', raiz);
  const listaFavoritos = $('[data-lista-favoritos]', raiz);
  const formPreferencias = $('[data-preferencias]', raiz);

  if (!armazenamento.disponivel()) $('[data-sem-armazenamento]', raiz).hidden = false;

  function mostrarInscricoes() {
    const inscricoes = lerInscricoes();
    renderizarLista(listaInscricoes, 'tpl-inscricao', inscricoes.map(modeloInscricao));
    $('[data-sem-inscricoes]', raiz).hidden = inscricoes.length > 0;
    $('[data-total-inscricoes]', raiz).textContent = inscricoes.length ? `(${inscricoes.length})` : '';
  }

  function mostrarFavoritos() {
    const ids = listarFavoritos();
    const favoritos = projetos.filter((projeto) => ids.includes(projeto.id)).map((projeto) => ({
      id: projeto.id,
      titulo: projeto.titulo,
      link: `#/projetos/${projeto.id}`,
      rotuloFavorito: `Favoritar ${projeto.titulo}`,
    }));
    renderizarLista(listaFavoritos, 'tpl-favorito', favoritos);
    $('[data-sem-favoritos]', raiz).hidden = favoritos.length > 0;
  }

  function mostrarPreferencias() {
    const preferencias = lerPreferencias();
    Object.entries(preferencias).forEach(([nome, valor]) => { formPreferencias.elements[nome].value = valor; });
  }

  function mostrarTudo() {
    mostrarInscricoes();
    mostrarFavoritos();
    mostrarPreferencias();
  }

  // Excluir uma inscrição (delegação: os botões são recriados a cada renderização)
  listaInscricoes.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-excluir-inscricao]');
    if (!botao) return;
    const confirmado = await confirmar({
      titulo: 'Excluir esta inscrição?',
      texto: 'O resumo será apagado deste navegador. Se quiser cancelar o cadastro na ONG, escreva para contato@institutoeloanimal.org.br.',
      rotuloConfirmar: 'Sim, excluir',
    });
    if (!confirmado || sinal.aborted) return;
    armazenamento.salvar(CHAVES.inscricoes, lerInscricoes().filter((item) => item.id !== botao.dataset.id));
    emitir('inscricoes:alteradas');
    mostrarToast('Inscrição excluída deste navegador.');
    focarElemento($('#titulo-inscricoes', raiz)); // o botão clicado deixou de existir
  }, opcoes);

  // Preferências: valem na hora (evento change) e ficam salvas
  formPreferencias.addEventListener('change', (evento) => {
    const { name, value } = evento.target;
    if (salvarPreferencia(name, value)) mostrarToast(`Preferência salva: ${ROTULOS[name][value]}.`);
    else mostrarToast('A preferência foi aplicada, mas não pôde ser salva neste navegador.');
  }, opcoes);

  $('[data-baixar-dados]', raiz).addEventListener('click', () => {
    baixarDados();
    mostrarToast('Arquivo meus-dados-instituto-elo-animal.json gerado.');
  }, opcoes);

  $('[data-apagar-dados]', raiz).addEventListener('click', async () => {
    const total = armazenamento.chaves().length + armazenamento.sessao.chaves().length;
    if (!total) {
      mostrarToast('Não há dados do site guardados neste navegador.');
      return;
    }
    const confirmado = await confirmar({
      titulo: 'Apagar todos os seus dados?',
      texto: `Vamos apagar ${pluralizar(total, 'item guardado', 'itens guardados')} neste navegador: rascunho, inscrições, favoritos, preferências e filtros. Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Sim, apagar tudo',
    });
    if (!confirmado || sinal.aborted) return;
    armazenamento.limparTudo();
    armazenamento.sessao.limparTudo();
    aplicarPreferencias();
    emitir('favoritos:alterados');
    emitir('inscricoes:alteradas');
    emitir('preferencias:alteradas', lerPreferencias());
    mostrarToast('Pronto! Todos os seus dados foram apagados deste navegador.');
  }, opcoes);

  // Mudanças feitas nesta aba (por outros módulos) ou em outra aba aberta
  document.addEventListener('inscricoes:alteradas', mostrarInscricoes, opcoes);
  document.addEventListener('preferencias:alteradas', mostrarPreferencias, opcoes);
  document.addEventListener('favoritos:alterados', () => {
    // Desfavoritar aqui remove o item da lista: o foco vai para o título da seção
    const focoNaLista = listaFavoritos.contains(document.activeElement);
    mostrarFavoritos();
    if (focoNaLista) focarElemento($('#titulo-favoritos', raiz), { rolar: false });
  }, opcoes);
  armazenamento.aoAlterarEmOutraAba(null, mostrarTudo, sinal);

  mostrarTudo();
}
