import dict from '@/data/crypto-dictionary.json'
import type { CbomComponent, AlgorithmProperties } from '@/types/cbom'

interface DictionaryEntry {
  fullName?: string
  description?: string
}

const dictionary = dict as Record<string, DictionaryEntry>

export function getTermFullName(termName: string): string | undefined {
  return dictionary[termName]?.fullName
}

export function getTermDescription(termName: string): string | undefined {
  return dictionary[termName]?.description
}

export interface OccurrenceItem {
  name: string
  group: string
  value: number
}

export type AlgorithmPropertyKey = keyof AlgorithmProperties

// For a CBOM property inside `component.cryptoProperties.algorithmProperties`,
// count occurrences of each value across detections. Property may be a string
// or array of strings.
export function countOccurrences(
  detections: CbomComponent[],
  algorithmProperty: AlgorithmPropertyKey,
): [OccurrenceItem[], number] {
  const counts = new Map<string, number>()

  for (const detection of detections) {
    const props = detection.cryptoProperties?.algorithmProperties
    if (!props) continue
    const raw = props[algorithmProperty]
    if (raw === undefined || raw === null) continue
    const values = Array.isArray(raw) ? raw : [raw]
    for (const value of values) {
      const key = String(value)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const items: OccurrenceItem[] = []
  for (const [group, value] of counts) {
    items.push({ name: group, group, value })
  }
  return [items, counts.size]
}

export function countNames(detections: CbomComponent[]): [OccurrenceItem[], number] {
  const counts = new Map<string, number>()
  for (const detection of detections) {
    if (!detection.name) continue
    counts.set(detection.name, (counts.get(detection.name) ?? 0) + 1)
  }
  const items: OccurrenceItem[] = []
  for (const [group, value] of counts) {
    items.push({ name: group, group, value })
  }
  return [items, counts.size]
}
