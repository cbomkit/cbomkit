<script setup lang="ts">
import { useRouter } from 'vue-router'
import { isViewerOnly } from '@/config'
import SearchBar from './SearchBar.vue'
import FileUploader from './FileUploader.vue'
import ListTable from './ListTable.vue'
import CarbonIcon from '@/components/CarbonIcon.vue'

import AddAlt24 from '@carbon/icons/es/add--alt/24.js'
import Script24 from '@carbon/icons/es/script/24.js'
import Catalog24 from '@carbon/icons/es/catalog/24.js'

const router = useRouter()

function goToResults() {
  void router.push({ name: 'results' })
}
</script>

<template>
  <div class="search-or-upload">
    <section v-if="!isViewerOnly()" class="search-or-upload__list">
      <div class="search-or-upload__icon-title">
        <CarbonIcon :icon="Catalog24" aria-label="Recent" />
        <h2>Explore previously scanned CBOMs</h2>
      </div>
      <ListTable />
    </section>

    <div class="search-or-upload__cards">
      <article v-if="!isViewerOnly()" class="search-or-upload__card search-or-upload__card--wide">
        <div class="search-or-upload__icon-title">
          <CarbonIcon :icon="AddAlt24" aria-label="Generate" />
          <h2>Generate a new CBOM</h2>
        </div>
        <p>Submit a public Git URL or PURL to scan and generate a CBOM.</p>
        <SearchBar />
      </article>

      <article class="search-or-upload__card">
        <div class="search-or-upload__icon-title">
          <CarbonIcon :icon="Script24" aria-label="Upload" />
          <h2>Upload a CBOM</h2>
        </div>
        <p>Upload an existing CBOM to visualize it.</p>
        <FileUploader @uploaded="goToResults" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.search-or-upload {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.search-or-upload__icon-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.search-or-upload__icon-title h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.search-or-upload__icon-title svg {
  width: 22px;
  height: 22px;
  fill: var(--cds-text-primary);
}

.search-or-upload__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.search-or-upload__card {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  padding: 20px;
}

.search-or-upload__card--wide {
  grid-column: span 1;
}

@media (min-width: 1024px) {
  .search-or-upload__cards {
    grid-template-columns: 7fr 4fr;
  }
}

.search-or-upload__card p {
  margin: 0 0 16px;
  color: var(--cds-text-secondary);
}
</style>
