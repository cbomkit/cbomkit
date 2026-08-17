import { describe, it, expect } from 'vitest'
import { createLocalComplianceReport, getLocalComplianceServiceName } from '@/lib/compliance-local'
import type { Cbom } from '@/types/cbom'

describe('createLocalComplianceReport', () => {
  it('reports the correct service name', () => {
    expect(getLocalComplianceServiceName()).toBe('Basic Local Compliance Service')
  })

  it('flags RSA (asymmetric, not on whitelist) as Not Quantum Safe (level 1)', () => {
    const cbom: Cbom = {
      components: [
        {
          type: 'cryptographic-asset',
          'bom-ref': 'rsa-1',
          name: 'RSA-2048',
          cryptoProperties: { algorithmProperties: { primitive: 'pke' } },
        },
      ],
    }
    const report = createLocalComplianceReport(cbom)
    expect(report.error).toBe(false)
    if (report.error === false) {
      expect(report.findings[0]?.levelId).toBe(1)
      expect(report.globalComplianceStatus).toBe(false)
    }
  })

  it('flags ML-KEM (asymmetric, name-matched whitelist) as Quantum Safe (level 3)', () => {
    const cbom: Cbom = {
      components: [
        {
          type: 'cryptographic-asset',
          'bom-ref': 'mlkem',
          name: 'ML-KEM-768',
          cryptoProperties: { algorithmProperties: { primitive: 'kem' } },
        },
      ],
    }
    const report = createLocalComplianceReport(cbom)
    if (report.error === false) {
      expect(report.findings[0]?.levelId).toBe(3)
      expect(report.globalComplianceStatus).toBe(true)
    } else {
      throw new Error('expected ok report')
    }
  })

  it('marks symmetric primitives as Not Applicable (level 4)', () => {
    const cbom: Cbom = {
      components: [
        {
          type: 'cryptographic-asset',
          'bom-ref': 'aes',
          name: 'AES-256',
          cryptoProperties: { algorithmProperties: { primitive: 'block-cipher' } },
        },
      ],
    }
    const report = createLocalComplianceReport(cbom)
    if (report.error === false) {
      expect(report.findings[0]?.levelId).toBe(4)
    }
  })

  it('marks assets with no primitive as Unknown (level 2)', () => {
    const cbom: Cbom = {
      components: [
        {
          type: 'cryptographic-asset',
          'bom-ref': 'mystery',
          name: 'something',
          cryptoProperties: { algorithmProperties: {} },
        },
      ],
    }
    const report = createLocalComplianceReport(cbom)
    if (report.error === false) {
      expect(report.findings[0]?.levelId).toBe(2)
    }
  })
})
