import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

/**
 * The one ChartJS registration site every chart wrapper rides on.
 *
 * `BarChart` draws bars, `PieChart` draws doughnuts, and both label slices
 * with `chartjs-plugin-datalabels`; registering the union once keeps a second
 * wrapper from re-registering (harmless but noisy) and keeps chart.js
 * tree-shaking to these elements. Import for the side effect.
 */
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement, ChartDataLabels)
