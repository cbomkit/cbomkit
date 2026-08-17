<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AreaChart,
  CirclePackChart,
  DonutChart,
  GaugeChart,
  GroupedBarChart,
  LineChart,
  PieChart,
  ScatterChart,
  SimpleBarChart,
  StackedAreaChart,
  StackedBarChart,
  TreemapChart,
} from '@carbon/charts'
import { useAppStore } from '@/stores/app'

export type CarbonChartType =
  | 'area'
  | 'area-stacked'
  | 'bar'
  | 'bar-grouped'
  | 'bar-stacked'
  | 'circle-pack'
  | 'donut'
  | 'gauge'
  | 'line'
  | 'pie'
  | 'scatter'
  | 'treemap'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartCtor = new (container: HTMLElement, config: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { setData: (data: any) => void; setOptions: (options: any) => void }
  destroy: () => void
}

const chartClassMap: Record<CarbonChartType, ChartCtor> = {
  area: AreaChart as unknown as ChartCtor,
  'area-stacked': StackedAreaChart as unknown as ChartCtor,
  bar: SimpleBarChart as unknown as ChartCtor,
  'bar-grouped': GroupedBarChart as unknown as ChartCtor,
  'bar-stacked': StackedBarChart as unknown as ChartCtor,
  'circle-pack': CirclePackChart as unknown as ChartCtor,
  donut: DonutChart as unknown as ChartCtor,
  gauge: GaugeChart as unknown as ChartCtor,
  line: LineChart as unknown as ChartCtor,
  pie: PieChart as unknown as ChartCtor,
  scatter: ScatterChart as unknown as ChartCtor,
  treemap: TreemapChart as unknown as ChartCtor,
}

const props = defineProps<{
  type: CarbonChartType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Record<string, any>
}>()

const emit = defineEmits<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (event: 'datum-click', datum: any): void
}>()

// Map of chart types → Carbon Charts event names that emit clicked datums.
// Names sourced from @carbon/charts/dist/interfaces/events.d.ts.
const CLICK_EVENT_NAMES: Record<CarbonChartType, string[]> = {
  area: ['scatter-click'],
  'area-stacked': ['scatter-click'],
  bar: ['bar-click'],
  'bar-grouped': ['bar-click'],
  'bar-stacked': ['bar-click'],
  'circle-pack': ['circle-leaf-click'],
  donut: ['pie-slice-click'],
  gauge: [],
  line: ['scatter-click'],
  pie: ['pie-slice-click'],
  scatter: ['scatter-click'],
  treemap: ['leaf-click'],
}

const container = ref<HTMLDivElement | null>(null)
let chart: InstanceType<ChartCtor> | null = null
const eventCleanups: Array<() => void> = []

const app = useAppStore()

function buildOptions() {
  return {
    theme: app.carbonChartTheme,
    ...(props.options ?? {}),
  }
}

function mountChart() {
  if (!container.value) return
  const Chart = chartClassMap[props.type]
  if (!Chart) {
    console.error(`[CarbonChart] Unknown chart type: ${props.type}`)
    return
  }
  chart = new Chart(container.value, {
    data: props.data,
    options: buildOptions(),
  })
  attachClickHandlers()
}

function attachClickHandlers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = (chart as any)?.services
  if (!services?.events) return
  for (const eventName of CLICK_EVENT_NAMES[props.type]) {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { datum?: unknown } | undefined
      emit('datum-click', detail?.datum ?? detail)
    }
    services.events.addEventListener(eventName, handler)
    eventCleanups.push(() => services.events.removeEventListener(eventName, handler))
  }
}

function destroyChart() {
  for (const cleanup of eventCleanups.splice(0)) cleanup()
  chart?.destroy()
  chart = null
}

onMounted(mountChart)
onBeforeUnmount(destroyChart)

watch(
  () => props.type,
  () => {
    destroyChart()
    mountChart()
  },
)

watch(
  () => props.data,
  (next) => {
    chart?.model.setData(next)
  },
  { deep: true },
)

watch(
  [() => props.options, () => app.carbonChartTheme],
  () => {
    chart?.model.setOptions(buildOptions())
  },
  { deep: true },
)
</script>

<template>
  <div ref="container" class="carbon-chart" />
</template>

<style scoped>
.carbon-chart {
  width: 100%;
  height: 100%;
  min-height: 240px;
}
</style>
