import type { Bet } from './types'

export function parseBets(text: string): Bet[] {
  const bets: Bet[] = []
  const rawBets = text.split(/Ординар №/).filter(Boolean)

  const knownEsports = [
    'Counter-Strike',
    'Valorant',
    'DOTA 2'
  ]

  for (let raw of rawBets) {
    raw = raw.trim()

    const idMatch = raw.match(/^(\d+)/)
    const dateMatch = raw.match(/(\d{2}\.\d{2}\.\d{4}) \| (\d{2}:\d{2}:\d{2})/)
    const amountMatch = raw.match(/Сумма:\s*([\d\s]+)/)
    const resultMatch = raw.match(/(Итог|Выкуплено):\s*([+-]?[\d\s]+)/)
    const coefMatch = raw.match(/(\d+\.\d+)\s+Сумма:/)

    if (!idMatch || !dateMatch) continue

    // --- Тип + дисциплина + турнир ---
    let type = 'Unknown'
    let discipline = 'Unknown'
    let tournament = 'Unknown'

    const typeMatch = raw.match(/(Киберспорт|Футбол|Хоккей|Теннис)/)

    if (typeMatch) {
      type = typeMatch[1]

      const afterType = raw.split(type)[1]?.trim()

      if (type === 'Киберспорт') {
        for (const game of knownEsports) {
          if (afterType.startsWith(game)) {
            discipline = game
            tournament = afterType
              .replace(game, '')
              .trim()
              .split(' Завершен')[0]
              .trim()
            break
          }
        }
      } else {
        // Для обычных видов спорта
        const parts = afterType.split(' ')
        discipline = parts[0]
        tournament = afterType.replace(discipline, '').trim()
      }
    }

    const bet: Bet = {
      id: idMatch[1],
      date: new Date(
        dateMatch[1].split('.').reverse().join('-') +
        'T' +
        dateMatch[2]
      ),
      type,
      discipline,
      tournament,
      coefficient: coefMatch ? parseFloat(coefMatch[1]) : 0,
      amount: amountMatch
        ? parseFloat(amountMatch[1].replace(/\s/g, ''))
        : 0,
      result: resultMatch
        ? parseFloat(resultMatch[2].replace(/\s/g, ''))
        : 0
    }

    bets.push(bet)
  }

  return bets
}