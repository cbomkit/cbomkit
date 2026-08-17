import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemePreference = 'auto' | 'light' | 'dark'

export const useAppStore = defineStore('app', () => {
  const themePreference = ref<ThemePreference>('auto')
  const osPrefersDark = ref(false)

  const useDarkMode = computed(() => {
    if (themePreference.value === 'dark') return true
    if (themePreference.value === 'light') return false
    return osPrefersDark.value
  })

  const carbonChartTheme = computed<'g100' | 'white'>(() =>
    useDarkMode.value ? 'g100' : 'white',
  )

  const themeClassName = computed(() =>
    useDarkMode.value ? 'make-the-carbon-theme-go-dark' : 'make-the-carbon-theme-go-white',
  )

  function cycleTheme() {
    if (themePreference.value === 'auto') themePreference.value = 'light'
    else if (themePreference.value === 'light') themePreference.value = 'dark'
    else themePreference.value = 'auto'
  }

  function setOsPrefersDark(value: boolean) {
    osPrefersDark.value = value
  }

  return {
    themePreference,
    osPrefersDark,
    useDarkMode,
    carbonChartTheme,
    themeClassName,
    cycleTheme,
    setOsPrefersDark,
  }
})
