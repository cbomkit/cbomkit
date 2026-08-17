<script setup lang="ts">
import { computed } from 'vue'
import { useCbomStore } from '@/stores/cbom'
import { getDependenciesFor } from '@/lib/cbom'
import { getTermFullName } from '@/lib/info'
import CarbonIcon from '@/components/CarbonIcon.vue'
import Downstream24 from '@carbon/icons/es/downstream/24.js'
import Upstream24 from '@carbon/icons/es/upstream/24.js'
import Launch24 from '@carbon/icons/es/launch/24.js'
import type { CbomComponent } from '@/types/cbom'

const props = defineProps<{ bomRef: string }>()
const emit = defineEmits<{
  (event: 'open-asset', asset: CbomComponent): void
}>()

const cbomStore = useCbomStore()

const dependencies = computed(() => {
  if (!cbomStore.dependencies) {
    return {
      dependsComponentList: [],
      isDependedOnComponentList: [],
      providesComponentList: [],
      isProvidedByComponentList: [],
    }
  }
  return getDependenciesFor(cbomStore.dependencies, props.bomRef)
})

function getAssetType(asset: CbomComponent): string {
  const assetType = asset.cryptoProperties?.assetType
  if (!assetType) return ''
  return getTermFullName(assetType) ?? assetType
}

interface Group {
  title: string
  icon: typeof Downstream24
  iconFill: string
  items: Array<[CbomComponent, string]>
}

const groups = computed<Group[]>(() => {
  const d = dependencies.value
  return [
    { title: 'Depends on', icon: Downstream24, iconFill: '#05BE8D', items: d.dependsComponentList },
    { title: 'Provides to', icon: Upstream24, iconFill: '#188A99', items: d.providesComponentList },
    { title: 'Is used by', icon: Upstream24, iconFill: '#FFBA1A', items: d.isDependedOnComponentList },
    {
      title: 'Is provided by',
      icon: Downstream24,
      iconFill: '#FF488E',
      items: d.isProvidedByComponentList,
    },
  ].filter((g) => g.items.length > 0)
})

const hasAny = computed(() => groups.value.some((g) => g.items.length > 0))
</script>

<template>
  <div v-if="hasAny" class="deps">
    <div v-for="group in groups" :key="group.title" class="deps__group">
      <h4 class="deps__title">{{ group.title }}</h4>
      <div
        v-for="([asset, path], index) in group.items"
        :key="`${group.title}-${index}`"
        class="deps__row"
      >
        <CarbonIcon
          :icon="group.icon"
          :style="{ fill: group.iconFill }"
          class="deps__icon"
        />
        <div class="deps__meta">
          <div class="deps__name">
            {{ (asset.name ?? '').toUpperCase() }}<span v-if="getAssetType(asset)"> — {{ getAssetType(asset) }}</span>
          </div>
          <div v-if="asset['bom-ref']" class="deps__sub">
            BOM Reference: <span class="deps__code">{{ asset['bom-ref'] }}</span>
          </div>
          <div v-if="asset['bom-ref']" class="deps__sub">
            Source: <span class="deps__code">{{ path }}</span>
          </div>
        </div>
        <cds-button
          kind="ghost"
          size="sm"
          class="deps__btn"
          @click="emit('open-asset', asset)"
        >
          See details
          <span slot="icon" class="deps__btn-icon">
            <CarbonIcon :icon="Launch24" />
          </span>
        </cds-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.deps__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.deps__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}
.deps__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
}
.deps__icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.deps__meta {
  flex: 1;
  min-width: 0;
}
.deps__name {
  font-size: 0.9375rem;
  color: var(--cds-text-primary);
  word-break: break-word;
}
.deps__sub {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  margin-top: 2px;
}
.deps__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--cds-layer-accent);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.6875rem;
}
.deps__btn {
  flex-shrink: 0;
}
.deps__btn-icon {
  width: 16px;
  height: 16px;
}
</style>
