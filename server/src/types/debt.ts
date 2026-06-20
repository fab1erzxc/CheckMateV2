export interface DebtDetail {
  from_user: string
  to_user: string
  amount: number
}

export interface BalanceResult {
  balance: number
  direction: 'user_owes_girlfriend' | 'girlfriend_owes_user' | 'settled'
  details: DebtDetail[]
}

export interface Settlement {
  id: number
  from_user_id: number
  from_user_name: string
  to_user_id: number
  to_user_name: string
  amount: number
  settled_at: string
}
