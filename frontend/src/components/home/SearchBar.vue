<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScanStore } from '@/stores/scan'
import { connectAndScan } from '@/services/scan'
import CarbonIcon from '@/components/CarbonIcon.vue'
import ArrowRight24 from '@carbon/icons/es/arrow--right/24.js'

const router = useRouter()
const scan = useScanStore()

const advancedOpen = ref(false)
const gitBranch = ref('')
const gitSubfolder = ref('')
const username = ref('')
const passwordOrPAT = ref('')
const activeTab = ref<'scan' | 'auth'>('scan')

function buildAdvancedArgs() {
  if (!advancedOpen.value) return [null, null, null] as const
  const credentials =
    username.value || passwordOrPAT.value
      ? { username: username.value || undefined, passwordOrPAT: passwordOrPAT.value || undefined }
      : null
  return [gitBranch.value || null, gitSubfolder.value || null, credentials] as const
}

function startScan() {
  if (!scan.codeOrigin.scanUrl) return
  const [branch, subfolder, credentials] = buildAdvancedArgs()
  connectAndScan(branch, subfolder, credentials)
  void router.push({ name: 'results' })
}

function onScanUrlInput(event: Event) {
  const target = event.target as HTMLInputElement
  scan.codeOrigin.scanUrl = target.value
}

function onUsernameInput(event: Event) {
  username.value = (event.target as HTMLInputElement).value
}
function onPasswordInput(event: Event) {
  passwordOrPAT.value = (event.target as HTMLInputElement).value
}
function onBranchInput(event: Event) {
  gitBranch.value = (event.target as HTMLInputElement).value
}
function onSubfolderInput(event: Event) {
  gitSubfolder.value = (event.target as HTMLInputElement).value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') startScan()
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar__row">
      <input
        class="search-bar__input"
        type="text"
        :value="scan.codeOrigin.scanUrl ?? ''"
        placeholder="Enter Git URL or Package URL to scan"
        aria-label="Scan target"
        @input="onScanUrlInput"
        @keydown="onKeydown"
      />
      <button
        class="search-bar__button"
        type="button"
        :disabled="!scan.codeOrigin.scanUrl"
        @click="startScan"
      >
        <span>Scan</span>
        <CarbonIcon :icon="ArrowRight24" aria-label="Scan" />
      </button>
    </div>

    <label class="search-bar__toggle">
      <input v-model="advancedOpen" type="checkbox" />
      <span>Advanced options</span>
    </label>

    <Transition name="advanced">
      <div v-show="advancedOpen" class="search-bar__advanced">
        <div class="search-bar__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'scan'"
            class="search-bar__tab"
            :class="{ 'search-bar__tab--active': activeTab === 'scan' }"
            @click="activeTab = 'scan'"
          >
            Scan
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'auth'"
            class="search-bar__tab"
            :class="{ 'search-bar__tab--active': activeTab === 'auth' }"
            @click="activeTab = 'auth'"
          >
            Authentication
          </button>
        </div>
        <div v-if="activeTab === 'scan'" class="search-bar__pane">
          <label>
            <span>Branch</span>
            <input
              type="text"
              :value="gitBranch"
              placeholder="Specify a specific branch"
              @input="onBranchInput"
              @keydown="onKeydown"
            />
          </label>
          <label>
            <span>Subfolder</span>
            <input
              type="text"
              :value="gitSubfolder"
              placeholder="Specify a specific subfolder to scan"
              @input="onSubfolderInput"
              @keydown="onKeydown"
            />
          </label>
        </div>
        <div v-else class="search-bar__pane">
          <label>
            <span>Username</span>
            <input
              type="text"
              :value="username"
              placeholder="If using an access token (PAT), leave blank"
              @input="onUsernameInput"
              @keydown="onKeydown"
            />
          </label>
          <label>
            <span>Password / Access Token (PAT)</span>
            <input
              type="password"
              :value="passwordOrPAT"
              placeholder="Password or access token for authentication"
              @input="onPasswordInput"
              @keydown="onKeydown"
            />
          </label>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-bar__row {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.search-bar__input {
  flex: 1;
  appearance: none;
  background: var(--cds-field);
  color: var(--cds-text-primary);
  border: 1px solid var(--cds-border-subtle);
  padding: 0 16px;
  height: 40px;
  font-size: 0.875rem;
}

.search-bar__input:focus {
  outline: 2px solid var(--cds-focus, #0f62fe);
  outline-offset: -2px;
}

.search-bar__button {
  appearance: none;
  background: var(--cds-button-primary, #0f62fe);
  color: var(--cds-text-on-color, #fff);
  border: 0;
  padding: 0 16px;
  min-width: 110px;
  height: 40px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.search-bar__button:disabled {
  background: var(--cds-button-disabled, #6f6f6f);
  cursor: not-allowed;
}

.search-bar__button svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.search-bar__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cds-text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
}

.search-bar__advanced {
  border-top: 1px solid var(--cds-border-subtle);
  margin-top: 8px;
  padding-top: 12px;
}

.search-bar__tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.search-bar__tab {
  appearance: none;
  background: transparent;
  color: var(--cds-text-secondary);
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 6px 4px;
  font-size: 0.8125rem;
  cursor: pointer;
}

.search-bar__tab--active {
  color: var(--cds-text-primary);
  border-bottom-color: var(--cds-focus, #0f62fe);
}

.search-bar__pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-bar__pane label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.search-bar__pane input {
  appearance: none;
  background: var(--cds-field);
  color: var(--cds-text-primary);
  border: 1px solid var(--cds-border-subtle);
  padding: 8px 12px;
  font-size: 0.875rem;
}

.advanced-enter-active,
.advanced-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.advanced-enter-from,
.advanced-leave-to {
  max-height: 0;
  opacity: 0;
}

.advanced-enter-to,
.advanced-leave-from {
  max-height: 320px;
  opacity: 1;
}
</style>
