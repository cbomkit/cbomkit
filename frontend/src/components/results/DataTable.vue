<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCbomStore } from '@/stores/cbom'
import { getDetections } from '@/lib/cbom'
import { getComplianceLabel } from '@/lib/compliance'
import { capitalizeFirstLetter } from '@/lib/general'
import ComplianceIcon from '@/components/results/ComplianceIcon.vue'
import type { CbomComponent } from '@/types/cbom'
import type { DetectionFilter } from '@/types/filter'

const props = defineProps<{ filter: DetectionFilter | null }>()
const emit = defineEmits<{
  (event: 'clear-filter'): void
  (event: 'select-asset', asset: CbomComponent): void
}>()

const cbomStore = useCbomStore()
const search = ref('')

const detections = computed<CbomComponent[]>(() => {
  void cbomStore.cbom
  void cbomStore.dependencies
  return getDetections()
})

function complianceLabelFor(asset: CbomComponent) {
  return getComplianceLabel(cbomStore.policyCheckResult, asset) ?? '—'
}

function primitiveFor(asset: CbomComponent) {
  return asset.cryptoProperties?.algorithmProperties?.primitive ?? '—'
}

function functionsFor(asset: CbomComponent): string {
  const fns = asset.cryptoProperties?.algorithmProperties?.cryptoFunctions
  if (!fns) return '—'
  return Array.isArray(fns) ? fns.join(', ') : String(fns)
}

function locationFor(asset: CbomComponent): string {
  const occurrence = asset.evidence?.occurrences?.[0]
  if (!occurrence) return '—'
  if (occurrence.line) return `${occurrence.location}:${occurrence.line}`
  return occurrence.location
}

function matchesFilter(asset: CbomComponent): boolean {
  if (!props.filter || !props.filter.value) return true
  switch (props.filter.kind) {
    case 'compliance':
      return complianceLabelFor(asset) === props.filter.value
    case 'primitive':
      return String(primitiveFor(asset)).toLowerCase() === props.filter.value.toLowerCase()
    case 'function': {
      const fns = asset.cryptoProperties?.algorithmProperties?.cryptoFunctions ?? []
      const list = Array.isArray(fns) ? fns : [fns]
      return list.some((f) => String(f).toLowerCase() === props.filter!.value!.toLowerCase())
    }
    case 'name':
      return (asset.name ?? '') === props.filter.value
    default:
      return true
  }
}

function matchesSearch(asset: CbomComponent): boolean {
  const term = search.value.trim().toLowerCase()
  if (!term) return true
  return (
    (asset.name ?? '').toLowerCase().includes(term) ||
    String(primitiveFor(asset)).toLowerCase().includes(term) ||
    functionsFor(asset).toLowerCase().includes(term) ||
    locationFor(asset).toLowerCase().includes(term)
  )
}

const rows = computed(() => detections.value.filter((d) => matchesFilter(d) && matchesSearch(d)))

const filterDescription = computed(() => {
  if (!props.filter || !props.filter.value) return null
  const kindLabel = capitalizeFirstLetter(props.filter.kind)
  return `${kindLabel}: ${props.filter.value}`
})
</script>

<template>
  <section class="table-card" aria-label="Detected cryptographic assets">
    <header class="table-card__header">
      <div>
        <h3>Detected assets</h3>
        <p class="table-card__count">
          Showing {{ rows.length }} of {{ detections.length }}
        </p>
      </div>
      <div class="table-card__controls">
        <button
          v-if="filterDescription"
          type="button"
          class="filter-chip"
          @click="emit('clear-filter')"
        >
          <span>{{ filterDescription }}</span>
          <span aria-hidden="true">×</span>
        </button>
        <input
          v-model="search"
          type="search"
          placeholder="Search by name, primitive, function, or location"
          class="search-input"
          aria-label="Search detections"
        />
      </div>
    </header>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col" class="data-table__compliance-col">Status</th>
            <th scope="col">Name</th>
            <th scope="col">Primitive</th>
            <th scope="col">Functions</th>
            <th scope="col">Location</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0" class="data-table__empty">
            <td colspan="5">No assets match the current filters.</td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            :key="(row['bom-ref'] ?? '') + '_' + index"
            class="data-table__row"
            tabindex="0"
            role="button"
            :aria-label="`View details for ${row.name ?? 'asset'}`"
            @click="emit('select-asset', row)"
            @keydown.enter.prevent="emit('select-asset', row)"
            @keydown.space.prevent="emit('select-asset', row)"
          >
            <td class="data-table__compliance-cell">
              <ComplianceIcon :asset="row" />
              <span class="visually-hidden">{{ complianceLabelFor(row) }}</span>
            </td>
            <td>{{ row.name ?? '—' }}</td>
            <td>{{ capitalizeFirstLetter(String(primitiveFor(row))) }}</td>
            <td class="data-table__functions">{{ functionsFor(row) }}</td>
            <td class="data-table__location">{{ locationFor(row) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-card {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  margin-top: 24px;
}

.table-card__header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--cds-border-subtle);
}

.table-card__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.table-card__count {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.table-card__controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-chip {
  appearance: none;
  background: var(--cds-tag-background-blue, #d0e2ff);
  color: var(--cds-tag-color-blue, #002d9c);
  border: 0;
  border-radius: 999px;
  padding: 4px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  cursor: pointer;
}

.filter-chip:hover {
  filter: brightness(0.95);
}

.search-input {
  appearance: none;
  border: 1px solid var(--cds-border-subtle);
  background: var(--cds-field);
  color: var(--cds-text-primary);
  padding: 6px 12px;
  font-size: 0.875rem;
  min-width: 260px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 12px 20px;
  border-bottom: 1px solid var(--cds-border-subtle);
  color: var(--cds-text-primary);
  vertical-align: middle;
}

.data-table th {
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.32px;
  color: var(--cds-text-secondary);
}

.data-table__compliance-col {
  width: 64px;
}

.data-table__compliance-cell {
  width: 64px;
}

.data-table__compliance-cell svg {
  width: 20px;
  height: 20px;
}

.data-table__location,
.data-table__functions {
  font-family: var(--cds-code-01-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.8125rem;
  color: var(--cds-text-secondary);
}

.data-table__row {
  cursor: pointer;
}

.data-table__row:hover {
  background: var(--cds-layer-hover);
}

.data-table__row:focus-visible {
  outline: 2px solid var(--cds-focus, #0f62fe);
  outline-offset: -2px;
}

.data-table__empty td {
  text-align: center;
  font-style: italic;
  color: var(--cds-text-helper);
  padding: 28px 20px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  border: 0;
  padding: 0;
  white-space: nowrap;
  clip-path: inset(50%);
}
</style>
