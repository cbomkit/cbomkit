import { API_SCAN_URL } from '@/config'
import { useCbomStore } from '@/stores/cbom'
import { useErrorsStore } from '@/stores/errors'
import { useScanStore } from '@/stores/scan'
import { setCbom, buildDependencyMaps, getDetectionsFromCbom } from '@/lib/cbom'
import { getComplianceReport } from '@/services/api'
import type { CbomComponent } from '@/types/cbom'
import { ErrorStatus } from '@/types/errors'
import {
  ScanState,
  type ScanCredentialsInput,
  type ScanMessageEnvelope,
  type ScanRequestBody,
} from '@/types/scan'

export { ScanState as STATES } from '@/types/scan'

let socketWasManuallyClosed = false

function uuid4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function dispatchMessage(envelope: ScanMessageEnvelope): void {
  const scan = useScanStore()
  const cbomStore = useCbomStore()
  const errors = useErrorsStore()

  switch (envelope.type) {
    case 'LABEL':
      scan.scanningStatusMessage = envelope.message
      if (envelope.message === 'Starting...') {
        scan.startTime = new Date()
      }
      if (envelope.message === 'Finished') {
        scan.scanningStatus = ScanState.LOADED
        scan.isScanning = false
        if (scan.startTime) {
          const finishTime = new Date()
          scan.totalDuration = Math.floor((finishTime.getTime() - scan.startTime.getTime()) / 1000)
        }
      }
      break
    case 'ERROR':
      scan.scanningStatusMessage = envelope.message
      scan.scanningStatus = ScanState.ERROR
      scan.isScanning = false
      errors.addError(ErrorStatus.ScanError, envelope.message)
      console.error('Error:', envelope.message)
      break
    case 'WARNING':
      scan.scanningStatusMessage = envelope.message
      errors.addError(ErrorStatus.ScanWarning, envelope.message)
      console.warn('Warning:', envelope.message)
      break
    case 'DETECTION': {
      try {
        const cryptoAsset = JSON.parse(envelope.message) as CbomComponent
        scan.liveDetections.push(cryptoAsset)
      } catch (error) {
        console.error('Failed to parse DETECTION payload:', error)
        errors.addError(ErrorStatus.JsonParsing)
      }
      break
    }
    case 'CBOM': {
      try {
        const cbom = JSON.parse(envelope.message)
        setCbom(cbom)
        cbomStore.setDependencies(buildDependencyMaps(cbom, getDetectionsFromCbom(cbom)))
        // Trigger the compliance check once the scan produces a CBOM. The
        // legacy frontend kicked this off from a watcher; we do it here so
        // the scan flow and the upload flow both produce a policy result.
        void getComplianceReport(cbom)
        console.log('Received CBOM from scanning')
      } catch (error) {
        console.error('Failed to parse CBOM payload:', error)
        errors.addError(ErrorStatus.JsonParsing)
      }
      break
    }
    case 'GITURL':
      scan.codeOrigin.gitUrl = envelope.message
      break
    case 'BRANCH':
      scan.codeOrigin.revision = envelope.message
      break
    case 'FOLDER':
      scan.codeOrigin.subfolder = envelope.message
      break
    case 'SCANNED_FILE_COUNT':
      scan.numberOfFiles = envelope.message
      break
    case 'SCANNED_NUMBER_OF_LINES':
      scan.numberOfLines = envelope.message
      break
    case 'SCANNED_DURATION':
      scan.scanDuration = envelope.message
      break
    case 'REVISION_HASH':
      scan.codeOrigin.commitID = envelope.message
      break
    default:
      console.log('Unknown message:', envelope)
  }
}

function handleMessage(payload: string): void {
  try {
    const envelope = JSON.parse(payload) as ScanMessageEnvelope
    dispatchMessage(envelope)
  } catch (error) {
    console.error('Error parsing WebSocket payload:', error, payload)
    const errors = useErrorsStore()
    errors.addError(ErrorStatus.JsonParsing)
  }
}

function buildScanRequest(): ScanRequestBody | null {
  const scan = useScanStore()
  if (!scan.codeOrigin.scanUrl) return null
  const body: ScanRequestBody = { scanUrl: scan.codeOrigin.scanUrl }
  if (scan.codeOrigin.revision) body.branch = scan.codeOrigin.revision
  if (scan.codeOrigin.subfolder) body.subfolder = scan.codeOrigin.subfolder

  if (scan.credentials.pat) {
    body.credentials = { pat: scan.credentials.pat }
  } else if (scan.credentials.username && scan.credentials.password) {
    body.credentials = {
      username: scan.credentials.username,
      password: scan.credentials.password,
    }
  }
  return body
}

function sendScanRequest(): void {
  const scan = useScanStore()
  const cbomStore = useCbomStore()
  const errors = useErrorsStore()

  if (!scan.socket) {
    errors.addError(ErrorStatus.NoConnection)
    console.log('No socket on scan store')
    return
  }
  const body = buildScanRequest()
  if (!body) {
    errors.addError(ErrorStatus.InvalidRepo)
    console.log('Not valid Git URL or Package URL')
    return
  }
  scan.socket.send(JSON.stringify(body))
  scan.isScanning = true
  scan.scanningStatus = ScanState.LOADING
  cbomStore.showResults = true
}

function startWebSocket(socketURL: string): void {
  const scan = useScanStore()
  const errors = useErrorsStore()

  if (scan.socket && scan.socket.readyState === WebSocket.OPEN) {
    console.error('WebSocket is already open.')
    errors.addError(null)
    return
  }

  const socket = new WebSocket(socketURL)
  scan.socket = socket
  socketWasManuallyClosed = false

  socket.addEventListener('open', () => {
    console.log('WebSocket connection opened.')
    sendScanRequest()
  })
  socket.addEventListener('message', (event: MessageEvent) => {
    handleMessage(String((event.data as string).trim()))
  })
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed.', event)
  })
  socket.addEventListener('error', (error) => {
    if (socketWasManuallyClosed) {
      console.warn(
        'The connection was closed by the client. A connection error occurred, but has NOT been notified in the UI.',
      )
    } else {
      console.error('WebSocket error:', error)
      errors.addError(ErrorStatus.NoConnection)
    }
  })
}

export function stopWebSocket(): void {
  const scan = useScanStore()
  if (scan.socket && scan.socket.readyState === WebSocket.OPEN) {
    socketWasManuallyClosed = true
    scan.socket.close()
    console.log('The client asked to close the WebSocket')
  }
}

function setCodeOrigin(gitBranch?: string | null, gitSubfolder?: string | null): void {
  const scan = useScanStore()
  if (scan.codeOrigin.scanUrl) {
    let scanUrl = scan.codeOrigin.scanUrl.trim()
    if (!scanUrl.startsWith('pkg:')) {
      scanUrl = scanUrl.replace(/^scm:git:git:\/\//, '').replace(/\.git$/, '')
      if (!scanUrl.includes('://')) {
        scanUrl = `https://${scanUrl}`
      }
    }
    scan.codeOrigin.scanUrl = scanUrl
  }
  if (gitBranch) scan.codeOrigin.revision = gitBranch.trim()
  if (gitSubfolder) scan.codeOrigin.subfolder = gitSubfolder.trim()
}

function setCredentials(input: ScanCredentialsInput | null): void {
  if (input === null || input === undefined) return
  const scan = useScanStore()
  if (input.username && input.passwordOrPAT) {
    scan.credentials.username = input.username
    scan.credentials.password = input.passwordOrPAT
  } else if (input.passwordOrPAT) {
    scan.credentials.pat = input.passwordOrPAT
  }
}

export function connectAndScan(
  gitBranch: string | null | undefined,
  gitSubfolder: string | null | undefined,
  credentials: ScanCredentialsInput | null,
): void {
  const scan = useScanStore()
  scan.resetScanningInfo()
  setCodeOrigin(gitBranch, gitSubfolder)
  setCredentials(credentials)
  // Pre-set the scan state so the router guard on /results lets the page
  // through synchronously, before the WebSocket open event fires.
  scan.isScanning = true
  scan.scanningStatus = ScanState.LOADING
  scan.scanningStatusMessage = 'Connecting…'
  scan.startTime = new Date()
  const clientId = uuid4()
  startWebSocket(`${API_SCAN_URL}/${clientId}`)
}
