import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  buildDependencyMaps,
  getDetectionsFromCbom,
  resolvePath,
} from '@/lib/cbom'
import type { Cbom } from '@/types/cbom'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('resolvePath', () => {
  it('extracts a scalar value at a nested path as a single-element array', () => {
    expect(resolvePath({ a: { b: 'x' } }, 'a.b')).toEqual(['x'])
  })

  it('flattens array values along the path', () => {
    expect(resolvePath({ a: [{ b: 1 }, { b: 2 }] }, 'a.b')).toEqual([1, 2])
  })

  it('returns undefined when the path is missing', () => {
    expect(resolvePath({ a: { b: 'x' } }, 'a.c')).toBeUndefined()
  })
})

describe('getDetectionsFromCbom', () => {
  it('returns empty array on null/undefined/missing components', () => {
    expect(getDetectionsFromCbom(null)).toEqual([])
    expect(getDetectionsFromCbom(undefined)).toEqual([])
    expect(getDetectionsFromCbom({ bomFormat: 'CycloneDX' } as Cbom)).toEqual([])
  })

  it('unwraps occurrences into one detection per occurrence', () => {
    const cbom: Cbom = {
      components: [
        {
          type: 'cryptographic-asset',
          'bom-ref': 'asset-1',
          name: 'AES',
          evidence: {
            occurrences: [
              { location: 'a.java', line: 1 },
              { location: 'b.java', line: 2 },
            ],
          },
        },
      ],
    }
    const result = getDetectionsFromCbom(cbom)
    expect(result).toHaveLength(2)
    expect(result[0].evidence?.occurrences).toHaveLength(1)
    expect(result[0].evidence?.occurrences?.[0].location).toBe('a.java')
    expect(result[1].evidence?.occurrences?.[0].location).toBe('b.java')
  })

  it('keeps a single entry when component has no occurrences', () => {
    const cbom: Cbom = {
      components: [
        { type: 'cryptographic-asset', 'bom-ref': 'asset-2', name: 'SHA1' },
      ],
    }
    expect(getDetectionsFromCbom(cbom)).toHaveLength(1)
  })

  it('skips non-cryptographic-asset components', () => {
    const cbom: Cbom = {
      components: [
        { type: 'library', 'bom-ref': 'lib', name: 'openssl' },
        { type: 'cryptographic-asset', 'bom-ref': 'asset', name: 'AES' },
      ],
    }
    const result = getDetectionsFromCbom(cbom)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('AES')
  })
})

describe('buildDependencyMaps', () => {
  it('captures top-level dependsOn and provides relations', () => {
    const cbom: Cbom = {
      dependencies: [
        { ref: 'a', dependsOn: ['b'], provides: ['c'] },
      ],
      components: [],
    }
    const maps = buildDependencyMaps(cbom, [])
    expect(maps.dependsMap.get('a')).toEqual([['b', 'dependencies.dependsOn']])
    expect(maps.isDependedOnMap.get('b')).toEqual([['a', 'dependencies.dependsOn']])
    expect(maps.providesMap.get('a')).toEqual([['c', 'dependencies.provides']])
    expect(maps.isProvidedByMap.get('c')).toEqual([['a', 'dependencies.provides']])
  })

  it('extracts certificate signatureAlgorithmRef into the depends map', () => {
    const cbom: Cbom = { components: [] }
    const detections = [
      {
        type: 'cryptographic-asset' as const,
        'bom-ref': 'cert-1',
        cryptoProperties: {
          certificateProperties: { signatureAlgorithmRef: 'alg-1' },
        },
      },
    ]
    const maps = buildDependencyMaps(cbom, detections)
    const refs = maps.dependsMap.get('cert-1')
    expect(refs?.[0][0]).toBe('alg-1')
    expect(refs?.[0][1]).toContain('signatureAlgorithmRef')
  })
})
