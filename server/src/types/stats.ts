export interface CategoryStat {
  category: string
  amount: number
}

export interface PeriodStat {
  period: string
  amount: number
}

export interface StatsResult {
  total: number
  by_category: CategoryStat[]
  by_period: PeriodStat[]
  by_person: {
    user: number
    girlfriend: number
  }
}

export interface StatsQuery {
  period?: 'week' | 'month' | '3months' | 'year' | 'custom'
  category?: string // comma-separated IDs
  person?: 'user' | 'girlfriend' | 'both'
  start_date?: string
  end_date?: string
}
