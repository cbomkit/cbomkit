<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import CarbonIcon from '@/components/CarbonIcon.vue'

import Awake24 from '@carbon/icons/es/awake/24.js'
import Moon24 from '@carbon/icons/es/moon/24.js'
import BrightnessContrast24 from '@carbon/icons/es/brightness-contrast/24.js'

const app = useAppStore()

const title = computed(() => import.meta.env.CBOMKIT_TITLE ?? 'CBOMkit')

const tipText = computed(() => {
  switch (app.themePreference) {
    case 'auto':
      return 'System theme'
    case 'light':
      return 'Light theme'
    case 'dark':
      return 'Dark theme'
  }
  return ''
})

const themeIcon = computed(() => {
  switch (app.themePreference) {
    case 'auto':
      return BrightnessContrast24
    case 'light':
      return Awake24
    case 'dark':
      return Moon24
  }
  return BrightnessContrast24
})
</script>

<template>
  <cds-header aria-label="CBOMkit header">
    <cds-header-name href="https://research.ibm.com" prefix="IBM" target="_blank">
      Research
    </cds-header-name>
    <div class="header-divider">|</div>
    <span class="header-title">{{ title }}</span>
    <div class="header-actions">
      <cds-header-global-action
        :tooltip-text="tipText"
        tooltip-alignment="end"
        @click="app.cycleTheme()"
      >
        <CarbonIcon :icon="themeIcon" :aria-label="tipText" />
      </cds-header-global-action>
    </div>
  </cds-header>
</template>

<style scoped>
.header-divider {
  margin: auto 0 auto -25px;
  color: white;
}

.header-title {
  margin: auto auto auto 8px;
  color: white;
}

.header-actions {
  margin-left: auto;
  display: flex;
}
</style>
