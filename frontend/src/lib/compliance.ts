import type { CbomComponent } from '@/types/cbom'
import type {
  ComplianceFinding,
  ComplianceIconKey,
  ComplianceLevel,
  PolicyCheckResult,
  PolicyCheckResultOk,
} from '@/types/compliance'
import { getLocalComplianceServiceName } from './compliance-local'

// Maps the enum keys returned in `complianceLevels[*].icon` to a stable name
// the UI layer can resolve to an icon descriptor. PR #3 supplies the actual
// SVG icons.
export const complianceIconMap: Record<ComplianceIconKey, string> = {
  CHECKMARK: 'Checkmark24',
  CHECKMARK_SECURE: 'Security24',
  WARNING: 'WarningAlt24',
  ERROR: 'MisuseOutline24',
  NOT_APPLICABLE: 'NotAvailable24',
  UNKNOWN: 'WatsonHealthImageAvailabilityUnavailable24',
}

export function isLoadingCompliance(result: PolicyCheckResult | null): boolean {
  return result === null
}

export function hasValidComplianceResults(
  result: PolicyCheckResult | null,
): result is PolicyCheckResultOk {
  return result !== null && result.error === false
}

export function globalComplianceResult(result: PolicyCheckResult | null): boolean {
  return hasValidComplianceResults(result) && result.globalComplianceStatus
}

export function getCompliancePolicyName(result: PolicyCheckResult | null): string {
  return hasValidComplianceResults(result) ? result.policyName : ''
}

export function getComplianceServiceName(result: PolicyCheckResult | null): string {
  return hasValidComplianceResults(result) ? result.complianceServiceName : ''
}

export function isUsingLocalComplianceService(result: PolicyCheckResult | null): boolean {
  return getComplianceServiceName(result) === getLocalComplianceServiceName()
}

export function getComplianceLevels(result: PolicyCheckResult | null): ComplianceLevel[] {
  return hasValidComplianceResults(result) ? result.complianceLevels : []
}

export function getPolicyResultsByAsset(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): ComplianceFinding[] {
  if (!asset || !asset['bom-ref'] || !hasValidComplianceResults(result)) return []
  const bomRef = asset['bom-ref']
  return result.findings.filter((finding) => finding.bomRef === bomRef)
}

export function getComplianceLevel(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): number | false {
  if (!hasValidComplianceResults(result)) return false
  let status = result.defaultComplianceLevel
  const levels = getPolicyResultsByAsset(result, asset).map((f) => f.levelId)
  if (levels.length > 0) {
    status = Math.min(...levels)
  }
  return status
}

export function getComplianceObjectFromId(
  result: PolicyCheckResult | null,
  id: number,
): ComplianceLevel | undefined {
  const matches = getComplianceLevels(result).filter((level) => level.id === id)
  if (matches.length === 1) return matches[0]
  console.error(`No compliance level has been found for an asset with compliance ID ${id}`)
  return undefined
}

function getComplianceObject(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): ComplianceLevel | undefined {
  const levelId = getComplianceLevel(result, asset)
  if (levelId === false) return undefined
  return getComplianceObjectFromId(result, levelId)
}

export function getComplianceColor(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): string | undefined {
  return getComplianceObject(result, asset)?.colorHex
}

export function getComplianceIcon(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): string | undefined {
  const obj = getComplianceObject(result, asset)
  return obj ? complianceIconMap[obj.icon] : undefined
}

export function getComplianceLabel(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): string | undefined {
  return getComplianceObject(result, asset)?.label
}

export function getComplianceDescription(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): string | undefined {
  const obj = getComplianceObject(result, asset)
  return obj?.description ?? obj?.label
}

export function getComplianceFindingsWithMessage(
  result: PolicyCheckResult | null,
  asset: CbomComponent | null,
): ComplianceFinding[] {
  if (!asset || !hasValidComplianceResults(result)) return []
  return result.findings.filter(
    (finding) => finding.message && finding.bomRef === asset['bom-ref'],
  )
}

// Validates an unknown payload against the policy-check result contract.
// Mirrors checkValidComplianceResults from the legacy frontend.
export function checkValidComplianceResults(value: unknown): value is PolicyCheckResultOk {
  if (value === null || value === undefined || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (candidate.error !== false) {
    console.error('The compliance backend was not able to return a compliance result')
    return false
  }
  if (
    typeof candidate.policyName !== 'string' ||
    typeof candidate.complianceServiceName !== 'string' ||
    !Array.isArray(candidate.findings) ||
    !Array.isArray(candidate.complianceLevels) ||
    typeof candidate.defaultComplianceLevel !== 'number' ||
    typeof candidate.globalComplianceStatus !== 'boolean'
  ) {
    console.error('The compliance JSON object does not have the correct format')
    return false
  }

  const validLabelIds = new Set<number>()
  for (const rawLabel of candidate.complianceLevels) {
    const label = rawLabel as Record<string, unknown>
    if (
      typeof label.id !== 'number' ||
      typeof label.label !== 'string' ||
      typeof label.colorHex !== 'string' ||
      typeof label.icon !== 'string'
    ) {
      console.error(
        'A label of `complianceLevels` in the compliance JSON object does not have the correct format',
      )
      return false
    }
    if (!Object.keys(complianceIconMap).includes(label.icon)) {
      console.error(
        'The icon of a label of `complianceLevels` in the compliance JSON object is not a valid icon defined in the enum',
      )
      return false
    }
    if (label.description !== undefined && typeof label.description !== 'string') {
      console.error(
        'The description of a label of `complianceLevels` in the compliance JSON object does not have the correct format',
      )
      return false
    }
    if (validLabelIds.has(label.id)) {
      console.error(
        'Two (or more) labels of `complianceLevels` in the compliance JSON object have the same ID, which should be unique',
      )
      return false
    }
    validLabelIds.add(label.id)
  }

  for (const rawFinding of candidate.findings) {
    const finding = rawFinding as Record<string, unknown>
    if (typeof finding.bomRef !== 'string' || typeof finding.levelId !== 'number') {
      console.error(
        'An element of `findings` in the compliance JSON object does not have the correct format',
      )
      return false
    }
    if (finding.message !== undefined && typeof finding.message !== 'string') {
      console.error(
        'The message of an element of `findings` in the compliance JSON object does not have the correct format',
      )
      return false
    }
    if (!validLabelIds.has(finding.levelId as number)) {
      console.error(
        'An element of `findings` in the compliance JSON object does not have a valid label ID specified in `complianceLevels`',
      )
      return false
    }
  }

  return true
}

// Returns an object specifying the number of assets at each compliance level.
export function getComplianceRepartition(
  result: PolicyCheckResult | null,
  detections: CbomComponent[],
): Record<number, number> {
  const complianceIds = getComplianceLevels(result).map((level) => level.id)
  const idCounts: Record<number, number> = {}
  for (const id of complianceIds) idCounts[id] = 0

  for (const detection of detections) {
    const status = getComplianceLevel(result, detection)
    if (status !== false && status in idCounts) {
      idCounts[status] += 1
    }
  }
  return idCounts
}

// Color scale keyed by compliance label, useful for ccv-donut-chart/treemap.
export function getColorScale(
  result: PolicyCheckResult | null,
  detections: CbomComponent[],
): Record<string, string> {
  const countsMap = getComplianceRepartition(result, detections)
  const levels = getComplianceLevels(result)
  const colorsMap = Object.fromEntries(levels.map((level) => [level.id, level.colorHex]))
  const labelsMap = Object.fromEntries(levels.map((level) => [level.id, level.label]))

  const scale: Record<string, string> = {}
  for (const id of Object.keys(countsMap)) {
    const numericId = Number(id)
    const label = labelsMap[numericId]
    const color = colorsMap[numericId]
    if (label && color) scale[label] = color
  }
  return scale
}
