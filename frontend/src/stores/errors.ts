import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ErrorStatus, type ErrorEntry } from '@/types/errors'

export const useErrorsStore = defineStore('errors', () => {
  const items = ref<ErrorEntry[]>([])

  function addError(status: ErrorStatus | null, message?: string) {
    items.value.push({ status, message })
  }

  function closeError(index: number) {
    items.value.splice(index, 1)
  }

  function clear() {
    items.value = []
  }

  return { items, addError, closeError, clear }
})
