import { computed, ref, watch } from 'vue'
import type { FinanceOperation } from '../types'

export type FinancePeriodMode = 'all' | 'month' | 'year'

export function useFinanceAnalytics(source: () => FinanceOperation[]) {
  const financePeriodMode = ref<FinancePeriodMode>('all')
  const selectedFinanceMonth = ref('')
  const selectedFinanceYear = ref('')

  const financeDateMin = computed(() => source()[0]?.date ?? null)
  const financeDateMax = computed(() => {
    const operations = source()
    return operations.length ? operations[operations.length - 1]?.date ?? null : null
  })

  const financeMonthOptions = computed(() => {
    const map = new Map<string, string>()
    for (const operation of source()) {
      const key = `${operation.date.getFullYear()}-${String(operation.date.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, key)
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  })

  const financeYearOptions = computed(() => {
    const years = new Set(source().map((operation) => String(operation.date.getFullYear())))
    return [...years].sort().map((value) => ({ value, label: value }))
  })

  watch(financeMonthOptions, (options) => {
    if (!selectedFinanceMonth.value && options.length) {
      selectedFinanceMonth.value = options[options.length - 1]!.value
    }
  })

  watch(financeYearOptions, (options) => {
    if (!selectedFinanceYear.value && options.length) {
      selectedFinanceYear.value = options[options.length - 1]!.value
    }
  })

  const filteredFinanceOperations = computed(() => {
    const operations = source()

    if (financePeriodMode.value === 'all') return operations

    if (financePeriodMode.value === 'month' && selectedFinanceMonth.value) {
      return operations.filter((operation) => {
        const key = `${operation.date.getFullYear()}-${String(operation.date.getMonth() + 1).padStart(2, '0')}`
        return key === selectedFinanceMonth.value
      })
    }

    if (financePeriodMode.value === 'year' && selectedFinanceYear.value) {
      return operations.filter(
        (operation) => String(operation.date.getFullYear()) === selectedFinanceYear.value,
      )
    }

    return operations
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

  const averageDeposit = computed(() =>
    depositsCount.value ? depositsTotal.value / depositsCount.value : 0,
  )
  const averageWithdrawal = computed(() =>
    withdrawalsCount.value ? withdrawalsTotal.value / withdrawalsCount.value : 0,
  )
  const netCashflow = computed(() => withdrawalsTotal.value - depositsTotal.value)

  return {
    financePeriodMode,
    selectedFinanceMonth,
    selectedFinanceYear,
    financeDateMin,
    financeDateMax,
    financeMonthOptions,
    financeYearOptions,
    depositsCount,
    withdrawalsCount,
    depositsTotal,
    withdrawalsTotal,
    averageDeposit,
    averageWithdrawal,
    netCashflow,
  }
}
