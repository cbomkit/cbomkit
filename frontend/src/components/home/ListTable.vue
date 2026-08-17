<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useCbomStore } from '@/stores/cbom'
import { fetchLastCboms, getComplianceReport } from '@/services/api'
import { getCbomFromScan, getDetectionsFromCbom, showResultFromApi } from '@/lib/cbom'
import { limitString, numberFormatter, openGitRepo } from '@/lib/general'
import CarbonIcon from '@/components/CarbonIcon.vue'
import type { ScanRecord } from '@/types/cbom'

import ArrowRight24 from '@carbon/icons/es/arrow--right/24.js'
import Launch16 from '@carbon/icons/es/launch/16.js'

const ROWS = 5

const router = useRouter()
const cbomStore = useCbomStore()

const rows = computed(() => cbomStore.lastCboms)
const isLoading = computed(() => cbomStore.lastCboms.length === 0)

function countComponents(scan: ScanRecord) {
  return getDetectionsFromCbom(getCbomFromScan(scan)).length
}

function dateString(scan: ScanRecord & { createdAt?: string }) {
  if (!scan.createdAt) return '—'
  const date = new Date(scan.createdAt)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function openScan(scan: ScanRecord) {
  showResultFromApi(scan)
  const cbom = getCbomFromScan(scan)
  void getComplianceReport(cbom)
  void router.push({ name: 'results' })
}

onBeforeMount(() => {
  void fetchLastCboms(ROWS)
})
</script>

<template>
  <div class="list-table">
    <div v-if="isLoading" class="list-table__skeleton">
      <div v-for="i in ROWS" :key="i" class="list-table__skeleton-row">
        <cds-skeleton-text width="60%" />
        <cds-skeleton-text width="15%" />
      </div>
    </div>
    <table v-else class="list-table__table">
      <thead>
        <tr>
          <th>Most recent scans</th>
          <th>Date of scan</th>
          <th aria-label="Open" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(scan, index) in rows" :key="index">
          <td>
            <div class="list-table__name">
              <span>{{ limitString(scan.projectIdentifier ?? 'Unknown CBOM', 65) }}</span>
              <button
                v-if="scan.gitUrl"
                type="button"
                class="list-table__launch"
                aria-label="Open repository in a new tab"
                @click="openGitRepo(scan.gitUrl)"
              >
                <CarbonIcon :icon="Launch16" aria-label="Open" />
              </button>
            </div>
          </td>
          <td>{{ dateString(scan) }}</td>
          <td class="list-table__action">
            <button type="button" class="list-table__see" @click="openScan(scan)">
              See {{ numberFormatter(countComponents(scan)) }}
              {{ countComponents(scan) === 1 ? 'cryptographic asset' : 'cryptographic assets' }}
              <CarbonIcon :icon="ArrowRight24" aria-label="Open" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.list-table {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
}

.list-table__skeleton {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-table__skeleton-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.list-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.list-table__table th,
.list-table__table td {
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid var(--cds-border-subtle);
}

.list-table__table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.32px;
  color: var(--cds-text-secondary);
  font-weight: 500;
}

.list-table__name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-table__launch,
.list-table__see {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--cds-link-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  padding: 4px;
}

.list-table__see {
  float: right;
}

.list-table__launch svg,
.list-table__see svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.list-table__action {
  text-align: right;
}
</style>
