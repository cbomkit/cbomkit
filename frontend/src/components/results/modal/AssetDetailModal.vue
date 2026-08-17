<script setup lang="ts">
import { ref, watch } from 'vue'
import CryptoAssetDetails from '@/components/results/modal/CryptoAssetDetails.vue'
import { openOnline } from '@/lib/general'
import { useScanStore } from '@/stores/scan'
import type { CbomComponent } from '@/types/cbom'

const props = defineProps<{
  open: boolean
  asset: CbomComponent | null
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const scan = useScanStore()

// Internal navigation stack: clicking "See details" on a related asset pushes
// a new frame; closing pops the stack back to the original selection.
const stack = ref<CbomComponent[]>([])

watch(
  () => [props.open, props.asset],
  ([nowOpen, nowAsset]) => {
    if (nowOpen && nowAsset) {
      stack.value = [nowAsset as CbomComponent]
    } else if (!nowOpen) {
      stack.value = []
    }
  },
  { immediate: true },
)

const currentAsset = ref<CbomComponent | null>(null)
watch(
  stack,
  (next) => {
    currentAsset.value = next.length > 0 ? next[next.length - 1] : null
  },
  { immediate: true },
)

function handleOpenSubAsset(child: CbomComponent) {
  stack.value = [...stack.value, child]
}

function handleOpenCode() {
  if (!currentAsset.value) return
  openOnline(currentAsset.value, scan.codeOrigin)
}

function handleBeingClosed() {
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <cds-modal
    size="lg"
    :open="open"
    @cds-modal-beingclosed="handleBeingClosed"
    @cds-modal-closed="handleClose"
  >
    <cds-modal-header>
      <cds-modal-close-button />
      <cds-modal-label v-if="stack.length > 1">
        <cds-button
          kind="ghost"
          size="sm"
          @click="stack = stack.slice(0, -1)"
        >
          ← Back
        </cds-button>
      </cds-modal-label>
      <cds-modal-heading>
        {{ currentAsset?.name ?? 'Cryptographic asset' }}
      </cds-modal-heading>
    </cds-modal-header>
    <cds-modal-body>
      <CryptoAssetDetails
        v-if="currentAsset"
        :asset="currentAsset"
        @open-asset="handleOpenSubAsset"
        @open-code="handleOpenCode"
      />
    </cds-modal-body>
  </cds-modal>
</template>

<style scoped>
cds-modal {
  --cds-modal-content-padding: 16px 24px;
}
</style>
