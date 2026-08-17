export type DetectionFilterKind = 'compliance' | 'primitive' | 'function' | 'name'

export interface DetectionFilter {
  kind: DetectionFilterKind
  value: string | null
}
