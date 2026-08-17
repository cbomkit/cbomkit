<script setup lang="ts">
import { ref } from 'vue'
import CarbonIcon from '@/components/CarbonIcon.vue'
import { useErrorsStore } from '@/stores/errors'
import { showResultFromUpload } from '@/lib/cbom'
import { getComplianceReport } from '@/services/api'
import { isViewerOnly } from '@/config'
import { ErrorStatus } from '@/types/errors'
import type { Cbom } from '@/types/cbom'

import CloudUpload24 from '@carbon/icons/es/cloud--upload/24.js'

const emit = defineEmits<{ (event: 'uploaded'): void }>()
const errors = useErrorsStore()
const inputRef = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)
const errorMessage = ref<string | null>(null)

const title = isViewerOnly() ? 'Drop a CBOM here to visualize it' : 'Drop a CBOM here'
const subtitle = '(or click to browse)'

function pickFile() {
  inputRef.value?.click()
}

function readFile(file: File) {
  errorMessage.value = null
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const cbom = JSON.parse(String(reader.result)) as Cbom
      showResultFromUpload(cbom, file.name)
      void getComplianceReport(cbom)
      emit('uploaded')
    } catch (error) {
      console.error('Error reading uploaded file', error)
      errorMessage.value = 'Please upload a valid JSON file.'
    }
  }
  reader.onerror = () => {
    errorMessage.value = 'Could not read the file.'
  }
  reader.readAsText(file)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  if (files.length > 1) {
    errors.addError(ErrorStatus.MultiUpload)
    errorMessage.value = 'Please upload a single CBOM file.'
    input.value = ''
    return
  }
  readFile(files[0])
  input.value = ''
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDraggingOver.value = false
  const items = event.dataTransfer?.files
  if (!items || items.length === 0) return
  if (items.length > 1) {
    errors.addError(ErrorStatus.MultiUpload)
    errorMessage.value = 'Please upload a single CBOM file.'
    return
  }
  readFile(items[0])
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDraggingOver.value = true
}

function onDragLeave() {
  isDraggingOver.value = false
}
</script>

<template>
  <div
    class="file-uploader"
    :class="{ 'file-uploader--over': isDraggingOver }"
    role="button"
    tabindex="0"
    @click="pickFile"
    @keydown.enter="pickFile"
    @keydown.space.prevent="pickFile"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <CarbonIcon :icon="CloudUpload24" aria-label="Upload" />
    <div class="file-uploader__text">
      <div class="file-uploader__title">{{ title }}</div>
      <div class="file-uploader__subtitle">{{ subtitle }}</div>
    </div>
    <input
      ref="inputRef"
      type="file"
      accept="application/json,.json"
      hidden
      @change="onChange"
    />
    <p v-if="errorMessage" class="file-uploader__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.file-uploader {
  border: 2px dashed var(--cds-border-strong);
  background: var(--cds-layer);
  padding: 28px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.file-uploader:hover,
.file-uploader--over {
  background: var(--cds-layer-hover);
  border-color: var(--cds-focus);
}

.file-uploader svg {
  width: 32px;
  height: 32px;
  fill: var(--cds-text-primary);
}

.file-uploader__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-uploader__title {
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--cds-text-primary);
}

.file-uploader__subtitle {
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
}

.file-uploader__error {
  margin: 0 0 0 auto;
  color: var(--cds-support-error, #da1e28);
  font-size: 0.875rem;
}
</style>
