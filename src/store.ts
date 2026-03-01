import { defineStore } from 'pinia'
import type { Bet } from './types'

export const useBetStore = defineStore('bets', {
  state: () => ({
    bets: [] as Bet[]
  }),

  getters: {
    totalBets: (s) => s.bets.length,

    wins: (s) => s.bets.filter(b => b.result > 0).length,
    losses: (s) => s.bets.filter(b => b.result < 0).length,

    totalStaked: (s) => s.bets.reduce((sum, b) => sum + b.amount, 0),
    totalProfit: (s) => s.bets.reduce((sum, b) => sum + b.result, 0),

    roi(): number {
      return this.totalStaked === 0 ? 0 :
        (this.totalProfit / this.totalStaked) * 100
    },

    winrate(): number {
      return this.totalBets === 0 ? 0 :
        (this.wins / this.totalBets) * 100
    },

    byType(state) {
      const map: Record<string, any> = {}

      state.bets.forEach(b => {
        if (!map[b.type]) {
          map[b.type] = { count: 0, profit: 0 }
        }
        map[b.type].count++
        map[b.type].profit += b.result
      })

      return map
    },

    byDiscipline(state) {
      const map: Record<string, any> = {}

      state.bets.forEach(b => {
        if (!map[b.discipline]) {
          map[b.discipline] = { count: 0, profit: 0 }
        }
        map[b.discipline].count++
        map[b.discipline].profit += b.result
      })

      return map
    },

    byTournament(state) {
      const map: Record<string, any> = {}

      state.bets.forEach(b => {
        if (!map[b.tournament]) {
          map[b.tournament] = { count: 0, profit: 0 }
        }
        map[b.tournament].count++
        map[b.tournament].profit += b.result
      })

      return map
    }
  }
})