import { ParseResult } from './types'
import { parseItemsFromContent } from './utils'
import { aiRequest } from './client'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const PROMPT = `Extract all items with prices from this receipt image.
Ignore totals, tax, discounts, receipt numbers, dates, and any non-item text.
Also assign a category to each item from this list:
- базовая еда (basic food)
- сладости/снэки (sweets/snacks)
- алкоголь (alcohol)
- курево (smoking)
- утварь/химия для дома (household supplies/chemicals)
- транспорт (transport)
- коммуналка (utilities)
- другое (other)

Return ONLY a valid JSON array in this exact format:
[{"raw_text": "item text from receipt", "price": number, "category": "category_name"}]

Example output:
[{"raw_text": "Coca-Cola 1L", "price": 40, "category": "сладости/снэки"}, {"raw_text": "Bread", "price": 15, "category": "базовая еда"}]`

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

  const result = await aiRequest({
    url: `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    body: {
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
    },
    apiKey,
    serviceName: 'Gemini',
  })

  if (!result.ok) {
    return { success: false, items: [], error: result.error }
  }

  const data = result.data as {
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
}
