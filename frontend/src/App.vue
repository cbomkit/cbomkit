<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { getTitle } from '@/config'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import FooterView from '@/components/layout/FooterView.vue'
import NotificationsView from '@/components/global/NotificationsView.vue'

const app = useAppStore()
document.title = getTitle()

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function syncOsPreference(event: MediaQueryListEvent | MediaQueryList) {
  app.setOsPrefersDark(event.matches)
}

onMounted(() => {
  syncOsPreference(mediaQuery)
  mediaQuery.addEventListener('change', syncOsPreference)
})

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', syncOsPreference)
})

watch(
  () => app.themeClassName,
  (next, prev) => {
    if (prev) document.documentElement.classList.remove(prev)
    document.documentElement.classList.add(next)
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell">
    <HeaderBar />
    <NotificationsView />
    <main class="app-main">
      <RouterView />
    </main>
    <FooterView />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 4% 1%;
}
</style>
