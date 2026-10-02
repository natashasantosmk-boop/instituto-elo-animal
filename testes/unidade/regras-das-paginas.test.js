// Regras de negócio que ficam nos controladores das páginas (funções puras exportadas)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projetos, campanhas } from '../../js/dados/conteudo.js';
import { filtrarProjetos } from '../../js/paginas/projetos.js';
import { calcularImpacto } from '../../js/paginas/doacoes.js';
import { textoDaContagem } from '../../js/paginas/inicio.js';
import { situacaoDaCampanha, escolhaDeCampanha } from '../../js/componentes/cartoes.js';

const filtro = (opcoes) => ({ busca: '', categoria: '', ordem: 'titulo', favoritos: false, ...opcoes });
const ids = (lista) => lista.map((projeto) => projeto.id);

test('busca ignora acentos e exige todas as palavras', () => {
  assert.deepEqual(ids(filtrarProjetos(projetos, filtro({ busca: 'ADOÇÃO' }))), ['adote-um-amigo']);
  assert.equal(filtrarProjetos(projetos, filtro({ busca: 'gatos escola' })).length, 0);
  assert.equal(filtrarProjetos(projetos, filtro({ busca: 'gato' })).length, 3);
});

test('filtro por categoria, ordem e favoritos', () => {
  assert.deepEqual(ids(filtrarProjetos(projetos, filtro({ categoria: 'educacao' }))), ['educar-para-cuidar']);
  assert.equal(filtrarProjetos(projetos, filtro({ ordem: 'voluntarios' }))[0].id, 'castracao-solidaria');
  assert.deepEqual(ids(filtrarProjetos(projetos, filtro({ favoritos: true }), ['clinica-social'])), ['clinica-social']);
});

test('filtrarProjetos não altera a lista original (sort em cópia)', () => {
  const antes = ids(projetos);
  filtrarProjetos(projetos, filtro({ ordem: 'bairros' }));
  assert.deepEqual(ids(projetos), antes);
});

test('simulador: R$ 60 pagam 2 vacinas e 1 consulta; falta R$ 60 para 1 castração', () => {
  const [vacina, consulta, castracao, racao] = calcularImpacto(60);
  assert.equal(vacina.quantidade, '2');
  assert.equal(consulta.quantidade, '1');
  assert.equal(consulta.descricao, 'consulta na Clínica Social');
  assert.match(castracao.quantidade.replace(/ /g, ' '), /^\+ R\$ 60$/);
  assert.equal(racao.quantidade, '7');
});

test('situação da campanha calculada pela data de hoje', () => {
  const hoje = new Date(2026, 9, 1);
  const vacina = situacaoDaCampanha(campanhas.find((c) => c.id === 'vacina-solidaria'), hoje);
  assert.equal(vacina.aberta, true);
  assert.equal(vacina.texto, 'Faltam 75 dias');
  const gatil = situacaoDaCampanha(campanhas.find((c) => c.id === 'reforma-gatil'), hoje);
  assert.equal(gatil.aberta, false);
  assert.equal(gatil.texto, 'Meta atingida');
  const ultimoDia = situacaoDaCampanha({ prazo: '2026-10-01', meta: 10, arrecadado: 1 }, hoje);
  assert.equal(ultimoDia.texto, 'Último dia');
});

test('link antigo de campanha encerrada não vincula a doação (hotfix 3.0.1)', () => {
  const hoje = new Date(2026, 9, 2);
  const vacina = escolhaDeCampanha(campanhas.find((c) => c.id === 'vacina-solidaria'), hoje);
  assert.equal(vacina.vincular, true);
  assert.equal(vacina.texto, 'Sua doação vai para a campanha Vacina Solidária.');
  const gatil = escolhaDeCampanha(campanhas.find((c) => c.id === 'reforma-gatil'), hoje);
  assert.equal(gatil.vincular, false);
  assert.match(gatil.texto, /já atingiu a meta e foi encerrada.*fundo geral/);
  const vencida = escolhaDeCampanha({ titulo: 'Inverno', prazo: '2026-07-31', meta: 100, arrecadado: 40 }, hoje);
  assert.equal(vencida.vincular, false);
  assert.match(vencida.texto, /foi encerrada em 31 de julho de 2026/);
});

test('contagem do mutirão antes, durante e depois do evento (hotfix 3.0.1)', () => {
  const evento = { inicio: '2026-10-17T08:00:00-03:00', fim: '2026-10-17T16:00:00-03:00' };
  const antes = textoDaContagem(evento, new Date('2026-10-15T06:30:00-03:00').getTime());
  assert.equal(antes.texto, 'Faltam 2 dias, 1 hora e 30 minutos.');
  assert.equal(antes.encerrado, false);
  const durante = textoDaContagem(evento, new Date('2026-10-17T10:00:00-03:00').getTime());
  assert.match(durante.texto, /acontecendo agora/);
  const depois = textoDaContagem(evento, new Date('2026-10-18T09:00:00-03:00').getTime());
  assert.equal(depois.encerrado, true);
  assert.match(depois.texto, /já aconteceu/);
});
