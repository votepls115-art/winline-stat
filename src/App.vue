<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js'
import { useBetStore } from './store'
import { parseBets } from './parser'
import { parseFinanceOperations } from './parser-finance'
import type { FinanceOperation } from './types'
import AppHeader from './components/layout/AppHeader.vue'
import BetsTab from './components/bets/BetsTab.vue'
import FinanceTab from './components/finance/FinanceTab.vue'
import { formatCurrency, formatDate } from './utils/format'
import { useBetsAnalytics } from './composables/useBetsAnalytics'
import { useFinanceAnalytics } from './composables/useFinanceAnalytics'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale)

const DEFAULT_BETS_DATASET_PATH = '/data/default-bets.txt'
const DEFAULT_FINANCE_DATASET_PATH = '/data/default-finance.txt'

const store = useBetStore()
const activeTab = ref<'bets' | 'finance'>('bets')
const financeOperations = ref<FinanceOperation[]>([])

const betsAnalytics = useBetsAnalytics(() => store.bets)
const financeAnalytics = useFinanceAnalytics(() => financeOperations.value)

const totalBetProfitAllTime = computed(() => store.bets.reduce((sum, bet) => sum + bet.result, 0))

async function loadBetsFromText(text: string) {
  store.bets = parseBets(text)
}

async function loadDefaultBetsData() {
  const response = await fetch(DEFAULT_BETS_DATASET_PATH)
  if (!response.ok) return

  const text = await response.text()
  await loadBetsFromText(text)
}

function loadFinanceFromText(text: string) {
  financeOperations.value = parseFinanceOperations(text)
}

async function loadDefaultFinanceData() {
  const response = await fetch(DEFAULT_FINANCE_DATASET_PATH)
  if (!response.ok) return

  const text = await response.text()
  loadFinanceFromText(text)
}

function handleBetsFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    await loadBetsFromText((reader.result as string) || '')
  }
  reader.readAsText(file)
}

function handleFinanceFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    loadFinanceFromText((reader.result as string) || '')
  }
  reader.readAsText(file)
}

onMounted(async () => {
  await loadDefaultBetsData()
  await loadDefaultFinanceData()
})
</script>

<template>
  <div class="page">
    <AppHeader />

    <div class="tabs">
      <button :class="['tab-button', { active: activeTab === 'bets' }]" @click="activeTab = 'bets'">
        Разбор ставок
      </button>
      <button :class="['tab-button', { active: activeTab === 'finance' }]" @click="activeTab = 'finance'">
        Финансовый контроль
      </button>
    </div>

    <BetsTab
      v-if="activeTab === 'bets'"
      :bets-count="store.bets.length"
      :handle-bets-file="handleBetsFile"
      :format-date="formatDate"
      :format-currency="formatCurrency"
      :min-date="betsAnalytics.minDate.value"
      :max-date="betsAnalytics.maxDate.value"
      :period-mode="betsAnalytics.periodMode.value"
      :selected-month="betsAnalytics.selectedMonth.value"
      :selected-week="betsAnalytics.selectedWeek.value"
      :custom-start="betsAnalytics.customStart.value"
      :custom-end="betsAnalytics.customEnd.value"
      :month-options="betsAnalytics.monthOptions.value"
      :week-options="betsAnalytics.weekOptions.value"
      :total-bets="betsAnalytics.totalBets.value"
      :wins="betsAnalytics.wins.value"
      :losses="betsAnalytics.losses.value"
      :winrate="betsAnalytics.winrate.value"
      :total-staked="betsAnalytics.totalStaked.value"
      :total-profit="betsAnalytics.totalProfit.value"
      :roi="betsAnalytics.roi.value"
      :stat-sort-mode="betsAnalytics.statSortMode.value"
      :stat-sort-direction="betsAnalytics.statSortDirection.value"
      :by-discipline="betsAnalytics.byDiscipline.value"
      :by-type="betsAnalytics.byType.value"
      :by-tournament="betsAnalytics.byTournament.value"
      :chart-data="betsAnalytics.chartData.value"
      @update:period-mode="betsAnalytics.periodMode.value = $event"
      @update:selected-month="betsAnalytics.selectedMonth.value = $event"
      @update:selected-week="betsAnalytics.selectedWeek.value = $event"
      @update:custom-start="betsAnalytics.customStart.value = $event"
      @update:custom-end="betsAnalytics.customEnd.value = $event"
      @update:stat-sort-mode="betsAnalytics.statSortMode.value = $event"
      @update:stat-sort-direction="betsAnalytics.statSortDirection.value = $event"
    />

    <FinanceTab
      v-else
      :handle-finance-file="handleFinanceFile"
      :format-date="formatDate"
      :format-currency="formatCurrency"
      :finance-date-min="financeAnalytics.financeDateMin.value"
      :finance-date-max="financeAnalytics.financeDateMax.value"
      :finance-period-mode="financeAnalytics.financePeriodMode.value"
      :selected-finance-month="financeAnalytics.selectedFinanceMonth.value"
      :selected-finance-year="financeAnalytics.selectedFinanceYear.value"
      :finance-month-options="financeAnalytics.financeMonthOptions.value"
      :finance-year-options="financeAnalytics.financeYearOptions.value"
      :total-bet-profit-all-time="totalBetProfitAllTime"
      :deposits-count="financeAnalytics.depositsCount.value"
      :withdrawals-count="financeAnalytics.withdrawalsCount.value"
      :average-deposit="financeAnalytics.averageDeposit.value"
      :average-withdrawal="financeAnalytics.averageWithdrawal.value"
      :deposits-total="financeAnalytics.depositsTotal.value"
      :withdrawals-total="financeAnalytics.withdrawalsTotal.value"
      :net-cashflow="financeAnalytics.netCashflow.value"
      @update:finance-period-mode="financeAnalytics.financePeriodMode.value = $event"
      @update:selected-finance-month="financeAnalytics.selectedFinanceMonth.value = $event"
      @update:selected-finance-year="financeAnalytics.selectedFinanceYear.value = $event"
    />
  </div>
</template>
