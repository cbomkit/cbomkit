<script setup lang="ts">
import { computed } from 'vue'
import { useCbomStore } from '@/stores/cbom'
import { useScanStore } from '@/stores/scan'
import { resolvePath } from '@/lib/cbom'
import { getTermFullName, getTermDescription } from '@/lib/info'
import {
  getComplianceDescription,
  getComplianceFindingsWithMessage,
  getCompliancePolicyName,
  getComplianceObjectFromId,
  hasValidComplianceResults,
} from '@/lib/compliance'
import { getCodeLink } from '@/lib/general'
import ComplianceIcon from '@/components/results/ComplianceIcon.vue'
import GithubEmbed from '@/components/results/modal/GithubEmbed.vue'
import DependenciesView from '@/components/results/modal/DependenciesView.vue'
import CarbonIcon from '@/components/CarbonIcon.vue'
import Launch16 from '@carbon/icons/es/launch/16.js'
import type { CbomComponent } from '@/types/cbom'

const props = defineProps<{ asset: CbomComponent | null }>()
const emit = defineEmits<{
  (event: 'open-asset', asset: CbomComponent): void
  (event: 'open-code'): void
}>()

const cbomStore = useCbomStore()
const scan = useScanStore()

interface PropertyPath {
  name: string
  path: string
}

// Ordered list of CycloneDX 1.6 cryptographic-asset paths we surface in the
// "Specification" structured list. Properties whose resolved value is empty
// are filtered out before rendering.
const propertyPaths: PropertyPath[] = [
  { name: 'Asset Type', path: 'cryptoProperties.assetType' },
  { name: 'Primitive', path: 'cryptoProperties.algorithmProperties.primitive' },
  {
    name: 'Parameter Set Identifier',
    path: 'cryptoProperties.algorithmProperties.parameterSetIdentifier',
  },
  { name: 'Curve', path: 'cryptoProperties.algorithmProperties.curve' },
  {
    name: 'Execution Environment',
    path: 'cryptoProperties.algorithmProperties.executionEnvironment',
  },
  {
    name: 'Implementation Platform',
    path: 'cryptoProperties.algorithmProperties.implementationPlatform',
  },
  {
    name: 'Certification Level',
    path: 'cryptoProperties.algorithmProperties.certificationLevel',
  },
  { name: 'Mode', path: 'cryptoProperties.algorithmProperties.mode' },
  { name: 'Padding', path: 'cryptoProperties.algorithmProperties.padding' },
  { name: 'Crypto Functions', path: 'cryptoProperties.algorithmProperties.cryptoFunctions' },
  {
    name: 'Classical Security Level',
    path: 'cryptoProperties.algorithmProperties.classicalSecurityLevel',
  },
  {
    name: 'NIST Quantum Security Level',
    path: 'cryptoProperties.algorithmProperties.nistQuantumSecurityLevel',
  },
  { name: 'Subject Name', path: 'cryptoProperties.certificateProperties.subjectName' },
  { name: 'Issuer Name', path: 'cryptoProperties.certificateProperties.issuerName' },
  { name: 'Not Valid Before', path: 'cryptoProperties.certificateProperties.notValidBefore' },
  { name: 'Not Valid After', path: 'cryptoProperties.certificateProperties.notValidAfter' },
  {
    name: 'Signature Algorithm Reference',
    path: 'cryptoProperties.certificateProperties.signatureAlgorithmRef',
  },
  {
    name: 'Subject Public Key Reference',
    path: 'cryptoProperties.certificateProperties.subjectPublicKeyRef',
  },
  {
    name: 'Certificate Format',
    path: 'cryptoProperties.certificateProperties.certificateFormat',
  },
  {
    name: 'Certificate Extension',
    path: 'cryptoProperties.certificateProperties.certificateExtension',
  },
  {
    name: 'Material Type',
    path: 'cryptoProperties.relatedCryptoMaterialProperties.type',
  },
  { name: 'Material ID', path: 'cryptoProperties.relatedCryptoMaterialProperties.id' },
  { name: 'State', path: 'cryptoProperties.relatedCryptoMaterialProperties.state' },
  {
    name: 'Algorithm Reference',
    path: 'cryptoProperties.relatedCryptoMaterialProperties.algorithmRef',
  },
  { name: 'Creation Date', path: 'cryptoProperties.relatedCryptoMaterialProperties.creationDate' },
  {
    name: 'Activation Date',
    path: 'cryptoProperties.relatedCryptoMaterialProperties.activationDate',
  },
  { name: 'Update Date', path: 'cryptoProperties.relatedCryptoMaterialProperties.updateDate' },
  {
    name: 'Expiration Date',
    path: 'cryptoProperties.relatedCryptoMaterialProperties.expirationDate',
  },
  { name: 'Value', path: 'cryptoProperties.relatedCryptoMaterialProperties.value' },
  { name: 'Size', path: 'cryptoProperties.relatedCryptoMaterialProperties.size' },
  { name: 'Format', path: 'cryptoProperties.relatedCryptoMaterialProperties.format' },
  { name: 'Secured By', path: 'cryptoProperties.relatedCryptoMaterialProperties.securedBy' },
  { name: 'Protocol Type', path: 'cryptoProperties.protocolProperties.type' },
  { name: 'Protocol Version', path: 'cryptoProperties.protocolProperties.version' },
  { name: 'Cipher Suites', path: 'cryptoProperties.protocolProperties.cipherSuites' },
  {
    name: 'IKEv2 Transform Types',
    path: 'cryptoProperties.protocolProperties.ikev2TransformTypes',
  },
  {
    name: 'Cryptographic References',
    path: 'cryptoProperties.protocolProperties.cryptoRefArray',
  },
  { name: 'OID', path: 'cryptoProperties.oid' },
  { name: 'BOM Reference', path: 'bom-ref' },
]

function values(path: string): unknown[] | undefined {
  if (!props.asset) return undefined
  const v = resolvePath(props.asset, path)
  if (v === undefined || v === null) return undefined
  return Array.isArray(v) ? (v as unknown[]) : [v]
}

const filteredProperties = computed(() =>
  propertyPaths.filter((p) => {
    const vs = values(p.path)
    return vs && vs.length > 0
  }),
)

const bomRef = computed<string | null>(() => {
  const vs = values('bom-ref')
  if (!vs || vs.length !== 1) return null
  return String(vs[0])
})

const hasCodeLocation = computed(
  () => !!getCodeLink(props.asset ?? ({} as CbomComponent), scan.codeOrigin),
)

const hasCompliance = computed(() => hasValidComplianceResults(cbomStore.policyCheckResult))

const complianceDescription = computed(() =>
  getComplianceDescription(cbomStore.policyCheckResult, props.asset),
)

const policyName = computed(() => getCompliancePolicyName(cbomStore.policyCheckResult))

const findingsWithMessage = computed(() =>
  getComplianceFindingsWithMessage(cbomStore.policyCheckResult, props.asset),
)

function complianceCategory(levelId: number): string {
  return getComplianceObjectFromId(cbomStore.policyCheckResult, levelId)?.label ?? '—'
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(renderValue).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function displayValue(value: unknown): string {
  const raw = renderValue(value)
  const full = getTermFullName(raw)
  return full ?? raw
}

function termDescription(value: unknown): string | undefined {
  return getTermDescription(renderValue(value))
}

function openSubAsset(child: CbomComponent) {
  emit('open-asset', child)
}
</script>

<template>
  <div v-if="asset" class="asset-detail">
    <!-- Code preview -->
    <section class="asset-detail__section">
      <div class="asset-detail__section-header">
        <h4>Code</h4>
        <cds-button
          v-if="hasCodeLocation"
          kind="ghost"
          size="sm"
          class="asset-detail__launch"
          @click="$emit('open-code')"
        >
          View code
          <span slot="icon" class="asset-detail__launch-icon">
            <CarbonIcon :icon="Launch16" />
          </span>
        </cds-button>
      </div>
      <GithubEmbed
        v-if="hasCodeLocation"
        :asset="asset"
        @open-code="$emit('open-code')"
      />
      <div v-else class="asset-detail__no-code">
        No code location has been specified in the CBOM for this cryptographic
        asset. Include code location information in the CBOM (with a public
        repository URL) to preview the source here and open it directly on
        GitHub.
      </div>
    </section>

    <!-- Compliance -->
    <section v-if="hasCompliance" class="asset-detail__section">
      <h4>Compliance</h4>
      <div class="asset-detail__compliance">
        <ComplianceIcon :asset="asset" class="asset-detail__compliance-icon" />
        <div>
          <div class="asset-detail__compliance-label">
            {{ complianceDescription || '—' }}
          </div>
          <div class="asset-detail__compliance-policy">
            Policy: {{ policyName || '—' }}
          </div>
        </div>
      </div>

      <div v-if="findingsWithMessage.length > 0" class="asset-detail__findings">
        <cds-structured-list condensed>
          <cds-structured-list-head>
            <cds-structured-list-header-row>
              <cds-structured-list-header-cell>
                Compliance information
              </cds-structured-list-header-cell>
              <cds-structured-list-header-cell class="asset-detail__cat-col">
                Category
              </cds-structured-list-header-cell>
            </cds-structured-list-header-row>
          </cds-structured-list-head>
          <cds-structured-list-body>
            <cds-structured-list-row
              v-for="(finding, index) in findingsWithMessage"
              :key="index"
            >
              <cds-structured-list-cell>
                {{ finding.message }}
              </cds-structured-list-cell>
              <cds-structured-list-cell>
                {{ complianceCategory(finding.levelId) }}
              </cds-structured-list-cell>
            </cds-structured-list-row>
          </cds-structured-list-body>
        </cds-structured-list>
      </div>
    </section>

    <!-- Dependencies -->
    <section v-if="bomRef" class="asset-detail__section">
      <DependenciesView :bom-ref="bomRef" @open-asset="openSubAsset" />
    </section>

    <!-- Specification -->
    <section v-if="filteredProperties.length > 0" class="asset-detail__section">
      <h4>Specification</h4>
      <cds-structured-list condensed>
        <cds-structured-list-head>
          <cds-structured-list-header-row>
            <cds-structured-list-header-cell class="asset-detail__type-col">
              Type
            </cds-structured-list-header-cell>
            <cds-structured-list-header-cell>Value</cds-structured-list-header-cell>
          </cds-structured-list-header-row>
        </cds-structured-list-head>
        <cds-structured-list-body>
          <cds-structured-list-row
            v-for="property in filteredProperties"
            :key="property.path"
          >
            <cds-structured-list-cell>{{ property.name }}</cds-structured-list-cell>
            <cds-structured-list-cell>
              <div
                v-for="(v, idx) in values(property.path) ?? []"
                :key="idx"
                class="asset-detail__value-row"
              >
                <span :title="termDescription(v)">{{ displayValue(v) }}</span>
              </div>
            </cds-structured-list-cell>
          </cds-structured-list-row>
        </cds-structured-list-body>
      </cds-structured-list>
    </section>
  </div>
</template>

<style scoped>
.asset-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.asset-detail__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-detail__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.asset-detail__section h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.asset-detail__launch-icon {
  width: 16px;
  height: 16px;
  margin-left: 6px;
}

.asset-detail__no-code {
  border: 1px solid var(--cds-border-subtle);
  background: var(--cds-layer-accent);
  border-radius: 4px;
  padding: 14px 16px;
  font-size: 0.8125rem;
  color: var(--cds-text-secondary);
}

.asset-detail__compliance {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 8px;
}

.asset-detail__compliance-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.asset-detail__compliance-label {
  font-size: 1rem;
  color: var(--cds-text-primary);
}

.asset-detail__compliance-policy {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  margin-top: 2px;
}

.asset-detail__findings {
  margin-top: 4px;
}

.asset-detail__value-row {
  padding: 1px 0;
  word-break: break-word;
}

.asset-detail__cat-col {
  width: 25%;
}

.asset-detail__type-col {
  width: 30%;
}
</style>
