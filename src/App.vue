<script setup lang="ts">
import { useBetStore } from './store'
import { parseBets } from './parser'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale)

const store = useBetStore()

function handleFile(e: Event) {
  debugger
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    store.bets = parseBets(text)
  }
  reader.readAsText(file)
}

function profitCurve() {
  let running = 0
  return store.bets.map(b => {
    running += b.result
    return running
  })
}
</script>

<template>
  <div style="padding:20px;max-width:1200px;margin:auto;">
    <h1>Winline Stats</h1>

    <input type="file" @change="handleFile" />

    <div v-if="store.bets.length">
      <h2>Общая статистика</h2>
      <p>Всего ставок: {{ store.totalBets }}</p>
      <p>Выигрышных: {{ store.wins }}</p>
      <p>Проигрышных: {{ store.losses }}</p>
      <p>Winrate: {{ store.winrate.toFixed(2) }}%</p>
      <p>Общая сумма ставок: {{ store.totalStaked }}</p>
      <p>Чистая прибыль: {{ store.totalProfit }}</p>
      <p>ROI: {{ store.roi.toFixed(2) }}%</p>

      <h2>По дисциплинам</h2>
      <div v-for="(val, key) in store.byDiscipline" :key="key">
        {{ key }} — ставок: {{ val.count }}, прибыль: {{ val.profit }}
      </div>

      <h2>По типу</h2>
      <div v-for="(val, key) in store.byType" :key="key">
        {{ key }} — ставок: {{ val.count }}, прибыль: {{ val.profit }}
      </div>

      <h2>По турнирам</h2>
      <div v-for="(val, key) in store.byTournament" :key="key">
        {{ key }} — ставок: {{ val.count }}, прибыль: {{ val.profit }}
      </div>

      <h2>График прибыли</h2>
      <Line
        :data="{
          labels: store.bets.map((_, i) => i + 1),
          datasets: [{ data: profitCurve() }]
        }"
      />
    </div>
  </div>
</template>