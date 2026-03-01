import type { FinanceOperation } from './types'

function normalizeText(rawText: string): string {
  return rawText
    .replace(/\\n/g, '\n')
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
    .replace(/[−–—]/g, '-')
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

const DATE_PATTERN = /^\d{1,2}[.-]\d{1,2}[.-]\d{4}$/
const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/

function parseBlock(block: string): FinanceOperation | null {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return null

  const dateIndex = lines.findIndex((line) => DATE_PATTERN.test(line))
  if (dateIndex < 0) return null

  const id = dateIndex > 0 ? lines[dateIndex - 1] ?? '' : ''
  const dateRaw = lines[dateIndex]
  const timeRaw = lines[dateIndex + 1]
  const operationRaw = lines[dateIndex + 2]
  const amountRaw = lines[dateIndex + 3]

  if (!id || !dateRaw || !timeRaw || !operationRaw || !amountRaw) return null
  if (!TIME_PATTERN.test(timeRaw)) return null

  const type = detectOperationType(operationRaw)
  if (!type) return null

  const parsedAmount = Math.abs(parseAmount(amountRaw))
  if (!Number.isFinite(parsedAmount)) return null

  return {
    id,
    date: parseDate(dateRaw, timeRaw),
    type,
    amount: parsedAmount,
  }
}

export function parseFinanceOperations(text: string): FinanceOperation[] {
  const normalized = normalizeText(text)
  const blocks = normalized.split(/\n\s*\n+/)

  const operations: FinanceOperation[] = []

  for (const block of blocks) {
    const operation = parseBlock(block)
    if (operation) operations.push(operation)
  }

  return operations.sort((a, b) => a.date.getTime() - b.date.getTime())
}
