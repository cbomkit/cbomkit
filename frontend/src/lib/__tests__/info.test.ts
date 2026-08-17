import { describe, it, expect } from 'vitest'
import { countNames, countOccurrences } from '@/lib/info'
import type { CbomComponent } from '@/types/cbom'

function asset(name: string, primitive?: string, cryptoFunctions?: string[]): CbomComponent {
  return {
    type: 'cryptographic-asset',
    name,
    cryptoProperties: {
      algorithmProperties: { primitive: primitive as never, cryptoFunctions },
    },
  }
}

describe('countOccurrences', () => {
  it('counts string-valued algorithm properties', () => {
    const detections = [asset('A', 'pke'), asset('B', 'pke'), asset('C', 'hash')]
    const [items, distinct] = countOccurrences(detections, 'primitive')
    expect(distinct).toBe(2)
    const map = Object.fromEntries(items.map((i) => [i.group, i.value]))
    expect(map.pke).toBe(2)
    expect(map.hash).toBe(1)
  })

  it('counts array-valued algorithm properties (expands each element)', () => {
    const detections = [
      asset('A', 'pke', ['keygen', 'sign']),
      asset('B', 'pke', ['sign']),
    ]
    const [items, distinct] = countOccurrences(detections, 'cryptoFunctions')
    expect(distinct).toBe(2)
    const map = Object.fromEntries(items.map((i) => [i.group, i.value]))
    expect(map.keygen).toBe(1)
    expect(map.sign).toBe(2)
  })

  it('ignores detections missing the property', () => {
    const detections = [asset('A', 'pke'), asset('B')]
    const [, distinct] = countOccurrences(detections, 'primitive')
    expect(distinct).toBe(1)
  })
})

describe('countNames', () => {
  it('counts unique component names', () => {
    const detections = [asset('AES'), asset('AES'), asset('RSA')]
    const [items, distinct] = countNames(detections)
    expect(distinct).toBe(2)
    const map = Object.fromEntries(items.map((i) => [i.name, i.value]))
    expect(map.AES).toBe(2)
    expect(map.RSA).toBe(1)
  })
})
