import { ParseResult, ParsedItem } from './types'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

const SYSTEM_PROMPT = `You are a receipt parser. Extract all items with prices from the user's expense text.
Ignore totals, tax, discounts, and receipt numbers.
Return ONLY a valid JSON array in this exact format:
[{"raw_text": "original item text", "price": number}]

Examples:
Input: "Coca-Cola 40 lira, potatoes 120 lira"
Output: [{"raw_text": "Coca-Cola 40 lira", "price": 40}, {"raw_text": "potatoes 120 lira", "price": 120}]

Input: "кокакола 40 лир, картошка 120 лир"
Output: [{"raw_text": "кокакола 40 лир", "price": 40}, {"raw_text": "картошка 120 лир", "price": 120}]`

export async function parseTextWithDeepSeek(
  text: string
): Promise<ParseResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    return {
      success: false,
      items: [],
      error: 'DeepSeek API key not configured',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      console.error(`DeepSeek API error (${response.status}):`, errorBody)
      return {
        success: false,
        items: [],
        error: `DeepSeek API returned status ${response.status}`,
      }
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    if (!data.choices?.[0]?.message?.content) {
      return {
        success: false,
        items: [],
        error: 'Empty response from DeepSeek',
      }
    }

    const content = data.choices[0].message.content.trim()
    const items = parseItemsFromContent(content)

    if (items.length === 0) {
      return {
        success: false,
        items: [],
        error: 'Could not parse any items from the response',
      }
    }

    return { success: true, items }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        items: [],
        error: 'DeepSeek API request timed out',
      }
    }

    console.error('DeepSeek API error:', error)
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function parseItemsFromContent(content: string): ParsedItem[] {
  // Try to extract JSON array from the response
  const jsonMatch = content.match(/\[[\s\S]*?\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item: unknown): item is ParsedItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ParsedItem).raw_text === 'string' &&
        typeof (item as ParsedItem).price === 'number'
    )
  } catch {
    return []
  }
}
