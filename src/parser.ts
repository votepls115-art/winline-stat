import type { Bet } from './types'

function normalizeText(rawText: string): string {
  return rawText
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
}

function parseDate(dateRaw: string, timeRaw: string): Date {
  const [day = 1, month = 1, year = 1970] = dateRaw.split('.').map(Number)
  const [hours = 0, minutes = 0, seconds = 0] = timeRaw.split(':').map(Number)

  return new Date(year, month - 1, day, hours, minutes, seconds)
}

function detectTypeDisciplineTournament(block: string): {
  type: string
  discipline: string
  tournament: string
} {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const typeIndex = lines.findIndex((line) =>
    ['Киберспорт', 'Футбол', 'Хоккей', 'Теннис', 'Баскетбол'].includes(line),
  )

  if (typeIndex === -1) {
    return {
      type: 'Unknown',
      discipline: 'Unknown',
      tournament: 'Unknown',
    }
  }

  const type = lines[typeIndex] ?? 'Unknown'
  const discipline = lines[typeIndex + 1] ?? 'Unknown'

  const tournamentLine = lines
    .slice(typeIndex + 2)
    .find((line) => !line.startsWith('Завершен'))

  return {
    type,
    discipline,
    tournament: tournamentLine ?? 'Unknown',
  }
}

export function parseBets(text: string): Bet[] {
  const normalized = normalizeText(text)
  const bets: Bet[] = []

  const rawBets = normalized
    .split(/Ординар\s*№/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  for (const raw of rawBets) {
    const idMatch = raw.match(/^(\d+)/)
    const dateMatch = raw.match(/(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{2}:\d{2}:\d{2})/)
    const amountMatch = raw.match(/Сумма:\s*([+-]?[\d\s]+)/)
    const resultMatch = raw.match(/(?:Итог|Выкуплено):\s*([+-]?[\d\s]+)/)
    const coefficientMatch = raw.match(/\n(\d+[.,]\d+)\s*\nСумма:/)

    if (!idMatch || !dateMatch) {
      continue
    }

    const { type, discipline, tournament } = detectTypeDisciplineTournament(raw)

    bets.push({
      id: idMatch[1] ?? '0',
      date: parseDate(dateMatch[1] ?? '01.01.1970', dateMatch[2] ?? '00:00:00'),
      type,
      discipline,
      tournament,
      coefficient: coefficientMatch
        ? Number.parseFloat((coefficientMatch[1] ?? '0').replace(',', '.'))
        : 0,
      amount: amountMatch
        ? Number.parseFloat((amountMatch[1] ?? '0').replace(/\s/g, ''))
        : 0,
      result: resultMatch
        ? Number.parseFloat((resultMatch[1] ?? '0').replace(/\s/g, ''))
        : 0,
    })
  }

  return bets.sort((a, b) => a.date.getTime() - b.date.getTime())
}
