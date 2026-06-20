export interface DictionaryEntry {
  id: number
  raw_text: string
  normalized_name: string | null
  category_id: number | null
  category_name: string | null
  created_at: string
}

export interface DictionaryInput {
  raw_text: string
  normalized_name?: string
  category_id?: number
}
