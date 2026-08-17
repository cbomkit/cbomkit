<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCbomStore } from '@/stores/cbom'
import { stopWebSocket } from '@/services/scan'
import CarbonIcon from '@/components/CarbonIcon.vue'
import Rotate24 from '@carbon/icons/es/rotate/24.js'

const router = useRouter()
const cbomStore = useCbomStore()

function handleClick() {
  stopWebSocket()
  cbomStore.startAgain()
  router.push({ name: 'home' })
}
</script>

<template>
  <button class="return-button" type="button" @click="handleClick">
    <CarbonIcon :icon="Rotate24" aria-label="Start over" />
    <span>Start over</span>
  </button>
</template>

<style scoped>
.return-button {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--cds-link-primary);
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.return-button:hover {
  background: var(--cds-layer-hover);
}

.return-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}
</style>
