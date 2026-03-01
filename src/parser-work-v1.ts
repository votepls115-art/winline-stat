import type { Bet } from './types'

export function parseBets(text: string): Bet[] {
  const bets: Bet[] = []

  const rawBets = text.split(/Ординар №/).filter(Boolean)

  for (let raw of rawBets) {
    raw = raw.trim()

    const idMatch = raw.match(/^(\d+)/)
    const dateMatch = raw.match(/(\d{2}\.\d{2}\.\d{4}) \| (\d{2}:\d{2}:\d{2})/)
    const disciplineMatch = raw.match(/Киберспорт\s+([A-Za-z0-9\- ]+)/)
    const amountMatch = raw.match(/Сумма:\s*([\d\s]+)/)
    const resultMatch = raw.match(/(Итог|Выкуплено):\s*([+-]?[\d\s]+)/)

    // коэффициент — берём последнее число перед "Сумма:"
    const coefMatch = raw.match(/(\d+\.\d+)\s+Сумма:/)

    if (!idMatch || !dateMatch) continue

    const id = idMatch[1]

    const date = new Date(
      dateMatch[1].split('.').reverse().join('-') +
      'T' +
      dateMatch[2]
    )

    const discipline = disciplineMatch?.[1]?.trim() || 'Unknown'

    const coefficient = coefMatch ? parseFloat(coefMatch[1]) : 0

    const amount = amountMatch
      ? parseFloat(amountMatch[1].replace(/\s/g, ''))
      : 0

    const result = resultMatch
      ? parseFloat(resultMatch[2].replace(/\s/g, ''))
      : 0

    bets.push({
      id,
      date,
      discipline,
      coefficient,
      amount,
      result
    })
  }

  console.log("PARSED BETS:", bets)
  return bets
}