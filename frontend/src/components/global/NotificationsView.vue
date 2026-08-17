<script setup lang="ts">
import { computed } from 'vue'
import { useErrorsStore } from '@/stores/errors'
import { ErrorStatus, type ErrorEntry } from '@/types/errors'

interface NotificationDescriptor {
  kind: 'error' | 'warning' | 'info'
  title: string
  description: string
}

const errors = useErrorsStore()

function describe(error: ErrorEntry): NotificationDescriptor {
  switch (error.status) {
    case ErrorStatus.NoConnection:
      return {
        kind: 'error',
        title: 'No connection',
        description: 'Connection to the server has failed. Please try again later.',
      }
    case ErrorStatus.InvalidRepo:
      return {
        kind: 'error',
        title: 'Invalid repository',
        description: 'The provided address does not lead to a readable repository.',
      }
    case ErrorStatus.JsonParsing:
      return {
        kind: 'error',
        title: 'Parsing error',
        description: 'An incorrect JSON file cannot be parsed.',
      }
    case ErrorStatus.ScanError:
      return {
        kind: 'error',
        title: 'Error while scanning',
        description: error.message ?? 'An error occurred during the scan.',
      }
    case ErrorStatus.InvalidCbom:
      return {
        kind: 'error',
        title: 'Invalid CBOM',
        description: 'The provided CBOM does not respect the expected format.',
      }
    case ErrorStatus.IgnoredComponent:
      return {
        kind: 'info',
        title: 'Some components are not shown',
        description:
          'The provided CBOM contains components that are not cryptographic assets. They are not displayed here.',
      }
    case ErrorStatus.MultiUpload:
      return {
        kind: 'error',
        title: 'Multiple upload',
        description: 'Please only upload a single CBOM file.',
      }
    case ErrorStatus.EmptyDatabase:
      return {
        kind: 'warning',
        title: 'Empty database',
        description: 'Connection to the server was successful, but the CBOM database is empty.',
      }
    case ErrorStatus.FallBackLocalComplianceReport:
      return {
        kind: 'warning',
        title: 'Limited compliance results',
        description:
          'An error occurred with the remote compliance service. Falling back to a local compliance report, which may be less detailed.',
      }
    case ErrorStatus.ScanWarning:
      return {
        kind: 'warning',
        title: 'Warning while scanning',
        description: error.message ?? 'A warning was emitted during the scan.',
      }
    default:
      return {
        kind: 'error',
        title: 'Unknown error',
        description: error.message ?? 'An unknown error has occurred.',
      }
  }
}

const items = computed(() =>
  errors.items.map((error, index) => ({ ...describe(error), index })),
)
</script>

<template>
  <div class="notifications" role="region" aria-label="Notifications">
    <cds-toast-notification
      v-for="item in items"
      :key="item.index"
      :kind="item.kind"
      :title="item.title"
      :subtitle="item.description"
      hide-close-button="false"
      close-button-label="Close"
      @cds-notification-closed="errors.closeError(item.index)"
    />
  </div>
</template>

<style scoped>
.notifications {
  position: fixed;
  top: 64px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.notifications :deep(cds-toast-notification) {
  pointer-events: auto;
}
</style>
