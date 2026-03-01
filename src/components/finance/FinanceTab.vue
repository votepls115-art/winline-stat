<script setup lang="ts">
defineProps<{
  handleFinanceFile: (event: Event) => void
  financeDateMin: Date | null
  financeDateMax: Date | null
  formatDate: (date: Date) => string
  financePeriodMode: 'all' | 'month' | 'year'
  selectedFinanceMonth: string
  selectedFinanceYear: string
  financeMonthOptions: Array<{ value: string; label: string }>
  financeYearOptions: Array<{ value: string; label: string }>
  totalBetProfitAllTime: number
  depositsCount: number
  withdrawalsCount: number
  averageDeposit: number
  averageWithdrawal: number
  depositsTotal: number
  withdrawalsTotal: number
  netCashflow: number
  formatCurrency: (value: number) => string
}>()

const emit = defineEmits<{
  (event: 'update:financePeriodMode', value: 'all' | 'month' | 'year'): void
  (event: 'update:selectedFinanceMonth', value: string): void
  (event: 'update:selectedFinanceYear', value: string): void
}>()
</script>

<template>
  <section class="panel">
    <div class="file-row section-card">
      <p><strong>Файл по умолчанию:</strong> <code>public/data/default-finance.txt</code></p>
      <input type="file" @change="handleFinanceFile" />
    </div>

    <h2 class="section-title">Финансовая статистика</h2>
    <p class="muted-text">
      Диапазон операций:
      <strong>{{ financeDateMin ? formatDate(financeDateMin) : '-' }}</strong>
      —
      <strong>{{ financeDateMax ? formatDate(financeDateMax) : '-' }}</strong>
    </p>

    <div class="filters-grid">
      <label>
        Период:
        <select :value="financePeriodMode" @change="emit('update:financePeriodMode', ($event.target as HTMLSelectElement).value as any)">
          <option value="all">За все время</option>
          <option value="month">За месяц</option>
          <option value="year">За год</option>
        </select>
      </label>

      <label v-if="financePeriodMode === 'month'">
        Месяц:
        <select :value="selectedFinanceMonth" @change="emit('update:selectedFinanceMonth', ($event.target as HTMLSelectElement).value)">
          <option v-for="option in financeMonthOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label v-if="financePeriodMode === 'year'">
        Год:
        <select :value="selectedFinanceYear" @change="emit('update:selectedFinanceYear', ($event.target as HTMLSelectElement).value)">
          <option v-for="option in financeYearOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <h3 class="section-title">Оценка: стоит ли продолжать</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span>Чистая прибыль по ставкам (по файлу ставок)</span>
        <strong>{{ formatCurrency(totalBetProfitAllTime) }}</strong>
      </div>
      <div class="stat-item"><span>Количество пополнений</span><strong>{{ depositsCount }}</strong></div>
      <div class="stat-item"><span>Количество выводов</span><strong>{{ withdrawalsCount }}</strong></div>
      <div class="stat-item"><span>Среднее пополнение</span><strong>{{ formatCurrency(averageDeposit) }}</strong></div>
      <div class="stat-item"><span>Средний вывод</span><strong>{{ formatCurrency(averageWithdrawal) }}</strong></div>
      <div class="stat-item"><span>Сумма всех пополнений</span><strong>{{ formatCurrency(depositsTotal) }}</strong></div>
      <div class="stat-item"><span>Сумма всех выводов</span><strong>{{ formatCurrency(withdrawalsTotal) }}</strong></div>
      <div class="stat-item">
        <span>Чистый денежный поток (выводы - пополнения)</span>
        <strong>{{ formatCurrency(netCashflow) }}</strong>
      </div>
    </div>
  </section>
</template>
