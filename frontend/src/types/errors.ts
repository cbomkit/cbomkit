export const ErrorStatus = {
  NoConnection: 'NoConnection',
  InvalidRepo: 'InvalidRepo',
  ScanError: 'ScanError',
  JsonParsing: 'JsonParsing',
  InvalidCbom: 'InvalidCbom',
  IgnoredComponent: 'IgnoredComponent',
  MultiUpload: 'MultiUpload',
  EmptyDatabase: 'EmptyDatabase',
  FallBackLocalComplianceReport: 'FallBackLocalComplianceReport',
  ScanWarning: 'ScanWarning',
} as const

export type ErrorStatus = (typeof ErrorStatus)[keyof typeof ErrorStatus]

export interface ErrorEntry {
  status: ErrorStatus | null
  message?: string
}
