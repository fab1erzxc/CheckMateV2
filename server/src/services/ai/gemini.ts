import { ParseResult, ParsedItem } from './types'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent'

const PROMPT = `Extract all items with prices from this receipt image.
Ignore totals, tax, discounts, receipt numbers, dates, and any non-item text.
Return ONLY a valid JSON array in this exact format:
[{"raw_text": "item text from receipt", "price": number}]

Example output:
[{"raw_text": "Coca-Cola 1L", "price": 40}, {"raw_text": "Bread", "price": 15}]`

export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParseResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      items: [],
      error: 'Gemini API key not configured',
    }
  }

  // Validate image size (max 10MB)
  const imageSize = Buffer.byteLength(imageBase64, 'base64')
  if (imageSize > 10 * 1024 * 1024) {
    return {
      success: false,
      items: [],
      error: 'Image too large. Maximum size is 10MB.',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      console.error(`Gemini API error (${response.status}):`, errorBody)
      return {
        success: false,
        items: [],
        error: `Gemini API returned status ${response.status}`,
      }
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      return {
        success: false,
        items: [],
        error: 'Empty response from Gemini',
      }
    }

    const items = parseItemsFromContent(content.trim())

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
        error: 'Gemini API request timed out',
      }
    }

    console.error('Gemini API error:', error)
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
