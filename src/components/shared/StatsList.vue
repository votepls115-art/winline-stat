<script setup lang="ts">
defineProps<{
  title: string
  entries: Array<[string, { count: number; profit: number }]>
  formatCurrency: (value: number) => string
}>()
</script>

<template>
  <h2 class="section-title">{{ title }}</h2>
  <div v-for="[key, val] in entries" :key="key" class="list-row">
    <span class="list-key">{{ key }}</span>
    <span class="list-value">Ставок: <strong>{{ val.count }}</strong></span>
    <span class="list-value">Чистая прибыль: <strong>{{ formatCurrency(val.profit) }}</strong></span>
  </div>
</template>
