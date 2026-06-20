export interface ParsedItem {
  raw_text: string
  price: number
}

export interface ParseResult {
  success: boolean
  items: ParsedItem[]
  error?: string
}
