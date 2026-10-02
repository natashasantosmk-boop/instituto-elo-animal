/**
 * Instituto Elo Animal – paginas/projeto.js
 * Detalhe de um projeto (rota dinâmica #/projetos/:id). Uma única view
 * serve para todos os projetos: o id vem da URL, os dados vêm de
 * conteudo.js e o preencher() do sistema de templates completa a tela.
 */
import { projetos } from '../dados/conteudo.js';
import { preencher } from '../core/templates.js';
import { atualizarBotoesFavorito } from '../componentes/favoritos.js';
import { formatarNumero } from '../utils/formatacao.js';

export function montar({ raiz, params }) {
  const posicao = projetos.findIndex((projeto) => projeto.id === params.id);
  if (posicao === -1) return { naoEncontrada: true }; // id inválido: o roteador mostra a 404

  const projeto = projetos[posicao];
  // Anterior e próximo "dão a volta" na lista (o último aponta para o primeiro)
  const anterior = projetos[(posicao - 1 + projetos.length) % projetos.length];
  const proximo = projetos[(posicao + 1) % projetos.length];

  preencher(raiz, {
    ...projeto,
    voluntarios: formatarNumero(projeto.voluntarios),
    bairros: formatarNumero(projeto.bairros),
    linkCadastro: `#/cadastro?tipo=voluntario&area=${projeto.area}`,
    anterior: { titulo: anterior.titulo, link: `#/projetos/${anterior.id}` },
    proximo: { titulo: proximo.titulo, link: `#/projetos/${proximo.id}` },
  });
  atualizarBotoesFavorito(raiz);

  return { titulo: projeto.titulo }; // título da aba: "Castração Solidária | Instituto Elo Animal"
}
