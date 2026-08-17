import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Cbom, DependencyMaps, ScanRecord } from '@/types/cbom'
import type { PolicyCheckResult } from '@/types/compliance'
import { useScanStore } from './scan'

export const useCbomStore = defineStore('cbom', () => {
  const cbom = ref<Cbom | null>(null)
  const dependencies = ref<DependencyMaps | null>(null)
  const policyCheckResult = ref<PolicyCheckResult | null>(null)
  const lastCboms = ref<ScanRecord[]>([])
  const showResults = ref(false)

  function setCbom(next: Cbom | null) {
    cbom.value = next
  }

  function setDependencies(maps: DependencyMaps | null) {
    dependencies.value = maps
  }

  function setPolicyCheckResult(next: PolicyCheckResult | null) {
    policyCheckResult.value = next
  }

  function setLastCboms(next: ScanRecord[]) {
    lastCboms.value = next
  }

  function startAgain() {
    const scan = useScanStore()
    scan.resetScanningInfo()
    scan.resetCodeOriginInfo()
    cbom.value = null
    dependencies.value = null
    policyCheckResult.value = null
    showResults.value = false
  }

  return {
    cbom,
    dependencies,
    policyCheckResult,
    lastCboms,
    showResults,
    setCbom,
    setDependencies,
    setPolicyCheckResult,
    setLastCboms,
    startAgain,
  }
})
