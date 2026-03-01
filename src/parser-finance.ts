import type { FinanceOperation } from './types'

function normalizeText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\n')
}

function parseDate(dateRaw: string, timeRaw: string): Date {
  const normalizedDate = dateRaw.replace(/\./g, '-')
  const [day = 1, month = 1, year = 1970] = normalizedDate.split('-').map(Number)
  const [hours = 0, minutes = 0, seconds = 0] = timeRaw.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

function parseAmount(amountRaw: string): number {
  const normalized = amountRaw
    .replace(/\u00A0/g, ' ')
    .replace(/,/g, '.')
    .replace(/[^\d+\-.\s]/g, '')
    .replace(/\s/g, '')

  return Number.parseFloat(normalized)
}

function detectOperationType(operationRaw: string): FinanceOperation['type'] | null {
  const normalizedOperation = operationRaw.toLowerCase()

  if (normalizedOperation.includes('вывод')) return 'withdrawal'
  if (normalizedOperation.includes('пополн') || normalizedOperation.includes('депозит')) {
    return 'deposit'
  }

  return null
}

export function parseFinanceOperations(text: string): FinanceOperation[] {
  const normalized = normalizeText(text)
  const operationPattern =
    /(?:^|\n)\s*(\d+)\s*\n\s*(\d{2}[.-]\d{2}[.-]\d{4})\s*\n\s*(\d{2}:\d{2}(?::\d{2})?)\s*\n\s*([^\n]+?)\s*\n\s*([+-]?\d[\d\s,.]*)/g

  const operations: FinanceOperation[] = []
  const matches = normalized.matchAll(operationPattern)

  for (const match of matches) {
    const id = match[1]
    const dateRaw = match[2]
    const timeRaw = match[3]
    const operationRaw = match[4]
    const amountRaw = match[5]

    if (!id || !dateRaw || !timeRaw || !operationRaw || !amountRaw) continue

    const type = detectOperationType(operationRaw)
    if (!type) continue

    const parsedAmount = Math.abs(parseAmount(amountRaw))
    if (!Number.isFinite(parsedAmount)) continue

    operations.push({
      id,
      date: parseDate(dateRaw, timeRaw),
      type,
      amount: parsedAmount,
    })
  }

  return operations.sort((a, b) => a.date.getTime() - b.date.getTime())
}
