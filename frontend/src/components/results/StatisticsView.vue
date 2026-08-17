<script setup lang="ts">
import { computed } from 'vue'
import CarbonChart from '@/components/charts/CarbonChart.vue'
import { useCbomStore } from '@/stores/cbom'
import { getDetections } from '@/lib/cbom'
import { countNames, countOccurrences } from '@/lib/info'
import { capitalizeFirstLetter } from '@/lib/general'
import {
  getColorScale,
  getComplianceLevels,
  getComplianceRepartition,
  hasValidComplianceResults,
  isLoadingCompliance,
  isUsingLocalComplianceService,
} from '@/lib/compliance'
import type { DetectionFilter } from '@/types/filter'

const emit = defineEmits<{
  (event: 'filter-change', filter: DetectionFilter): void
}>()

const cbomStore = useCbomStore()

const detections = computed(() => {
  void cbomStore.cbom
  void cbomStore.dependencies
  return getDetections()
})

const sharedOptions = computed(() => ({
  resizable: true,
  toolbar: { enabled: true },
  legend: { alignment: 'center' as const, enabled: true },
}))

// ── Compliance donut ────────────────────────────────────────────────────────────
const complianceData = computed(() => {
  const counts = getComplianceRepartition(cbomStore.policyCheckResult, detections.value)
  const levels = getComplianceLevels(cbomStore.policyCheckResult)
  const labelMap = Object.fromEntries(levels.map((l) => [l.id, l.label]))
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  if (total === 0) return []
  return Object.entries(counts).map(([id, value]) => ({
    group: labelMap[Number(id)] ?? String(id),
    value,
  }))
})

const complianceOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: {
      label: `Crypto assets${isUsingLocalComplianceService(cbomStore.policyCheckResult) ? '*' : ''}`,
    },
    alignment: 'center' as const,
  },
  color: {
    scale: getColorScale(cbomStore.policyCheckResult, detections.value),
  },
}))

// ── Asset name circle pack ──────────────────────────────────────────────────────
const nameItems = computed(() => countNames(detections.value)[0])

const nameData = computed(() =>
  nameItems.value.map((item) => ({ ...item, name: item.name.toUpperCase() })),
)

const nameOptions = computed(() => ({
  ...sharedOptions.value,
  legend: { enabled: false },
}))

// ── Primitives donut ────────────────────────────────────────────────────────────
const primitiveCounts = computed(() => countOccurrences(detections.value, 'primitive'))

const primitiveData = computed(() =>
  primitiveCounts.value[0].map((entry) => ({
    ...entry,
    group: capitalizeFirstLetter(entry.group),
  })),
)

const primitiveOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: { label: 'Primitives', number: primitiveCounts.value[1] },
    alignment: 'center' as const,
  },
}))

// ── Functions donut ─────────────────────────────────────────────────────────────
const functionCounts = computed(() => countOccurrences(detections.value, 'cryptoFunctions'))

const functionData = computed(() =>
  functionCounts.value[0].map((entry) => ({
    ...entry,
    group: capitalizeFirstLetter(entry.group),
  })),
)

const functionOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: { label: 'Functions', number: functionCounts.value[1] },
    alignment: 'center' as const,
  },
}))

// ── Click → filter dispatch ─────────────────────────────────────────────────────
// Carbon Charts puts the clicked datum in slightly different shapes depending on
// the chart type: pie/donut hand back `{ data: { group, value }, ... }` (d3 wrap),
// circle-pack returns the node data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(datum: any): any {
  if (datum && typeof datum === 'object' && 'data' in datum) return datum.data
  return datum
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onComplianceClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'compliance', value: datum?.group ?? null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPrimitiveClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'primitive', value: (datum?.group ?? '').toLowerCase() || null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onFunctionClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'function', value: (datum?.group ?? '').toLowerCase() || null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onNameClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'name', value: datum?.name ?? datum?.group ?? null })
}

const isEmpty = computed(() => detections.value.length === 0)
const isLoading = computed(() => isLoadingCompliance(cbomStore.policyCheckResult))
const hasCompliance = computed(() => hasValidComplianceResults(cbomStore.policyCheckResult))
</script>

<template>
  <section class="charts" aria-label="CBOM statistics">
    <div class="charts__grid">
      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Compliance</h3>
          <p v-if="isUsingLocalComplianceService(cbomStore.policyCheckResult)" class="muted">
            *Local approximation
          </p>
        </header>
        <div class="charts__body">
          <div v-if="isLoading" class="state state--loading">
            <cds-loading active overlay="false" />
            <p>Evaluating compliance…</p>
          </div>
          <p v-else-if="!hasCompliance" class="state state--empty">
            Compliance results unavailable.
          </p>
          <p v-else-if="complianceData.length === 0" class="state state--empty">
            No assets detected yet.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="complianceData"
            :options="complianceOptions"
            @datum-click="onComplianceClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Asset names</h3>
          <p class="muted">{{ nameItems.length }} unique</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty" class="state state--empty">No assets detected.</p>
          <CarbonChart
            v-else
            type="circle-pack"
            :data="nameData"
            :options="nameOptions"
            @datum-click="onNameClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Primitives</h3>
          <p class="muted">{{ primitiveCounts[1] }} distinct</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty || primitiveData.length === 0" class="state state--empty">
            No primitive metadata.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="primitiveData"
            :options="primitiveOptions"
            @datum-click="onPrimitiveClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Functions</h3>
          <p class="muted">{{ functionCounts[1] }} distinct</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty || functionData.length === 0" class="state state--empty">
            No function metadata.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="functionData"
            :options="functionOptions"
            @datum-click="onFunctionClick"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.charts__grid {
  display: grid;
  /* Force four equal columns regardless of intrinsic content width. `minmax(0,
     1fr)` is required so Carbon Charts' legends (which have a min-content
     wider than the column) can't push the grid to wrap to a second row. */
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

/* Drop to two columns on narrow viewports where four would be unreadable. */
@media (max-width: 720px) {
  .charts__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.charts__card {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  /* Fixed height — without this, Carbon Charts' fullscreen toolbar exit can
     leave the inner SVG with a large intrinsic size that drags the card
     vertically. Clipping with overflow:hidden absorbs any transient layout. */
  height: 380px;
  overflow: hidden;
}

.charts__card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.charts__card-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.muted {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.charts__body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.state {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--cds-text-helper);
  font-size: 0.875rem;
  text-align: center;
}

.state--empty {
  font-style: italic;
}

.state--loading p {
  margin: 0;
}
</style>
