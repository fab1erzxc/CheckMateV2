export interface ParsedItem {
  raw_text: string
  price: number
  category?: string | null
  category_id?: number | null
}

export interface ParseResult {
  success: boolean
  items: ParsedItem[]
  error?: string
}
