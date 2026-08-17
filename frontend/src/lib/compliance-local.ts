import type { Cbom } from '@/types/cbom'
import type {
  ComplianceLevel,
  ComplianceFinding,
  PolicyCheckResult,
} from '@/types/compliance'

export function getLocalComplianceServiceName(): string {
  return 'Basic Local Compliance Service'
}

const ASYMMETRIC_PRIMITIVES = ['signature', 'key-agree', 'kem', 'pke'] as const
const UNKNOWN_PRIMITIVES = ['unknown', 'other'] as const
const WHITELIST_NAMES = [
  'ml-kem',
  'ml-dsa',
  'slh-dsa',
  'pqxdh',
  'bike',
  'mceliece',
  'frodokem',
  'hqc',
  'kyber',
  'ntru',
  'crystals',
  'falcon',
  'mayo',
  'sphincs',
  'xmss',
  'lms',
] as const
const WHITELIST_OIDS = [
  '1.3.6.1.4.1.2.267.12.4.4',
  '1.3.6.1.4.1.2.267.12.6.5',
  '1.3.6.1.4.1.2.267.12.8.7',
  '1.3.9999.6.4.16',
  '1.3.9999.6.7.16',
  '1.3.9999.6.4.13',
  '1.3.9999.6.7.13',
  '1.3.9999.6.5.12',
  '1.3.9999.6.8.12',
  '1.3.9999.6.5.10',
  '1.3.9999.6.8.10',
  '1.3.9999.6.6.12',
  '1.3.9999.6.9.12',
  '1.3.9999.6.6.10',
  '1.3.9999.6.9.10',
  '1.3.6.1.4.1.22554.5.6.1',
  '1.3.6.1.4.1.22554.5.6.2',
  '1.3.6.1.4.1.22554.5.6.3',
] as const

const complianceLevels: ComplianceLevel[] = [
  { id: 1, label: 'Not Quantum Safe', colorHex: '#fac532', icon: 'WARNING' },
  {
    id: 2,
    label: 'Unknown',
    description: 'Unknown Compliance',
    colorHex: '#17a9d1',
    icon: 'UNKNOWN',
  },
  { id: 3, label: 'Quantum Safe', colorHex: 'green', icon: 'CHECKMARK_SECURE' },
  {
    id: 4,
    label: 'Not Applicable',
    description: 'Not Applicable: we only categorize asymmetric algorithms',
    colorHex: 'gray',
    icon: 'NOT_APPLICABLE',
  },
]

export function createLocalComplianceReport(cbom: Cbom): PolicyCheckResult {
  try {
    const findings: ComplianceFinding[] = []
    const components = cbom.components ?? []

    for (const component of components) {
      const bomRef = component['bom-ref']
      if (!bomRef) throw new Error('Missing bomRef field')
      if (component.type !== 'cryptographic-asset') continue

      let unknownFindingMessage: string | null = null
      const cryptoProperties = component.cryptoProperties

      if (cryptoProperties) {
        const algorithmProperties = cryptoProperties.algorithmProperties
        if (algorithmProperties) {
          const { nistQuantumSecurityLevel } = algorithmProperties
          if (nistQuantumSecurityLevel && nistQuantumSecurityLevel > 0) {
            findings.push({
              bomRef,
              levelId: 3,
              message:
                "The field 'nistQuantumSecurityLevel' was set with a strictly positive value in the CBOM",
            })
            continue
          }

          const primitive = algorithmProperties.primitive
          if (primitive) {
            const isAsymmetric = ASYMMETRIC_PRIMITIVES.includes(
              primitive as (typeof ASYMMETRIC_PRIMITIVES)[number],
            )
            const isUnknown = UNKNOWN_PRIMITIVES.includes(
              primitive as (typeof UNKNOWN_PRIMITIVES)[number],
            )

            if (isAsymmetric || isUnknown) {
              const name = component.name
              const oid = cryptoProperties.oid
              if (oid && WHITELIST_OIDS.includes(oid as (typeof WHITELIST_OIDS)[number])) {
                findings.push({
                  bomRef,
                  levelId: 3,
                  message: 'The OID of the asset is part of the Quantum Safe OIDs whitelist',
                })
                continue
              }
              if (name) {
                const lowerCaseName = name.toLowerCase()
                const match = WHITELIST_NAMES.find((entry) => lowerCaseName.includes(entry))
                if (match) {
                  findings.push({
                    bomRef,
                    levelId: 3,
                    message: `The name of the asset contains '${match}', which is part of the Quantum Safe whitelist of component names`,
                  })
                  continue
                }
              }
              if (isAsymmetric) {
                findings.push({
                  bomRef,
                  levelId: 1,
                  message:
                    'The asset has an asymmetric primitive and does not match with the Quantum Safe whitelists of OIDs and names',
                })
                continue
              }
              unknownFindingMessage =
                'The asset primitive is unclear and does not allow further categorization'
            } else {
              findings.push({
                bomRef,
                levelId: 4,
                message:
                  'The asset has a symmetric primitive, so the Quantum Safe categorization is not applicable',
              })
              continue
            }
          } else {
            unknownFindingMessage =
              'The asset primitive was not set, which does not allow further categorization'
          }
        } else {
          unknownFindingMessage =
            "The field 'algorithmProperties' was not set, which does not allow further categorization"
        }
      } else {
        unknownFindingMessage =
          "The field 'cryptoProperties' was not set, which does not allow further categorization"
      }

      if (unknownFindingMessage) {
        findings.push({ bomRef, levelId: 2, message: unknownFindingMessage })
      }
    }

    const globalComplianceStatus = findings.every(
      (finding) => finding.levelId !== 1 && finding.levelId !== 2,
    )

    return {
      error: false,
      complianceServiceName: getLocalComplianceServiceName(),
      policyName: 'NIST Post-Quantum Cryptography',
      findings,
      complianceLevels,
      defaultComplianceLevel: 2,
      globalComplianceStatus,
    }
  } catch (e) {
    console.error(e)
    return { error: true }
  }
}
