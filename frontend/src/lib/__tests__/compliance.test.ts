import { describe, it, expect } from 'vitest'
import {
  checkValidComplianceResults,
  getComplianceLevel,
  hasValidComplianceResults,
} from '@/lib/compliance'
import type { PolicyCheckResultOk } from '@/types/compliance'
import type { CbomComponent } from '@/types/cbom'

const sampleReport: PolicyCheckResultOk = {
  error: false,
  policyName: 'test',
  complianceServiceName: 'unit-test',
  defaultComplianceLevel: 2,
  globalComplianceStatus: false,
  complianceLevels: [
    { id: 1, label: 'Not Quantum Safe', colorHex: '#fac532', icon: 'WARNING' },
    { id: 2, label: 'Unknown', colorHex: '#17a9d1', icon: 'UNKNOWN' },
    { id: 3, label: 'Quantum Safe', colorHex: 'green', icon: 'CHECKMARK_SECURE' },
  ],
  findings: [
    { bomRef: 'asset-1', levelId: 1 },
    { bomRef: 'asset-2', levelId: 3 },
  ],
}

describe('checkValidComplianceResults', () => {
  it('accepts a well-formed report', () => {
    expect(checkValidComplianceResults(sampleReport)).toBe(true)
  })

  it('rejects when error is not exactly false', () => {
    expect(checkValidComplianceResults({ ...sampleReport, error: true })).toBe(false)
  })

  it('rejects when complianceLevels has an unknown icon', () => {
    const bad = {
      ...sampleReport,
      complianceLevels: [{ id: 1, label: 'Bad', colorHex: '#fff', icon: 'NOT_AN_ICON' }],
      findings: [],
    }
    expect(checkValidComplianceResults(bad)).toBe(false)
  })

  it('rejects when a finding references a missing level id', () => {
    const bad = {
      ...sampleReport,
      findings: [{ bomRef: 'asset-1', levelId: 999 }],
    }
    expect(checkValidComplianceResults(bad)).toBe(false)
  })
})

describe('hasValidComplianceResults type guard', () => {
  it('returns true for ok reports', () => {
    expect(hasValidComplianceResults(sampleReport)).toBe(true)
  })

  it('returns false for null or error reports', () => {
    expect(hasValidComplianceResults(null)).toBe(false)
    expect(hasValidComplianceResults({ error: true })).toBe(false)
  })
})

describe('getComplianceLevel', () => {
  const asset1: CbomComponent = { type: 'cryptographic-asset', 'bom-ref': 'asset-1' }
  const asset2: CbomComponent = { type: 'cryptographic-asset', 'bom-ref': 'asset-2' }
  const unmatched: CbomComponent = { type: 'cryptographic-asset', 'bom-ref': 'asset-unknown' }

  it('returns the minimum (worst) level for an asset with findings', () => {
    expect(getComplianceLevel(sampleReport, asset1)).toBe(1)
    expect(getComplianceLevel(sampleReport, asset2)).toBe(3)
  })

  it('falls back to defaultComplianceLevel when no findings match', () => {
    expect(getComplianceLevel(sampleReport, unmatched)).toBe(2)
  })

  it('returns false when results are invalid', () => {
    expect(getComplianceLevel(null, asset1)).toBe(false)
    expect(getComplianceLevel({ error: true }, asset1)).toBe(false)
  })
})
