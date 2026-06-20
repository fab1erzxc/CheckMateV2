export interface ReceiptItemInput {
  raw_text?: string
  normalized_name?: string
  category_id?: number
  price: number
  owner: 'user' | 'girlfriend' | '50-50'
}

export interface ReceiptInput {
  date: string
  payer_id: number
  currency?: string
  items: ReceiptItemInput[]
}

export interface ReceiptItem {
  id: number
  receipt_id: number
  raw_text: string | null
  normalized_name: string | null
  category_id: number | null
  category_name?: string
  price: number | null
  owner: 'user' | 'girlfriend' | '50-50' | null
  created_at: string
}

export interface Receipt {
  id: number
  date: string
  payer_id: number
  payer_name?: string
  currency: string
  total_amount: number
  created_at: string
  items?: ReceiptItem[]
  item_count?: number
}

export interface ReceiptListItem {
  id: number
  date: string
  payer_name: string
  total_amount: number
  item_count: number
}
