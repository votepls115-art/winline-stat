export interface Bet {
  id: string
  date: Date
  type: string
  discipline: string
  tournament: string
  coefficient: number
  amount: number
  result: number
}

export type FinanceOperationType = 'deposit' | 'withdrawal'

export interface FinanceOperation {
  id: string
  date: Date
  type: FinanceOperationType
  amount: number
}
