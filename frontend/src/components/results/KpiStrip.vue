<script setup lang="ts">
import { computed } from 'vue'
import { useCbomStore } from '@/stores/cbom'
import { getDetections } from '@/lib/cbom'
import { countOccurrences } from '@/lib/info'
import { capitalizeFirstLetter } from '@/lib/general'
import {
  getComplianceLevel,
  getComplianceLevels,
  hasValidComplianceResults,
} from '@/lib/compliance'

const cbomStore = useCbomStore()

const detections = computed(() => {
  // touch cbom + dependencies to make this reactive
  void cbomStore.cbom
  return getDetections()
})

const assetCount = computed(() => detections.value.length)

// Quantum-vulnerable count = assets at the lowest (most severe) compliance level id.
const quantumVulnerableCount = computed(() => {
  const policy = cbomStore.policyCheckResult
  if (!hasValidComplianceResults(policy)) return null
  const minLevel = Math.min(...policy.complianceLevels.map((l) => l.id))
  let count = 0
  for (const detection of detections.value) {
    const level = getComplianceLevel(policy, detection)
    if (level === minLevel) count += 1
  }
  return count
})

const quantumVulnerableLabel = computed(() => {
  const policy = cbomStore.policyCheckResult
  if (!hasValidComplianceResults(policy)) return 'Vulnerable assets'
  const minLevel = Math.min(...policy.complianceLevels.map((l) => l.id))
  const level = policy.complianceLevels.find((l) => l.id === minLevel)
  return level ? `${level.label} assets` : 'Vulnerable assets'
})

const topItem = (key: 'primitive' | 'cryptoFunctions') => {
  const [items] = countOccurrences(detections.value, key)
  if (items.length === 0) return null
  let top = items[0]
  for (const item of items) {
    if (item.value > top.value) top = item
  }
  return top
}

const topPrimitive = computed(() => topItem('primitive'))
const topFunction = computed(() => topItem('cryptoFunctions'))

const cards = computed(() => [
  {
    label: 'Crypto assets',
    value: String(assetCount.value),
    sublabel: assetCount.value === 1 ? 'detection' : 'detections',
    tone: 'neutral' as const,
  },
  {
    label: quantumVulnerableLabel.value,
    value:
      quantumVulnerableCount.value === null ? '—' : String(quantumVulnerableCount.value),
    sublabel: hasValidComplianceResults(cbomStore.policyCheckResult)
      ? `of ${assetCount.value}`
      : 'compliance not loaded',
    tone:
      quantumVulnerableCount.value !== null && quantumVulnerableCount.value > 0
        ? ('warn' as const)
        : ('positive' as const),
  },
  {
    label: 'Top primitive',
    value: topPrimitive.value ? capitalizeFirstLetter(topPrimitive.value.group) : '—',
    sublabel: topPrimitive.value ? `${topPrimitive.value.value} detections` : 'no data',
    tone: 'neutral' as const,
  },
  {
    label: 'Top function',
    value: topFunction.value ? capitalizeFirstLetter(topFunction.value.group) : '—',
    sublabel: topFunction.value ? `${topFunction.value.value} detections` : 'no data',
    tone: 'neutral' as const,
  },
])

const totalComplianceLevels = computed(() => getComplianceLevels(cbomStore.policyCheckResult))
void totalComplianceLevels
</script>

<template>
  <div class="kpi-strip">
    <div v-for="card in cards" :key="card.label" class="kpi" :data-tone="card.tone">
      <div class="kpi__label">{{ card.label }}</div>
      <div class="kpi__value">{{ card.value }}</div>
      <div class="kpi__sublabel">{{ card.sublabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.kpi {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  border-left: 3px solid var(--cds-border-strong);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 96px;
}

.kpi[data-tone='positive'] {
  border-left-color: var(--cds-support-success, #24a148);
}

.kpi[data-tone='warn'] {
  border-left-color: var(--cds-support-warning, #f1c21b);
}

.kpi__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.32px;
  color: var(--cds-text-secondary);
}

.kpi__value {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  color: var(--cds-text-primary);
  font-variant-numeric: tabular-nums;
}

.kpi__sublabel {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
}
</style>
