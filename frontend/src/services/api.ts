import { API_LAST_CBOM_URL, API_CHECK_POLICY_URL, API_CHECK_POLICY_NAME } from '@/config'
import { useCbomStore } from '@/stores/cbom'
import { useErrorsStore } from '@/stores/errors'
import { isViewerOnly } from '@/config'
import { checkValidComplianceResults } from '@/lib/compliance'
import { createLocalComplianceReport } from '@/lib/compliance-local'
import type { Cbom, ScanRecord } from '@/types/cbom'
import { ErrorStatus } from '@/types/errors'

async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
  return (await response.json()) as T
}

export async function fetchLastCboms(limit: number): Promise<void> {
  const cbomStore = useCbomStore()
  const errors = useErrorsStore()
  const url = `${API_LAST_CBOM_URL}/${limit}`
  try {
    const data = await fetchJson<ScanRecord[]>(url)
    cbomStore.setLastCboms(data)
    if (Array.isArray(data) && data.length === 0) {
      errors.addError(ErrorStatus.EmptyDatabase)
    }
  } catch (error) {
    console.error('Error:', (error as Error).message)
    errors.addError(ErrorStatus.NoConnection)
  }
}

function getLocalComplianceReport(cbom: Cbom): void {
  const cbomStore = useCbomStore()
  const report = createLocalComplianceReport(cbom)
  if (checkValidComplianceResults(report)) {
    cbomStore.setPolicyCheckResult(report)
  } else {
    cbomStore.setPolicyCheckResult({ error: true })
  }
}

async function getRemoteComplianceReport(
  cbom: Cbom,
  policyIdentifier = API_CHECK_POLICY_NAME,
): Promise<void> {
  const cbomStore = useCbomStore()
  const errors = useErrorsStore()
  const url = `${API_CHECK_POLICY_URL}?policyIdentifier=${policyIdentifier}`

  try {
    const data = await fetchJson<unknown>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cbom),
    })
    if (checkValidComplianceResults(data)) {
      cbomStore.setPolicyCheckResult(data)
      return
    }
    console.warn('Using the local compliance report instead of the remote one')
    errors.addError(ErrorStatus.FallBackLocalComplianceReport)
    getLocalComplianceReport(cbom)
  } catch (error) {
    console.warn('Using the local compliance report instead of the remote one', error)
    errors.addError(ErrorStatus.FallBackLocalComplianceReport)
    getLocalComplianceReport(cbom)
  }
}

export function getComplianceReport(
  cbom: Cbom,
  policyIdentifier = API_CHECK_POLICY_NAME,
): Promise<void> | void {
  if (isViewerOnly()) {
    getLocalComplianceReport(cbom)
    return
  }
  return getRemoteComplianceReport(cbom, policyIdentifier)
}
