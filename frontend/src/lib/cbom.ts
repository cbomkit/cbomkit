import { useCbomStore } from '@/stores/cbom'
import { useErrorsStore } from '@/stores/errors'
import { useScanStore } from '@/stores/scan'
import type {
  Cbom,
  CbomComponent,
  DependencyComponentList,
  DependencyMaps,
  RefPath,
  ScanRecord,
} from '@/types/cbom'
import { ErrorStatus } from '@/types/errors'

// Partial validation matching the legacy checkCbomValidity. Reports issues via
// the errors store; does not throw.
export function checkCbomValidity(cbom: Cbom | null | undefined): void {
  const errors = useErrorsStore()
  let isValid = true
  let isIgnoringSomeComponent = false
  const errorMessages: string[] = []

  if (cbom === undefined || cbom === null) {
    isValid = false
    errorMessages.push('CBOM is undefined or null.')
  } else {
    if (!Object.hasOwn(cbom, 'bomFormat')) {
      isValid = false
      errorMessages.push('Missing mandatory field: bomFormat.')
    }
    if (!Object.hasOwn(cbom, 'specVersion')) {
      isValid = false
      errorMessages.push('Missing mandatory field: specVersion.')
    }
    if (!Object.hasOwn(cbom, 'serialNumber')) {
      isValid = false
      errorMessages.push('Missing mandatory field: serialNumber.')
    }
    if (!Object.hasOwn(cbom, 'version')) {
      isValid = false
      errorMessages.push('Missing mandatory field: version.')
    }
    if (!Object.hasOwn(cbom, 'components')) {
      // A valid CBOM may have no components.
    } else if (!Array.isArray(cbom.components)) {
      isValid = false
      errorMessages.push('Components field is not an array.')
    } else {
      cbom.components.forEach((component, index) => {
        if (!Object.hasOwn(component, 'type')) {
          isValid = false
          errorMessages.push(`Component at index ${index} is missing mandatory field: type.`)
        } else if (component.type !== 'cryptographic-asset') {
          isIgnoringSomeComponent = true
          console.warn(`Ignoring CBOM component at index ${index} of type: ${component.type}`)
        } else if (!Object.hasOwn(component, 'cryptoProperties')) {
          isValid = false
          errorMessages.push(
            `Component at index ${index} is missing mandatory field: cryptoProperties.`,
          )
        }
      })
    }
  }

  if (isIgnoringSomeComponent) errors.addError(ErrorStatus.IgnoredComponent)
  if (!isValid) {
    console.error(
      `Invalid CBOM detected. ${errorMessages.length} errors:\n   - ${errorMessages.join('\n   - ')}`,
    )
    errors.addError(ErrorStatus.InvalidCbom)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolvePath(obj: any, path: string): any {
  const parts = path.split('.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function traverse(currentObj: any, remainingPath: string[]): any {
    if (remainingPath.length === 0) {
      return currentObj !== undefined && !Array.isArray(currentObj) ? [currentObj] : currentObj
    }
    const [key, ...nextPath] = remainingPath
    if (Array.isArray(currentObj)) {
      return currentObj
        .map((item) => traverse(item, remainingPath))
        .filter((item) => item !== undefined)
        .flat()
    }
    if (typeof currentObj === 'object' && currentObj !== null && Object.hasOwn(currentObj, key)) {
      return traverse(currentObj[key], nextPath)
    }
    return undefined
  }

  return traverse(obj, parts)
}

const DEPENDENCY_PATHS = [
  'cryptoProperties.certificateProperties.signatureAlgorithmRef',
  'cryptoProperties.certificateProperties.subjectPublicKeyRef',
  'cryptoProperties.protocolProperties.cipherSuites.algorithms',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.encr',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.prf',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.integ',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.ke',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.esn',
  'cryptoProperties.protocolProperties.ikev2TransformTypes.auth',
  'cryptoProperties.protocolProperties.cryptoRefArray',
  'cryptoProperties.relatedCryptoMaterialProperties.algorithmRef',
  'cryptoProperties.relatedCryptoMaterialProperties.securedBy.algorithmRef',
] as const

function pushRefPath(map: Map<string, RefPath[]>, key: string, value: RefPath) {
  if (!map.has(key)) map.set(key, [])
  map.get(key)!.push(value)
}

export function buildDependencyMaps(cbom: Cbom, detections: CbomComponent[]): DependencyMaps {
  const dependsMap = new Map<string, RefPath[]>()
  const isDependedOnMap = new Map<string, RefPath[]>()
  const providesMap = new Map<string, RefPath[]>()
  const isProvidedByMap = new Map<string, RefPath[]>()
  const detectionsMap = new Map<string, CbomComponent>()

  // Top-level dependencies entries.
  for (const dep of cbom.dependencies ?? []) {
    if (!dep.ref) continue
    const bomRef = dep.ref
    for (const dependsOnRef of dep.dependsOn ?? []) {
      pushRefPath(dependsMap, bomRef, [dependsOnRef, 'dependencies.dependsOn'])
      pushRefPath(isDependedOnMap, dependsOnRef, [bomRef, 'dependencies.dependsOn'])
    }
    for (const providesRef of dep.provides ?? []) {
      pushRefPath(providesMap, bomRef, [providesRef, 'dependencies.provides'])
      pushRefPath(isProvidedByMap, providesRef, [bomRef, 'dependencies.provides'])
    }
  }

  // Refs implied by component cryptoProperties paths.
  for (const detection of detections) {
    const bomRef = detection['bom-ref']
    if (!bomRef) continue
    detectionsMap.set(bomRef, detection)

    for (const path of DEPENDENCY_PATHS) {
      const allRefs = resolvePath(detection, path)
      if (allRefs === undefined) continue
      for (const ref of allRefs as string[]) {
        pushRefPath(dependsMap, bomRef, [ref, path])
        pushRefPath(isDependedOnMap, ref, [bomRef, path])
      }
    }
  }

  return { dependsMap, isDependedOnMap, providesMap, isProvidedByMap, detectionsMap }
}

export function getDependenciesFor(
  maps: DependencyMaps,
  bomRef: string,
): DependencyComponentList {
  const lookup = (map: Map<string, RefPath[]>): Array<[CbomComponent, string]> => {
    const list = map.get(bomRef) ?? []
    const result: Array<[CbomComponent, string]> = []
    for (const [ref, path] of list) {
      const comp = maps.detectionsMap.get(ref)
      if (comp) result.push([comp, path])
    }
    return result
  }
  return {
    dependsComponentList: lookup(maps.dependsMap),
    isDependedOnComponentList: lookup(maps.isDependedOnMap),
    providesComponentList: lookup(maps.providesMap),
    isProvidedByComponentList: lookup(maps.isProvidedByMap),
  }
}

// Apply CBOM metadata properties into the scan codeOrigin (mirrors the
// switch/case in the legacy setCbom).
function applyCbomMetadata(cbom: Cbom) {
  const scan = useScanStore()
  const properties = cbom.metadata?.properties
  if (!properties || !Array.isArray(properties)) return

  for (const prop of properties) {
    if (!prop.name || !('value' in prop)) continue
    switch (prop.name) {
      case 'gitUrl':
        scan.codeOrigin.gitUrl = prop.value
        break
      case 'revision':
        scan.codeOrigin.revision = prop.value
        break
      case 'subfolder':
        scan.codeOrigin.subfolder = prop.value
        break
      case 'commit':
        scan.codeOrigin.commitID = prop.value
        break
    }
  }
}

export function setCbom(cbom: Cbom) {
  const cbomStore = useCbomStore()
  checkCbomValidity(cbom)
  cbomStore.setCbom(cbom)
  applyCbomMetadata(cbom)
}

export function showResultFromApi(record: ScanRecord) {
  const cbomStore = useCbomStore()
  const scan = useScanStore()
  const cbom = getCbomFromScan(record)
  setCbom(cbom)
  cbomStore.setDependencies(buildDependencyMaps(cbom, getDetectionsFromCbom(cbom)))
  scan.codeOrigin.projectIdentifier = record.projectIdentifier ?? null
  scan.codeOrigin.gitUrl = record.gitUrl ?? null
  scan.codeOrigin.revision = record.branch ?? null
  cbomStore.showResults = true
}

export function showResultFromUpload(cbom: Cbom, name: string) {
  const cbomStore = useCbomStore()
  const scan = useScanStore()
  setCbom(cbom)
  cbomStore.setDependencies(buildDependencyMaps(cbom, getDetectionsFromCbom(cbom)))
  scan.codeOrigin.uploadedFileName = name
  cbomStore.showResults = true
}

export function getCbomFromScan(record: ScanRecord): Cbom {
  const errors = useErrorsStore()
  if (record && record.bom) return record.bom
  console.error('Error fetching latest CBOM')
  errors.addError(ErrorStatus.InvalidCbom)
  return {} as Cbom
}

// Some detections have a name like "actual-name@xxx-xxx-xxx" — strip the bom-ref tail.
function removeBomRefFromDetectionNames(detections: CbomComponent[]): CbomComponent[] {
  for (const detection of detections) {
    if (detection.name && detection.name.includes('@')) {
      detection.name = detection.name.split('@')[0]
    }
  }
  return detections
}

// Returns either the live detections (during scanning) or the unwrapped
// components from the stored CBOM.
export function getDetections(): CbomComponent[] {
  const cbomStore = useCbomStore()
  const scan = useScanStore()
  if (scan.isScanning) return removeBomRefFromDetectionNames(scan.liveDetections)
  return removeBomRefFromDetectionNames(getDetectionsFromCbom(cbomStore.cbom))
}

// Returns one detection entry per (component, occurrence) pair.
export function getDetectionsFromCbom(cbom: Cbom | null | undefined): CbomComponent[] {
  const errors = useErrorsStore()
  try {
    if (!cbom || !Array.isArray(cbom.components)) return []
    const detections: CbomComponent[] = []
    for (const component of cbom.components) {
      if (component.type !== 'cryptographic-asset') continue
      const occurrences = component.evidence?.occurrences
      if (Array.isArray(occurrences) && occurrences.length > 0) {
        for (const occurrence of occurrences) {
          const clone = JSON.parse(JSON.stringify(component)) as CbomComponent
          clone.evidence = { occurrences: [occurrence] }
          detections.push(clone)
        }
      } else {
        detections.push(component)
      }
    }
    return detections
  } catch (error) {
    console.error('Error parsing JSON:', error)
    errors.addError(ErrorStatus.JsonParsing)
    return []
  }
}
