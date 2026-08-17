import type { CbomComponent } from './cbom'

export const ScanState = {
  LOADED: 'loaded',
  ERROR: 'error',
  LOADING: 'loading',
  ENDING: 'ending',
} as const

export type ScanState = (typeof ScanState)[keyof typeof ScanState]

export type ScanMessageType =
  | 'LABEL'
  | 'ERROR'
  | 'WARNING'
  | 'DETECTION'
  | 'CBOM'
  | 'GITURL'
  | 'BRANCH'
  | 'FOLDER'
  | 'SCANNED_FILE_COUNT'
  | 'SCANNED_NUMBER_OF_LINES'
  | 'SCANNED_DURATION'
  | 'REVISION_HASH'

// All server-pushed messages share this envelope; the `message` is either a
// plain string or a JSON-encoded payload depending on `type`.
export interface ScanMessageEnvelope {
  type: ScanMessageType
  message: string
}

// Decoded form used internally after the JSON unwrap step for DETECTION/CBOM.
export type ScanMessage =
  | { type: 'LABEL'; message: string }
  | { type: 'ERROR'; message: string }
  | { type: 'WARNING'; message: string }
  | { type: 'DETECTION'; payload: CbomComponent }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'CBOM'; payload: any }
  | { type: 'GITURL'; message: string }
  | { type: 'BRANCH'; message: string }
  | { type: 'FOLDER'; message: string }
  | { type: 'SCANNED_FILE_COUNT'; message: string }
  | { type: 'SCANNED_NUMBER_OF_LINES'; message: string }
  | { type: 'SCANNED_DURATION'; message: string }
  | { type: 'REVISION_HASH'; message: string }

export interface ScanCredentials {
  username?: string | null
  password?: string | null
  pat?: string | null
}

export interface ScanCredentialsInput {
  username?: string
  passwordOrPAT?: string
}

export interface ScanRequestBody {
  scanUrl: string
  branch?: string
  subfolder?: string
  credentials?: {
    pat?: string
    username?: string
    password?: string
  }
}

export interface CodeOrigin {
  projectIdentifier: string | null
  scanUrl: string | null
  gitUrl: string | null
  revision: string | null
  subfolder: string | null
  commitID: string | null
  uploadedFileName: string | null
}
