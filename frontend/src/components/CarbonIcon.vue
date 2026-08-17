<script setup lang="ts">
import { computed } from 'vue'

interface CarbonIconAttrs {
  [key: string]: string | number
}

interface CarbonIconContent {
  elem: string
  attrs: CarbonIconAttrs
}

interface CarbonIconDescriptor {
  elem: string
  attrs: CarbonIconAttrs
  content: CarbonIconContent[]
  name: string
  size: number
}

const props = defineProps<{
  icon: CarbonIconDescriptor
  ariaLabel?: string
}>()

const ariaLabel = computed(() => props.ariaLabel ?? props.icon.name)
</script>

<template>
  <svg
    v-bind="icon.attrs"
    :aria-label="ariaLabel"
    role="img"
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
  >
    <component :is="child.elem" v-for="(child, index) in icon.content" :key="index" v-bind="child.attrs" />
  </svg>
</template>
