<script setup lang="ts">
import { useRouter } from 'vue-router'
import SearchOrUploadView from '@/components/home/SearchOrUploadView.vue'
import { showResultFromUpload } from '@/lib/cbom'
import { getComplianceReport } from '@/services/api'
import { getTitle, isViewerOnly } from '@/config'
import sampleCbom from '@/data/sample-cbom.json'
import type { Cbom } from '@/types/cbom'

const router = useRouter()

function loadSample() {
  const cbom = sampleCbom as Cbom
  showResultFromUpload(cbom, 'keycloak-cbom.json (sample)')
  void getComplianceReport(cbom)
  void router.push({ name: 'results' })
}
</script>

<template>
  <section class="home">
    <header class="home__intro">
      <h1>{{ getTitle() }}</h1>
      <p>
        Visualize a Cryptography Bill of Materials. Scan a public Git repository,
        upload a CBOM JSON, or load a sample to explore the visualizer.
      </p>
      <p v-if="isViewerOnly()" class="home__viewer-note">
        Running in viewer-only mode — scanning is disabled.
      </p>
      <button class="home__sample" type="button" @click="loadSample">
        Try the sample CBOM
      </button>
    </header>

    <SearchOrUploadView />
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.home__intro h1 {
  margin: 0 0 12px;
  font-weight: 300;
  font-size: 2.5rem;
}

.home__intro p {
  margin: 0;
  color: var(--cds-text-secondary);
  max-width: 60ch;
}

.home__viewer-note {
  margin-top: 8px;
  color: var(--cds-text-helper);
  font-style: italic;
}

.home__sample {
  appearance: none;
  background: transparent;
  border: 1px solid var(--cds-border-strong);
  color: var(--cds-text-primary);
  padding: 8px 16px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 16px;
  align-self: flex-start;
}

.home__sample:hover {
  background: var(--cds-layer-hover);
}
</style>
