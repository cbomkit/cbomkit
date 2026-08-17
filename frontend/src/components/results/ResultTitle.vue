<script setup lang="ts">
import { computed } from 'vue'
import { useCbomStore } from '@/stores/cbom'
import { useScanStore } from '@/stores/scan'
import { getDetections } from '@/lib/cbom'
import { limitString } from '@/lib/general'

const cbomStore = useCbomStore()
const scanStore = useScanStore()

const title = computed(() => {
  const origin = scanStore.codeOrigin
  if (origin.projectIdentifier) return origin.projectIdentifier
  if (origin.scanUrl) return origin.scanUrl.replace(/^https?:\/\//, '')
  if (origin.uploadedFileName) return `${origin.uploadedFileName} (uploaded)`
  return 'Unknown CBOM'
})

const detectionCount = computed(() => {
  void cbomStore.cbom
  return getDetections().length
})

const detectionText = computed(() => {
  if (scanStore.isScanning && scanStore.liveDetections.length === 0) {
    return 'Scanning code for cryptographic assets…'
  }
  if (scanStore.isScanning && scanStore.liveDetections.length > 0) {
    return `${scanStore.liveDetections.length} cryptographic assets found…`
  }
  if (detectionCount.value === 0) return 'No cryptographic asset has been found.'
  return `${detectionCount.value} cryptographic ${detectionCount.value === 1 ? 'asset' : 'assets'} found.`
})

const tags = computed(() => {
  const origin = scanStore.codeOrigin
  const out: Array<{ label: string }> = []
  if (origin.gitUrl) out.push({ label: `gitUrl: ${origin.gitUrl}` })
  if (origin.revision) out.push({ label: `revision: ${origin.revision}` })
  if (origin.commitID) out.push({ label: `commit: ${limitString(origin.commitID, 7)}` })
  if (origin.subfolder) out.push({ label: `subfolder: ${origin.subfolder}` })
  return out
})
</script>

<template>
  <header class="result-title">
    <h2 class="result-title__title">{{ title }}</h2>
    <p class="result-title__subtitle">{{ detectionText }}</p>
    <div v-if="tags.length > 0" class="result-title__tags">
      <cds-tag v-for="tag in tags" :key="tag.label">{{ tag.label }}</cds-tag>
    </div>
  </header>
</template>

<style scoped>
.result-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.result-title__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 300;
  color: var(--cds-text-primary);
}

.result-title__subtitle {
  margin: 0;
  font-size: 1rem;
  color: var(--cds-text-secondary);
}

.result-title__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
