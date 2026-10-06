/**
 * Instituto Elo Animal – core/ambiente.js
 * Diferença entre desenvolvimento e produção num lugar só.
 * No código-fonte vale PRODUCAO = false. O build (scripts/build.mjs) troca
 * este arquivo por "export const PRODUCAO = true", e o esbuild elimina os
 * trechos que só servem ao desenvolvimento.
 */
export const PRODUCAO = false;
