<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useBetStore } from './store'
import { parseBets } from './parser'
import { parseFinanceOperations } from './parser-finance'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js'
import type { Bet, FinanceOperation } from './types'
import financeDataRaw from '../deposit-2-month.txt?raw'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale)

const DEFAULT_DATASET_PATH = '/data/default-bets.txt'

const store = useBetStore()
const activeTab = ref<'bets' | 'finance'>('bets')

const periodMode = ref<'all' | 'month' | 'week' | 'custom'>('all')
const selectedMonth = ref('')
const selectedWeek = ref('')
const customStart = ref('')
const customEnd = ref('')

const financeOperations = ref<FinanceOperation[]>([])
const financePeriodMode = ref<'all' | 'month' | 'year'>('all')
const selectedFinanceMonth = ref('')
const selectedFinanceYear = ref('')

const statSortMode = ref<'alphabet' | 'profit' | 'count'>('profit')
const statSortDirection = ref<'asc' | 'desc'>('desc')

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekEnd(date: Date): Date {
  const d = weekStart(date)
  d.setDate(d.getDate() + 6)
  return d
}

const minDate = computed(() => {
  const firstBet = store.bets[0]
  return firstBet ? new Date(firstBet.date) : null
})

const maxDate = computed(() => {
  const lastBet = store.bets.length ? store.bets[store.bets.length - 1] : null
  return lastBet ? new Date(lastBet.date) : null
})

const monthOptions = computed(() => {
  const map = new Map<string, string>()
  for (const bet of store.bets) {
    const key = `${bet.date.getFullYear()}-${String(bet.date.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, key)
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

const weekOptions = computed(() => {
  const map = new Map<string, string>()
  for (const bet of store.bets) {
    const start = weekStart(bet.date)
    const end = weekEnd(bet.date)
    const value = formatDate(start)
    const label = `${formatDate(start)} — ${formatDate(end)}`
    if (!map.has(value)) map.set(value, label)
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

watch(monthOptions, (options) => {
  if (!selectedMonth.value && options.length) {
    const last = options[options.length - 1]
    if (last) selectedMonth.value = last.value
  }
})

watch(weekOptions, (options) => {
  if (!selectedWeek.value && options.length) {
    const last = options[options.length - 1]
    if (last) selectedWeek.value = last.value
  }
})

watch([minDate, maxDate], ([min, max]) => {
  if (min && !customStart.value) customStart.value = formatDate(min)
  if (max && !customEnd.value) customEnd.value = formatDate(max)
})

const filteredBets = computed(() => {
  if (periodMode.value === 'all') return store.bets

  if (periodMode.value === 'month' && selectedMonth.value) {
    return store.bets.filter((bet) => {
      const key = `${bet.date.getFullYear()}-${String(bet.date.getMonth() + 1).padStart(2, '0')}`
      return key === selectedMonth.value
    })
  }

  if (periodMode.value === 'week' && selectedWeek.value) {
    return store.bets.filter((bet) => formatDate(weekStart(bet.date)) === selectedWeek.value)
  }

  if (periodMode.value === 'custom' && customStart.value && customEnd.value) {
    const start = new Date(`${customStart.value}T00:00:00`)
    const end = new Date(`${customEnd.value}T23:59:59`)
    return store.bets.filter((bet) => bet.date >= start && bet.date <= end)
  }

  return store.bets
})

function aggregateBy(items: Bet[], key: (bet: Bet) => string) {
  const map: Record<string, { count: number; profit: number }> = {}

  for (const bet of items) {
    const bucket = key(bet)
    if (!map[bucket]) map[bucket] = { count: 0, profit: 0 }
    map[bucket].count += 1
    map[bucket].profit += bet.result
  }

  return map
}

function sortStatsEntries(entries: Array<[string, { count: number; profit: number }]>) {
  const sorted = [...entries]

  sorted.sort((a, b) => {
    if (statSortMode.value === 'alphabet') {
      return a[0].localeCompare(b[0], 'ru')
    }

    if (statSortMode.value === 'count') {
      return a[1].count - b[1].count
    }

    return a[1].profit - b[1].profit
  })

  if (statSortDirection.value === 'desc') {
    sorted.reverse()
  }

  return sorted
}

const totalBets = computed(() => filteredBets.value.length)
const wins = computed(() => filteredBets.value.filter((bet) => bet.result > 0).length)
const losses = computed(() => filteredBets.value.filter((bet) => bet.result < 0).length)
const totalStaked = computed(() => filteredBets.value.reduce((sum, bet) => sum + bet.amount, 0))
const totalProfit = computed(() => filteredBets.value.reduce((sum, bet) => sum + bet.result, 0))
const roi = computed(() => (totalStaked.value ? (totalProfit.value / totalStaked.value) * 100 : 0))
const winrate = computed(() => (totalBets.value ? (wins.value / totalBets.value) * 100 : 0))

const byType = computed(() => sortStatsEntries(Object.entries(aggregateBy(filteredBets.value, (bet) => bet.type))))
const byDiscipline = computed(() =>
  sortStatsEntries(Object.entries(aggregateBy(filteredBets.value, (bet) => bet.discipline))),
)
const byTournament = computed(() =>
  sortStatsEntries(
    Object.entries(aggregateBy(filteredBets.value, (bet) => `${bet.tournament} (${bet.discipline})`)),
  ),
)

const chartData = computed(() => {
  let running = 0
  const values = filteredBets.value.map((bet) => {
    running += bet.result
    return running
  })

  return {
    labels: filteredBets.value.map((_, i) => i + 1),
    datasets: [{ label: 'Накопленная чистая прибыль', data: values }],
  }
})

const financeDateMin = computed(() => financeOperations.value[0]?.date ?? null)
const financeDateMax = computed(() =>
  financeOperations.value.length ? financeOperations.value[financeOperations.value.length - 1]?.date ?? null : null,
)

const financeMonthOptions = computed(() => {
  const map = new Map<string, string>()
  for (const operation of financeOperations.value) {
    const key = `${operation.date.getFullYear()}-${String(operation.date.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, key)
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

const financeYearOptions = computed(() => {
  const years = new Set(financeOperations.value.map((operation) => String(operation.date.getFullYear())))
  return [...years].sort().map((value) => ({ value, label: value }))
})

watch(financeMonthOptions, (options) => {
  if (!selectedFinanceMonth.value && options.length) {
    const last = options[options.length - 1]
    if (last) selectedFinanceMonth.value = last.value
  }
})

watch(financeYearOptions, (options) => {
  if (!selectedFinanceYear.value && options.length) {
    const last = options[options.length - 1]
    if (last) selectedFinanceYear.value = last.value
  }
})

const filteredFinanceOperations = computed(() => {
  if (financePeriodMode.value === 'all') return financeOperations.value

  if (financePeriodMode.value === 'month' && selectedFinanceMonth.value) {
    return financeOperations.value.filter((operation) => {
      const key = `${operation.date.getFullYear()}-${String(operation.date.getMonth() + 1).padStart(2, '0')}`
      return key === selectedFinanceMonth.value
    })
  }

  if (financePeriodMode.value === 'year' && selectedFinanceYear.value) {
    return financeOperations.value.filter(
      (operation) => String(operation.date.getFullYear()) === selectedFinanceYear.value,
    )
  }

  return financeOperations.value
})

const depositOperations = computed(() =>
  filteredFinanceOperations.value.filter((operation) => operation.type === 'deposit'),
)
const withdrawalOperations = computed(() =>
  filteredFinanceOperations.value.filter((operation) => operation.type === 'withdrawal'),
)

const depositsCount = computed(() => depositOperations.value.length)
const withdrawalsCount = computed(() => withdrawalOperations.value.length)
const depositsTotal = computed(() =>
  depositOperations.value.reduce((sum, operation) => sum + operation.amount, 0),
)
const withdrawalsTotal = computed(() =>
  withdrawalOperations.value.reduce((sum, operation) => sum + operation.amount, 0),
)

const averageDeposit = computed(() => (depositsCount.value ? depositsTotal.value / depositsCount.value : 0))
const averageWithdrawal = computed(() =>
  withdrawalsCount.value ? withdrawalsTotal.value / withdrawalsCount.value : 0,
)
const netCashflow = computed(() => withdrawalsTotal.value - depositsTotal.value)
const totalBetProfitAllTime = computed(() => store.bets.reduce((sum, bet) => sum + bet.result, 0))

async function loadBetsFromText(text: string) {
  store.bets = parseBets(text)
}

async function loadDefaultData() {
  const response = await fetch(DEFAULT_DATASET_PATH)
  if (!response.ok) return

  const text = await response.text()
  await loadBetsFromText(text)
}

function loadFinanceData() {
  financeOperations.value = parseFinanceOperations(financeDataRaw)
}

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    await loadBetsFromText((reader.result as string) || '')
  }
  reader.readAsText(file)
}

onMounted(async () => {
  await loadDefaultData()
  loadFinanceData()
})
</script>

<template>
  <div style="padding: 20px; max-width: 1200px; margin: auto">
    <h1>Winline Stats</h1>

    <div style="display: flex; gap: 12px; margin-bottom: 16px">
      <button @click="activeTab = 'bets'">Разбор ставок</button>
      <button @click="activeTab = 'finance'">Финансовый контроль</button>
    </div>

    <div v-if="activeTab === 'bets'">
      <p><strong>Файл по умолчанию:</strong> <code>public/data/default-bets.txt</code></p>
      <input type="file" @change="handleFile" />

      <div v-if="store.bets.length">
        <h2>Фильтры периода</h2>
        <p>
          Доступный диапазон дат:
          <strong>{{ minDate ? formatDate(minDate) : '-' }}</strong>
          —
          <strong>{{ maxDate ? formatDate(maxDate) : '-' }}</strong>
        </p>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
          <label>
            Период:
            <select v-model="periodMode">
              <option value="all">Весь период</option>
              <option value="month">По месяцам</option>
              <option value="week">По неделям</option>
              <option value="custom">Свой период</option>
            </select>
          </label>

          <label v-if="periodMode === 'month'">
            Месяц:
            <select v-model="selectedMonth">
              <option v-for="option in monthOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label v-if="periodMode === 'week'">
            Неделя:
            <select v-model="selectedWeek">
              <option v-for="option in weekOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <template v-if="periodMode === 'custom'">
            <label>
              С:
              <input
                v-model="customStart"
                type="date"
                :min="minDate ? formatDate(minDate) : undefined"
                :max="maxDate ? formatDate(maxDate) : undefined"
              />
            </label>
            <label>
              По:
              <input
                v-model="customEnd"
                type="date"
                :min="minDate ? formatDate(minDate) : undefined"
                :max="maxDate ? formatDate(maxDate) : undefined"
              />
            </label>
          </template>
        </div>

        <h2>Общая статистика ставок</h2>
        <p>Всего ставок: {{ totalBets }}</p>
        <p>Выигрышных: {{ wins }}</p>
        <p>Проигрышных: {{ losses }}</p>
        <p>Winrate: {{ winrate.toFixed(2) }}%</p>
        <p>Общая сумма ставок: {{ totalStaked.toFixed(2) }}</p>
        <p>Чистая прибыль: {{ totalProfit.toFixed(2) }}</p>
        <p>ROI: {{ roi.toFixed(2) }}%</p>

        <h2>Сортировка статистик</h2>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
          <label>
            По:
            <select v-model="statSortMode">
              <option value="profit">По прибыли (цифра)</option>
              <option value="count">По количеству ставок (цифра)</option>
              <option value="alphabet">По алфавиту</option>
            </select>
          </label>
          <label>
            Порядок:
            <select v-model="statSortDirection">
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </label>
        </div>

        <h2>По дисциплинам</h2>
        <div v-for="[key, val] in byDiscipline" :key="key">
          {{ key }} — ставок: {{ val.count }}, чистая прибыль: {{ val.profit.toFixed(2) }}
        </div>

        <h2>По типу</h2>
        <div v-for="[key, val] in byType" :key="key">
          {{ key }} — ставок: {{ val.count }}, чистая прибыль: {{ val.profit.toFixed(2) }}
        </div>

        <h2>По турнирам</h2>
        <div v-for="[key, val] in byTournament" :key="key">
          {{ key }} — ставок: {{ val.count }}, чистая прибыль: {{ val.profit.toFixed(2) }}
        </div>

        <h2>График прибыли</h2>
        <Line :data="chartData" />
      </div>
    </div>

    <div v-else>
      <h2>Финансовая статистика</h2>
      <p>
        Диапазон операций:
        <strong>{{ financeDateMin ? formatDate(financeDateMin) : '-' }}</strong>
        —
        <strong>{{ financeDateMax ? formatDate(financeDateMax) : '-' }}</strong>
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
        <label>
          Период:
          <select v-model="financePeriodMode">
            <option value="all">За все время</option>
            <option value="month">За месяц</option>
            <option value="year">За год</option>
          </select>
        </label>

        <label v-if="financePeriodMode === 'month'">
          Месяц:
          <select v-model="selectedFinanceMonth">
            <option v-for="option in financeMonthOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label v-if="financePeriodMode === 'year'">
          Год:
          <select v-model="selectedFinanceYear">
            <option v-for="option in financeYearOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <h3>Оценка стоит ли продолжать</h3>
      <p>Чистая прибыль по ставкам (по файлу ставок): {{ totalBetProfitAllTime.toFixed(2) }}</p>
      <p>Количество пополнений: {{ depositsCount }}</p>
      <p>Количество выводов: {{ withdrawalsCount }}</p>
      <p>Среднее пополнение: {{ averageDeposit.toFixed(2) }}</p>
      <p>Средний вывод: {{ averageWithdrawal.toFixed(2) }}</p>
      <p>Сумма всех пополнений: {{ depositsTotal.toFixed(2) }}</p>
      <p>Сумма всех выводов: {{ withdrawalsTotal.toFixed(2) }}</p>
      <p>Чистая прибыль по движению средств (выводы - пополнения): {{ netCashflow.toFixed(2) }}</p>
    </div>
  </div>
</template>
