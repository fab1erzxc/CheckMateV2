import { ParseResult } from './ai/types'
import { parseTextWithDeepSeek } from './ai/deepseek'
import { parseReceiptImage } from './ai/gemini'

export async function parseText(text: string): Promise<ParseResult> {
  if (!text || !text.trim()) {
    return {
      success: false,
      items: [],
      error: 'No text provided',
    }
  }

  return parseTextWithDeepSeek(text)
}

export async function parseReceiptImageFromBase64(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParseResult> {
  return parseReceiptImage(imageBase64, mimeType)
}

// Mock for testing
export function getMockParseResult(): ParseResult {
  return {
    success: true,
    items: [
      { raw_text: 'Coca-Cola 40 lira', price: 40 },
      { raw_text: 'Bread 15 lira', price: 15 },
      { raw_text: 'Eggs 60 lira', price: 60 },
    ],
  }
}
