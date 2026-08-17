<script setup lang="ts">
import { computed } from 'vue'
import CarbonIcon from '@/components/CarbonIcon.vue'
import type { CbomComponent } from '@/types/cbom'
import { useCbomStore } from '@/stores/cbom'
import { getComplianceColor, getComplianceIcon } from '@/lib/compliance'

import Checkmark24 from '@carbon/icons/es/checkmark/24.js'
import Security24 from '@carbon/icons/es/security/24.js'
import WarningAlt24 from '@carbon/icons/es/warning--alt/24.js'
import MisuseOutline24 from '@carbon/icons/es/misuse--outline/24.js'
import NotAvailable24 from '@carbon/icons/es/not-available/24.js'
import Unknown24 from '@carbon/icons/es/unknown/24.js'

const props = defineProps<{ asset: CbomComponent | null }>()

const cbomStore = useCbomStore()

const iconMap = {
  Checkmark24,
  Security24,
  WarningAlt24,
  MisuseOutline24,
  NotAvailable24,
  WatsonHealthImageAvailabilityUnavailable24: Unknown24,
} as const

type IconKey = keyof typeof iconMap

const iconKey = computed<IconKey | undefined>(() => {
  const name = getComplianceIcon(cbomStore.policyCheckResult, props.asset)
  if (!name) return undefined
  return name in iconMap ? (name as IconKey) : undefined
})

const fill = computed(() =>
  getComplianceColor(cbomStore.policyCheckResult, props.asset) ?? 'currentColor',
)
</script>

<template>
  <CarbonIcon v-if="iconKey" :icon="iconMap[iconKey]" :style="{ fill }" />
</template>
