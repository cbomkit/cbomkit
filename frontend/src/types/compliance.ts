export type ComplianceIconKey =
  | 'CHECKMARK'
  | 'CHECKMARK_SECURE'
  | 'WARNING'
  | 'ERROR'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN'

export interface ComplianceLevel {
  id: number
  label: string
  description?: string
  colorHex: string
  icon: ComplianceIconKey
}

export interface ComplianceFinding {
  bomRef: string
  levelId: number
  message?: string
  rule?: string
  property?: string
  value?: string | number
  result?: string
}

export interface PolicyCheckResultOk {
  error: false
  policyName: string
  complianceServiceName: string
  findings: ComplianceFinding[]
  complianceLevels: ComplianceLevel[]
  defaultComplianceLevel: number
  globalComplianceStatus: boolean
}

export interface PolicyCheckResultError {
  error: true
}

export type PolicyCheckResult = PolicyCheckResultOk | PolicyCheckResultError
