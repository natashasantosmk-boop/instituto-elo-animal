/**
 * Instituto Elo Animal – scripts/chart-enxuto.js
 * Entrada do Chart.js ENXUTO, usada só pelo build (npm run build).
 * O pacote completo registra todos os tipos de gráfico (linha, radar, bolha,
 * escalas de tempo...). A Transparência usa só rosca e barras: importando
 * apenas essas peças, o esbuild descarta o resto (tree-shaking).
 * O resultado expõe window.Chart, como a versão completa (UMD) da CDN.
 */
import {
  Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip,
} from 'chart.js';

Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

window.Chart = Chart;
