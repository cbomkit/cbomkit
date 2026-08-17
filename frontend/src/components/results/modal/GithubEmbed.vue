<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useScanStore } from '@/stores/scan'
import { getCodeLink } from '@/lib/general'
import type { CbomComponent } from '@/types/cbom'

const props = withDefaults(
  defineProps<{
    asset: CbomComponent | null
    linesBeforeAfter?: number
  }>(),
  { linesBeforeAfter: 4 },
)

defineEmits<{
  (event: 'open-code'): void
}>()

const app = useAppStore()
const scan = useScanStore()

const codeUrl = computed(() => {
  if (!props.asset) return undefined
  return getCodeLink(props.asset, scan.codeOrigin, props.linesBeforeAfter)
})

const embedSrc = computed(() => {
  const url = codeUrl.value
  if (!url || !url.includes('github.com')) return ''
  const theme = app.useDarkMode ? 'github-dark' : 'github'
  return `https://emgithub.com/embed-v2.js?target=${encodeURIComponent(url)}&style=${theme}&type=code&showBorder=on&showLineNumbers=on&showFullPath=on`
})
</script>

<template>
  <div :key="embedSrc" class="github-embed">
    <component :is="'script'" v-if="embedSrc" :src="embedSrc" async />
    <div v-else class="github-embed__placeholder">
      <cds-button kind="ghost" size="sm" @click="$emit('open-code')">
        Specify the branch to display a code snippet
      </cds-button>
    </div>
  </div>
</template>

<style scoped>
.github-embed {
  margin-top: 4px;
}
.github-embed__placeholder {
  padding: 64px 0;
  display: flex;
  justify-content: center;
  background: var(--cds-layer-accent);
  border: 1px dashed var(--cds-border-subtle);
  border-radius: 4px;
}
</style>

<style>
/* emgithub renders an inline <table>; line 5 (= line of interest with 4 before)
   gets the highlight. */
.code-area pre code table tbody tr:nth-child(5) {
  background-color: rgba(255, 255, 0, 0.22);
}
</style>
