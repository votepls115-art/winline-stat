import type { FinanceOperation } from './types'

function normalizeText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\n')
}

function parseDate(dateRaw: string, timeRaw: string): Date {
  const [day = 1, month = 1, year = 1970] = dateRaw.split('-').map(Number)
  const [hours = 0, minutes = 0] = timeRaw.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0)
}

function parseAmount(amountRaw: string): number {
  return Number.parseFloat(amountRaw.replace(/\s/g, ''))
}

export function parseFinanceOperations(text: string): FinanceOperation[] {
  const normalized = normalizeText(text)
  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const operations: FinanceOperation[] = []

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length < 5) continue

    const [id, dateRaw, timeRaw, operationRaw, amountRaw] = lines

    if (!id || !dateRaw || !timeRaw || !operationRaw || !amountRaw) {
      continue
    }

    if (!/^\d+$/.test(id)) continue
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dateRaw)) continue

    const type = operationRaw.includes('Вывод') ? 'withdrawal' : 'deposit'
    const parsedAmount = Math.abs(parseAmount(amountRaw))

    operations.push({
      id,
      date: parseDate(dateRaw, timeRaw),
      type,
      amount: parsedAmount,
    })
  }

  return operations.sort((a, b) => a.date.getTime() - b.date.getTime())
}
