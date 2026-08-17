import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useCbomStore } from '@/stores/cbom'
import { useScanStore } from '@/stores/scan'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/views/ResultsView.vue'),
    beforeEnter: () => {
      const cbomStore = useCbomStore()
      const scanStore = useScanStore()
      // Allow the results page while a scan is in progress (the page renders
      // the live feed) or when a CBOM has been loaded.
      if (cbomStore.cbom || scanStore.isScanning || scanStore.scanningStatus) return true
      return { name: 'home' }
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
