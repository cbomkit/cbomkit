import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CbomComponent } from '@/types/cbom'
import type { CodeOrigin, ScanCredentials, ScanState } from '@/types/scan'

const blankCodeOrigin = (): CodeOrigin => ({
  projectIdentifier: null,
  scanUrl: null,
  gitUrl: null,
  revision: null,
  subfolder: null,
  commitID: null,
  uploadedFileName: null,
})

const blankCredentials = (): ScanCredentials => ({
  username: null,
  password: null,
  pat: null,
})

export const useScanStore = defineStore('scan', () => {
  const isScanning = ref(false)
  const scanningStatus = ref<ScanState | null>(null)
  const scanningStatusMessage = ref<string | null>(null)
  const scanningStatusError = ref<string | null>(null)
  const liveDetections = ref<CbomComponent[]>([])
  const socket = ref<WebSocket | null>(null)
  const numberOfFiles = ref<string | number | null>(null)
  const numberOfLines = ref<string | number | null>(null)
  const startTime = ref<Date | null>(null)
  const scanDuration = ref<string | number | null>(null)
  const totalDuration = ref<number | null>(null)

  const codeOrigin = ref<CodeOrigin>(blankCodeOrigin())
  const credentials = ref<ScanCredentials>(blankCredentials())

  const hasActiveSocket = computed(
    () => socket.value !== null && socket.value.readyState === WebSocket.OPEN,
  )

  function resetScanningInfo() {
    isScanning.value = false
    scanningStatus.value = null
    scanningStatusMessage.value = null
    scanningStatusError.value = null
    liveDetections.value = []
    socket.value = null
    numberOfFiles.value = null
    numberOfLines.value = null
    startTime.value = null
    scanDuration.value = null
    totalDuration.value = null
    codeOrigin.value.commitID = null
  }

  function resetCodeOriginInfo() {
    codeOrigin.value = blankCodeOrigin()
  }

  function resetCredentials() {
    credentials.value = blankCredentials()
  }

  return {
    isScanning,
    scanningStatus,
    scanningStatusMessage,
    scanningStatusError,
    liveDetections,
    socket,
    numberOfFiles,
    numberOfLines,
    startTime,
    scanDuration,
    totalDuration,
    codeOrigin,
    credentials,
    hasActiveSocket,
    resetScanningInfo,
    resetCodeOriginInfo,
    resetCredentials,
  }
})
