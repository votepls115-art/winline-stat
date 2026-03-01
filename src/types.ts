export interface Bet {
  id: string
  date: Date
  type: string        // Киберспорт / Футбол / Хоккей
  discipline: string  // Counter-Strike / DOTA 2 / Valorant
  tournament: string  // DreamLeague / VCL / JB Pro League
  coefficient: number
  amount: number
  result: number
}