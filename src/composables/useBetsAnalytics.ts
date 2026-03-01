import { computed, ref, watch } from 'vue'
import type { Bet } from '../types'
import { formatDate, weekEnd, weekStart } from '../utils/format'

export type PeriodMode = 'all' | 'month' | 'week' | 'custom'
export type SortMode = 'alphabet' | 'profit' | 'count'
export type SortDirection = 'asc' | 'desc'

export interface StatsValue {
  count: number
  profit: number
}

export function useBetsAnalytics(source: () => Bet[]) {
  const periodMode = ref<PeriodMode>('all')
  const selectedMonth = ref('')
  const selectedWeek = ref('')
  const customStart = ref('')
  const customEnd = ref('')

  const statSortMode = ref<SortMode>('profit')
  const statSortDirection = ref<SortDirection>('desc')

  const minDate = computed(() => {
    const firstBet = source()[0]
    return firstBet ? new Date(firstBet.date) : null
  })

  const maxDate = computed(() => {
    const bets = source()
    const lastBet = bets.length ? bets[bets.length - 1] : null
    return lastBet ? new Date(lastBet.date) : null
  })

  const monthOptions = computed(() => {
    const map = new Map<string, string>()
    for (const bet of source()) {
      const key = `${bet.date.getFullYear()}-${String(bet.date.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, key)
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  })

  const weekOptions = computed(() => {
    const map = new Map<string, string>()
    for (const bet of source()) {
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
      selectedMonth.value = options[options.length - 1]!.value
    }
  })

  watch(weekOptions, (options) => {
    if (!selectedWeek.value && options.length) {
      selectedWeek.value = options[options.length - 1]!.value
    }
  })

  watch([minDate, maxDate], ([min, max]) => {
    if (min && !customStart.value) customStart.value = formatDate(min)
    if (max && !customEnd.value) customEnd.value = formatDate(max)
  })

  const filteredBets = computed(() => {
    const bets = source()
    if (periodMode.value === 'all') return bets

    if (periodMode.value === 'month' && selectedMonth.value) {
      return bets.filter((bet) => {
        const key = `${bet.date.getFullYear()}-${String(bet.date.getMonth() + 1).padStart(2, '0')}`
        return key === selectedMonth.value
      })
    }

    if (periodMode.value === 'week' && selectedWeek.value) {
      return bets.filter((bet) => formatDate(weekStart(bet.date)) === selectedWeek.value)
    }

    if (periodMode.value === 'custom' && customStart.value && customEnd.value) {
      const start = new Date(`${customStart.value}T00:00:00`)
      const end = new Date(`${customEnd.value}T23:59:59`)
      return bets.filter((bet) => bet.date >= start && bet.date <= end)
    }

    return bets
  })

  function aggregateBy(items: Bet[], key: (bet: Bet) => string): Record<string, StatsValue> {
    const map: Record<string, StatsValue> = {}
    for (const bet of items) {
      const bucket = key(bet)
      if (!map[bucket]) map[bucket] = { count: 0, profit: 0 }
      map[bucket].count += 1
      map[bucket].profit += bet.result
    }
    return map
  }

  function sortStatsEntries(entries: Array<[string, StatsValue]>) {
    const sorted = [...entries]

    sorted.sort((a, b) => {
      if (statSortMode.value === 'alphabet') return a[0].localeCompare(b[0], 'ru')
      if (statSortMode.value === 'count') return a[1].count - b[1].count
      return a[1].profit - b[1].profit
    })

    if (statSortDirection.value === 'desc') sorted.reverse()
    return sorted
  }

  const totalBets = computed(() => filteredBets.value.length)
  const wins = computed(() => filteredBets.value.filter((bet) => bet.result > 0).length)
  const losses = computed(() => filteredBets.value.filter((bet) => bet.result < 0).length)
  const totalStaked = computed(() => filteredBets.value.reduce((sum, bet) => sum + bet.amount, 0))
  const totalProfit = computed(() => filteredBets.value.reduce((sum, bet) => sum + bet.result, 0))
  const roi = computed(() => (totalStaked.value ? (totalProfit.value / totalStaked.value) * 100 : 0))
  const winrate = computed(() => (totalBets.value ? (wins.value / totalBets.value) * 100 : 0))

  const byType = computed(() =>
    sortStatsEntries(Object.entries(aggregateBy(filteredBets.value, (bet) => bet.type))),
  )
  const byDiscipline = computed(() =>
    sortStatsEntries(Object.entries(aggregateBy(filteredBets.value, (bet) => bet.discipline))),
  )
  const byTournament = computed(() =>
    sortStatsEntries(
      Object.entries(aggregateBy(filteredBets.value, (bet) => `${bet.tournament} (${bet.type})`)),
    ),
  )

  const chartData = computed(() => {
    let running = 0
    const values = filteredBets.value.map((bet) => {
      running += bet.result
      return running
    })

    return {
      labels: filteredBets.value.map((_, index) => index + 1),
      datasets: [{ label: 'Накопленная чистая прибыль', data: values }],
    }
  })

  return {
    periodMode,
    selectedMonth,
    selectedWeek,
    customStart,
    customEnd,
    statSortMode,
    statSortDirection,
    minDate,
    maxDate,
    monthOptions,
    weekOptions,
    filteredBets,
    totalBets,
    wins,
    losses,
    totalStaked,
    totalProfit,
    roi,
    winrate,
    byType,
    byDiscipline,
    byTournament,
    chartData,
  }
}
