<script setup lang="ts">
import { ref } from 'vue'
import { useScanStore } from '@/stores/scan'
import ResultTitle from '@/components/results/ResultTitle.vue'
import ReturnButton from '@/components/results/ReturnButton.vue'
import KpiStrip from '@/components/results/KpiStrip.vue'
import StatisticsView from '@/components/results/StatisticsView.vue'
import DataTable from '@/components/results/DataTable.vue'
import LoaderView from '@/components/results/LoaderView.vue'
import AssetDetailModal from '@/components/results/modal/AssetDetailModal.vue'
import type { DetectionFilter } from '@/types/filter'
import type { CbomComponent } from '@/types/cbom'

const scan = useScanStore()
const filter = ref<DetectionFilter | null>(null)
const selectedAsset = ref<CbomComponent | null>(null)
const modalOpen = ref(false)

function handleFilterChange(next: DetectionFilter) {
  if (!next.value) {
    filter.value = null
    return
  }
  if (filter.value && filter.value.kind === next.kind && filter.value.value === next.value) {
    filter.value = null
    return
  }
  filter.value = next
}

function clearFilter() {
  filter.value = null
}

function selectAsset(asset: CbomComponent) {
  selectedAsset.value = asset
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}
</script>

<template>
  <div class="results">
    <div class="results__toolbar">
      <LoaderView v-if="scan.scanningStatus" />
      <ReturnButton />
    </div>
    <ResultTitle />
    <KpiStrip />
    <StatisticsView @filter-change="handleFilterChange" />
    <DataTable
      :filter="filter"
      @clear-filter="clearFilter"
      @select-asset="selectAsset"
    />
    <AssetDetailModal
      :open="modalOpen"
      :asset="selectedAsset"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
}

.results__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 16px;
}
</style>
