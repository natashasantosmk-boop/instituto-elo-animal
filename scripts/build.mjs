/**
 * Instituto Elo Animal – scripts/build.mjs
 * ------------------------------------------------------------
 * Gera a versão de PRODUÇÃO do site na pasta dist/ (é ela que vai para o
 * GitHub Pages). O código-fonte continua legível e comentado; o build:
 *  1. JavaScript: junta os módulos com o esbuild, minifica e divide o código
 *     (code splitting): o main.js leva só o que toda página usa e cada
 *     controlador de página vira um pedaço baixado sob demanda. Os nomes
 *     levam um hash do conteúdo (cache busting) e há source maps;
 *  2. Chart.js: versão enxuta só com os gráficos usados (tree-shaking),
 *     servida pelo próprio site, sem depender da CDN;
 *  3. CSS: os 5 arquivos do design system viram 1 só, minificado pelo
 *     Lightning CSS com prefixos para os navegadores-alvo;
 *  4. HTML: index, views e moldes minificados (comentários e espaços);
 *     o index ganha <link rel="modulepreload"> e preload dos moldes;
 *  5. Imagens: SVG otimizados com o SVGO e PNG recomprimidos com o sharp;
 *  6. 404.html: quem digitar um caminho (/projetos) cai na rota #/projetos.
 * No fim, mostra uma tabela com o tamanho antes e depois (bruto e gzip).
 *
 * Uso: npm run build   (variável opcional BASE_PATH, padrão "/")
 */
import { build } from 'esbuild';
import { transform as transformarCss } from 'lightningcss';
import { minify as minificarHtml } from 'html-minifier-terser';
import { optimize as otimizarSvg } from 'svgo';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'dist');
const BASE = process.env.BASE_PATH || '/';
const ALVOS_JS = ['es2020', 'chrome90', 'edge90', 'firefox90', 'safari15'];
// Lightning CSS recebe as versões no formato (maior << 16) | (menor << 8)
const ALVOS_CSS = { chrome: 90 << 16, edge: 90 << 16, firefox: 90 << 16, safari: 15 << 16, ios_saf: 15 << 16 };
const CSS_NA_ORDEM = ['variaveis', 'base', 'layout', 'componentes', 'utilitarios'];
const OPCOES_HTML = {
  collapseWhitespace: true,
  conservativeCollapse: true, // mantém um espaço entre elementos de linha (ex.: <strong>Telefone:</strong> <a>)
  removeComments: true,
  collapseBooleanAttributes: true,
  minifyJS: true, // o script curto do <head>
};

const relatorio = [];
const hash = (conteudo) => createHash('sha256').update(conteudo).digest('hex').slice(0, 8);
const ler = (arquivo) => fs.readFile(path.join(RAIZ, arquivo));

async function escrever(destino, conteudo, origem = null, tipo = path.extname(destino).slice(1)) {
  const alvo = path.join(SAIDA, destino);
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  await fs.writeFile(alvo, conteudo);
  if (origem !== false && !destino.endsWith('.map')) {
    const antes = origem ? Buffer.concat(await Promise.all([].concat(origem).map(ler))) : null;
    relatorio.push({ tipo, destino, antes, depois: Buffer.from(conteudo) });
  }
}

/** Troca core/ambiente.js por PRODUCAO = true (o esbuild elimina o código de desenvolvimento). */
const ambienteDeProducao = {
  name: 'ambiente-de-producao',
  setup(construtor) {
    construtor.onLoad({ filter: /[\\/]js[\\/]core[\\/]ambiente\.js$/ }, () => ({
      contents: 'export const PRODUCAO = true;',
      loader: 'js',
    }));
  },
};

async function construirJavaScript() {
  const resultado = await build({
    absWorkingDir: RAIZ,
    entryPoints: ['js/main.js'],
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    sourcemap: 'linked',
    target: ALVOS_JS,
    outdir: 'dist/js',
    entryNames: '[name]-[hash]',
    chunkNames: 'partes/[name]-[hash]',
    legalComments: 'none',
    metafile: true,
    write: false,
    plugins: [ambienteDeProducao],
  });
  const fontes = Object.keys(resultado.metafile.inputs);
  let principal = '';
  const preCarregar = [];
  for (const arquivo of resultado.outputFiles) {
    const relativo = path.relative(SAIDA, arquivo.path).split(path.sep).join('/');
    const saida = resultado.metafile.outputs[path.relative(RAIZ, arquivo.path).split(path.sep).join('/')];
    if (saida?.entryPoint === 'js/main.js') {
      principal = relativo;
      // pedaços que o main.js importa de forma estática: baixados em paralelo com ele
      preCarregar.push(...saida.imports.filter((i) => i.kind === 'import-statement')
        .map((i) => path.relative('dist', i.path).split(path.sep).join('/')));
    }
    const origem = relativo.endsWith('.map') ? false : null;
    await escrever(relativo, arquivo.contents, origem, 'js');
  }
  // o relatório compara o total de JS: todos os módulos do código-fonte x todos os pedaços gerados
  relatorio.push({ tipo: 'js-fonte', antes: Buffer.concat(await Promise.all(fontes.map(ler))) });
  return { principal, preCarregar };
}

async function construirChartJs() {
  const versao = JSON.parse(await ler('node_modules/chart.js/package.json')).version;
  // o carregador (js/core/bibliotecas.js) pede exatamente esta versão: se divergir, o build para
  if (!(await ler('js/core/bibliotecas.js')).toString().includes(`VERSAO_CHART_JS = '${versao}'`)) {
    throw new Error(`chart.js ${versao} instalado não é a versão de js/core/bibliotecas.js`);
  }
  const destino = `js/vendor/chart-${versao}.min.js`;
  const resultado = await build({
    absWorkingDir: RAIZ,
    entryPoints: ['scripts/chart-enxuto.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ALVOS_JS,
    legalComments: 'eof',
    write: false,
  });
  await escrever(destino, resultado.outputFiles[0].contents, 'js/vendor/chart.umd.min.js', 'chart.js');
  await fs.copyFile(path.join(RAIZ, 'js/vendor/chart.js-LICENSE.md'), path.join(SAIDA, 'js/vendor/chart.js-LICENSE.md'));
  return destino;
}

async function construirCss() {
  const arquivos = CSS_NA_ORDEM.map((nome) => `css/${nome}.css`);
  const juntos = (await Promise.all(arquivos.map(ler))).join('\n');
  const { code } = transformarCss({ filename: 'estilo.css', code: Buffer.from(juntos), minify: true, targets: ALVOS_CSS });
  const destino = `css/estilo-${hash(code)}.min.css`;
  await escrever(destino, code, arquivos, 'css');
  return destino;
}

async function construirHtml({ css, js, preCarregar, chart }) {
  let index = (await ler('index.html')).toString();
  // 5 <link rel="stylesheet"> viram 1
  const links = CSS_NA_ORDEM.map((nome) => `  <link rel="stylesheet" href="css/${nome}.css">\n`);
  links.forEach((link) => {
    if (!index.includes(link)) throw new Error(`index.html sem a linha esperada: ${link}`);
  });
  index = index.replace(links.join(''), `  <link rel="stylesheet" href="${css}">\n`);
  links.forEach((link) => { index = index.replace(link, ''); });
  const scriptOriginal = '<script type="module" src="js/main.js"></script>';
  if (!index.includes(scriptOriginal)) throw new Error('index.html sem o script principal');
  const dicas = [
    ...preCarregar.map((parte) => `<link rel="modulepreload" href="${parte}">`),
    '<link rel="preload" href="html/componentes.html" as="fetch" crossorigin>',
  ].join('\n  ');
  index = index.replace(scriptOriginal, `<script type="module" src="${js}"></script>\n  ${dicas}`);
  await escrever('index.html', await minificarHtml(index, OPCOES_HTML), 'index.html', 'html');

  const views = (await fs.readdir(path.join(RAIZ, 'html/views'))).filter((nome) => nome.endsWith('.html'));
  for (const arquivo of ['html/componentes.html', ...views.map((nome) => `html/views/${nome}`)]) {
    const html = (await ler(arquivo)).toString();
    await escrever(arquivo, await minificarHtml(html, OPCOES_HTML), arquivo, 'html');
  }

  // GitHub Pages devolve o 404.html para caminhos que não existem: /projetos vira #/projetos
  const pagina404 = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Redirecionando… | Instituto Elo Animal</title><script>(function(){var base=${JSON.stringify(BASE)};var caminho=location.pathname.indexOf(base)===0?location.pathname.slice(base.length):location.pathname.slice(1);location.replace(base+'#/'+caminho.replace(/\\/+$/,'')+location.search);})();</script></head><body><p>Página não encontrada. <a href="${BASE}">Ir para o início do Instituto Elo Animal</a>.</p></body></html>`;
  await escrever('404.html', pagina404, false);
  return chart;
}

async function otimizarImagens() {
  async function percorrer(pasta) {
    const itens = await fs.readdir(path.join(RAIZ, pasta), { withFileTypes: true });
    for (const item of itens) {
      const relativo = `${pasta}/${item.name}`;
      if (item.isDirectory()) await percorrer(relativo);
      else if (item.name.endsWith('.svg')) {
        const { data } = otimizarSvg((await ler(relativo)).toString(), {
          path: relativo,
          multipass: true,
          plugins: ['preset-default'], // no SVGO 4 o preset já preserva o viewBox (o que deixa o SVG responsivo)
        });
        await escrever(relativo, data, relativo, 'svg');
      } else if (item.name.endsWith('.png')) {
        const original = await ler(relativo);
        const comprimido = await sharp(original).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer();
        await escrever(relativo, comprimido.length < original.length ? comprimido : original, relativo, 'png');
      }
    }
  }
  await percorrer('imagens');
}

function imprimirRelatorio() {
  const kb = (bytes) => `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
  const grupos = new Map();
  for (const item of relatorio) {
    const tipo = item.tipo === 'js-fonte' ? 'js' : item.tipo;
    const grupo = grupos.get(tipo) || { antes: 0, depois: 0, antesGz: 0, depoisGz: 0, arquivos: 0 };
    if (item.tipo === 'js-fonte') {
      grupo.antes += item.antes.length;
      grupo.antesGz += gz(item.antes);
    } else {
      if (item.tipo !== 'js' && item.antes) {
        grupo.antes += item.antes.length;
        grupo.antesGz += gz(item.antes);
      }
      grupo.depois += item.depois.length;
      grupo.depoisGz += gz(item.depois);
      grupo.arquivos += 1;
    }
    grupos.set(tipo, grupo);
  }
  console.log('\nTamanhos (código-fonte → dist)');
  console.table(Object.fromEntries([...grupos].map(([tipo, g]) => [tipo, {
    arquivos: g.arquivos,
    antes: kb(g.antes),
    depois: kb(g.depois),
    'redução': `${Math.round((1 - g.depois / g.antes) * 100)}%`,
    'antes (gzip)': kb(g.antesGz),
    'depois (gzip)': kb(g.depoisGz),
  }])));
}

const inicio = performance.now();
await fs.rm(SAIDA, { recursive: true, force: true });
const [{ principal, preCarregar }, css, chart] = await Promise.all([construirJavaScript(), construirCss(), construirChartJs()]);
await construirHtml({ css, js: principal, preCarregar, chart });
await otimizarImagens();
imprimirRelatorio();
console.log(`Build concluído em ${Math.round(performance.now() - inicio)} ms → dist/`);
