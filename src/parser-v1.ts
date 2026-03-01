import type { Bet } from './types'

export function parseBets(text: string): Bet[] {
  const blocks = text.split('Ординар')
  const bets: Bet[] = []

  for (const block of blocks) {
    if (!block.includes('№')) continue

    const id = block.match(/№\s*(\d+)/)?.[1]
    const dateRaw = block.match(/(\d{2}\.\d{2}\.\d{4} \| \d{2}:\d{2}:\d{2})/)?.[1]
    const discipline = block.match(/Киберспорт\n(.+)/)?.[1]
    const coef = parseFloat(block.match(/\n(\d+\.\d+)\n/)?.[1] || '0')
    const amount = parseFloat(block.match(/Сумма:\n([\d\s]+)/)?.[1].replace(/\s/g, '') || '0')
    const result = parseFloat(block.match(/(Итог|Выкуплено):\n([+-]?[\d\s]+)/)?.[2].replace(/\s/g, '') || '0')

    if (!id || !dateRaw) continue

    bets.push({
      id,
      date: new Date(dateRaw.replace('|', '')),
      discipline: discipline || 'Unknown',
      coefficient: coef,
      amount,
      result
    })
  }

  return bets
}