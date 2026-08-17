// Partial types for the parts of CycloneDX 1.6 + cryptography-ext that the
// frontend reads. Not a full schema — only what's referenced.

export type ComponentType =
  | 'cryptographic-asset'
  | 'application'
  | 'framework'
  | 'library'
  | 'container'
  | 'platform'
  | 'operating-system'
  | 'device'
  | 'device-driver'
  | 'firmware'
  | 'file'
  | 'machine-learning-model'
  | 'data'

export type AssetType =
  | 'algorithm'
  | 'certificate'
  | 'protocol'
  | 'related-crypto-material'
  | 'unknown'
  | 'other'

export type CryptoPrimitive =
  | 'ae'
  | 'block-cipher'
  | 'combiner'
  | 'drbg'
  | 'hash'
  | 'kdf'
  | 'kem'
  | 'key-agree'
  | 'mac'
  | 'pke'
  | 'sign'
  | 'stream-cipher'
  | 'signature'
  | 'xof'
  | 'unknown'
  | 'other'

export interface AlgorithmProperties {
  primitive?: CryptoPrimitive
  parameterSetIdentifier?: string
  curve?: string
  executionEnvironment?: string
  implementationPlatform?: string
  certificationLevel?: string[]
  mode?: string
  padding?: string
  cryptoFunctions?: string[]
  classicalSecurityLevel?: number
  nistQuantumSecurityLevel?: number
}

export interface CertificateProperties {
  subjectName?: string
  issuerName?: string
  notValidBefore?: string
  notValidAfter?: string
  signatureAlgorithmRef?: string
  subjectPublicKeyRef?: string
  certificateFormat?: string
  certificateExtension?: string
}

export interface ProtocolProperties {
  type?: string
  version?: string
  cipherSuites?: Array<{
    name?: string
    algorithms?: string[]
    identifiers?: string[]
  }>
  ikev2TransformTypes?: {
    encr?: string[]
    prf?: string[]
    integ?: string[]
    ke?: string[]
    esn?: string[]
    auth?: string[]
  }
  cryptoRefArray?: string[]
}

export interface RelatedCryptoMaterialProperties {
  type?: string
  id?: string
  state?: string
  algorithmRef?: string
  creationDate?: string
  activationDate?: string
  updateDate?: string
  expirationDate?: string
  value?: string
  size?: number
  format?: string
  securedBy?: {
    mechanism?: string
    algorithmRef?: string
  }
}

export interface CryptoProperties {
  assetType?: AssetType
  algorithmProperties?: AlgorithmProperties
  certificateProperties?: CertificateProperties
  protocolProperties?: ProtocolProperties
  relatedCryptoMaterialProperties?: RelatedCryptoMaterialProperties
  oid?: string
}

export interface EvidenceOccurrence {
  location: string
  line?: number
  offset?: number
  symbol?: string
  additionalContext?: string
}

export interface Evidence {
  occurrences?: EvidenceOccurrence[]
}

export interface CbomProperty {
  name: string
  value: string
}

export interface CbomMetadata {
  timestamp?: string
  properties?: CbomProperty[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: any
}

export interface CbomComponent {
  type: ComponentType
  'bom-ref'?: string
  name?: string
  version?: string
  description?: string
  cryptoProperties?: CryptoProperties
  evidence?: Evidence
  properties?: CbomProperty[]
}

export interface CbomDependency {
  ref: string
  dependsOn?: string[]
  provides?: string[]
}

export interface Cbom {
  bomFormat?: string
  specVersion?: string
  serialNumber?: string
  version?: number
  metadata?: CbomMetadata
  components?: CbomComponent[]
  dependencies?: CbomDependency[]
}

export interface ScanRecord {
  projectIdentifier?: string
  gitUrl?: string
  branch?: string
  bom?: Cbom
}

// Resolved dependency graph maps (built from cbom.dependencies + crypto refs).
export type RefPath = [bomRef: string, path: string]

export interface DependencyMaps {
  dependsMap: Map<string, RefPath[]>
  isDependedOnMap: Map<string, RefPath[]>
  providesMap: Map<string, RefPath[]>
  isProvidedByMap: Map<string, RefPath[]>
  detectionsMap: Map<string, CbomComponent>
}

export interface DependencyComponentList {
  dependsComponentList: Array<[CbomComponent, string]>
  isDependedOnComponentList: Array<[CbomComponent, string]>
  providesComponentList: Array<[CbomComponent, string]>
  isProvidedByComponentList: Array<[CbomComponent, string]>
}
