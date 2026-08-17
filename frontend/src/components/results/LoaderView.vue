<script setup lang="ts">
import { computed } from 'vue'
import { useScanStore } from '@/stores/scan'
import { ScanState } from '@/types/scan'

const scan = useScanStore()

type CdsState = 'inactive' | 'active' | 'finished' | 'error'

const cdsState = computed<CdsState>(() => {
  switch (scan.scanningStatus) {
    case ScanState.LOADED:
      return 'finished'
    case ScanState.ERROR:
      return 'error'
    case ScanState.LOADING:
    case ScanState.ENDING:
      return 'active'
    default:
      return 'inactive'
  }
})

const text = computed(() => {
  if (scan.scanningStatus === ScanState.LOADED) return 'Scan finished'
  if (scan.scanningStatus === ScanState.ERROR) return scan.scanningStatusMessage ?? 'Scan failed'
  return scan.scanningStatusMessage ?? 'Scanning…'
})
</script>

<template>
  <div v-if="scan.scanningStatus" class="loader">
    <cds-inline-loading :status="cdsState">{{ text }}</cds-inline-loading>
  </div>
</template>

<style scoped>
.loader {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
}
</style>
