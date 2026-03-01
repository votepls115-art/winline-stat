<script setup lang="ts">
import { Line } from 'vue-chartjs'
import StatsList from '../shared/StatsList.vue'

defineProps<{
  betsCount: number
  handleBetsFile: (event: Event) => void
  minDate: Date | null
  maxDate: Date | null
  formatDate: (date: Date) => string
  periodMode: 'all' | 'month' | 'week' | 'custom'
  selectedMonth: string
  selectedWeek: string
  customStart: string
  customEnd: string
  monthOptions: Array<{ value: string; label: string }>
  weekOptions: Array<{ value: string; label: string }>
  totalBets: number
  wins: number
  losses: number
  winrate: number
  totalStaked: number
  totalProfit: number
  roi: number
  formatCurrency: (value: number) => string
  statSortMode: 'alphabet' | 'profit' | 'count'
  statSortDirection: 'asc' | 'desc'
  byDiscipline: Array<[string, { count: number; profit: number }]>
  byType: Array<[string, { count: number; profit: number }]>
  byTournament: Array<[string, { count: number; profit: number }]>
  chartData: {
    labels: number[]
    datasets: Array<{ label: string; data: number[] }>
  }
}>()

const emit = defineEmits<{
  (event: 'update:periodMode', value: 'all' | 'month' | 'week' | 'custom'): void
  (event: 'update:selectedMonth', value: string): void
  (event: 'update:selectedWeek', value: string): void
  (event: 'update:customStart', value: string): void
  (event: 'update:customEnd', value: string): void
  (event: 'update:statSortMode', value: 'alphabet' | 'profit' | 'count'): void
  (event: 'update:statSortDirection', value: 'asc' | 'desc'): void
}>()
</script>

<template>
  <section class="panel">
    <div class="file-row section-card">
      <p><strong>Файл по умолчанию:</strong> <code>public/data/default-bets.txt</code></p>
      <input type="file" @change="handleBetsFile" />
    </div>

    <div v-if="betsCount">
      <h2 class="section-title">Фильтры периода</h2>
      <p class="muted-text">
        Доступный диапазон дат:
        <strong>{{ minDate ? formatDate(minDate) : '-' }}</strong>
        —
        <strong>{{ maxDate ? formatDate(maxDate) : '-' }}</strong>
      </p>

      <div class="filters-grid">
        <label>
          Период:
          <select :value="periodMode" @change="emit('update:periodMode', ($event.target as HTMLSelectElement).value as any)">
            <option value="all">Весь период</option>
            <option value="month">По месяцам</option>
            <option value="week">По неделям</option>
            <option value="custom">Свой период</option>
          </select>
        </label>

        <label v-if="periodMode === 'month'">
          Месяц:
          <select :value="selectedMonth" @change="emit('update:selectedMonth', ($event.target as HTMLSelectElement).value)">
            <option v-for="option in monthOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label v-if="periodMode === 'week'">
          Неделя:
          <select :value="selectedWeek" @change="emit('update:selectedWeek', ($event.target as HTMLSelectElement).value)">
            <option v-for="option in weekOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <template v-if="periodMode === 'custom'">
          <label>
            С:
            <input
              :value="customStart"
              type="date"
              :min="minDate ? formatDate(minDate) : undefined"
              :max="maxDate ? formatDate(maxDate) : undefined"
              @input="emit('update:customStart', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label>
            По:
            <input
              :value="customEnd"
              type="date"
              :min="minDate ? formatDate(minDate) : undefined"
              :max="maxDate ? formatDate(maxDate) : undefined"
              @input="emit('update:customEnd', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </template>
      </div>

      <h2 class="section-title">Общая статистика ставок</h2>
      <div class="stats-grid">
        <div class="stat-item"><span>Всего ставок</span><strong>{{ totalBets }}</strong></div>
        <div class="stat-item"><span>Выигрышных</span><strong>{{ wins }}</strong></div>
        <div class="stat-item"><span>Проигрышных</span><strong>{{ losses }}</strong></div>
        <div class="stat-item"><span>Winrate</span><strong>{{ winrate.toFixed(2) }}%</strong></div>
        <div class="stat-item"><span>Общая сумма ставок</span><strong>{{ formatCurrency(totalStaked) }}</strong></div>
        <div class="stat-item"><span>Чистая прибыль</span><strong>{{ formatCurrency(totalProfit) }}</strong></div>
        <div class="stat-item"><span>ROI</span><strong>{{ roi.toFixed(2) }}%</strong></div>
      </div>

      <h2 class="section-title">Сортировка статистик</h2>
      <div class="filters-grid">
        <label>
          По:
          <select :value="statSortMode" @change="emit('update:statSortMode', ($event.target as HTMLSelectElement).value as any)">
            <option value="profit">По прибыли (цифра)</option>
            <option value="count">По количеству ставок (цифра)</option>
            <option value="alphabet">По алфавиту</option>
          </select>
        </label>
        <label>
          Порядок:
          <select :value="statSortDirection" @change="emit('update:statSortDirection', ($event.target as HTMLSelectElement).value as any)">
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </label>
      </div>

      <StatsList title="По дисциплинам" :entries="byDiscipline" :format-currency="formatCurrency" />
      <StatsList title="По типу" :entries="byType" :format-currency="formatCurrency" />
      <StatsList title="По турнирам" :entries="byTournament" :format-currency="formatCurrency" />

      <h2 class="section-title">График прибыли</h2>
      <div class="chart-box">
        <Line :data="chartData" />
      </div>
    </div>
  </section>
</template>
