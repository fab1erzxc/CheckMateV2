import { parseReceiptImage } from '../ai/gemini'

const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('Gemini Vision parsing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.GEMINI_API_KEY = 'test-key'
  })

  it('should return error if API key is not configured', async () => {
    delete process.env.GEMINI_API_KEY

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Gemini API key not configured')
  })

  it('should return error if image is too large (over 10MB)', async () => {
    // Buffer.byteLength with 'base64' encoding: for N chars, decoded size ≈ N * 3/4
    // For 11MB raw data, need ~14.7M base64 chars
    // Use 'A' which is valid base64 (value 0). 15M 'A' chars decode to ~11.25MB
    const largeBase64 = 'A'.repeat(15 * 1024 * 1024)

    const result = await parseReceiptImage(largeBase64)
    expect(result.success).toBe(false)
    expect(result.error).toContain('10MB')
  })

  it('should parse valid response from Gemini', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    { raw_text: 'Coca-Cola 1L', price: 40 },
                    { raw_text: 'Bread', price: 15 },
                  ]),
                },
              ],
            },
          },
        ],
      }),
    })

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ raw_text: 'Coca-Cola 1L', price: 40, category: null, category_id: null })
  })

  it('should handle API error status codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'API key invalid',
    })

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(false)
    expect(result.error).toContain('403')
  })

  it('should handle empty response from Gemini', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      }),
    })

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Empty response from Gemini')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should handle abort/timeout errors', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockFetch.mockRejectedValueOnce(abortError)

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Gemini API request timed out')
  })

  it('should filter out invalid items from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    { raw_text: 'Valid item', price: 50 },
                    { raw_text: 'Missing price' },
                    { price: 30 },
                  ]),
                },
              ],
            },
          },
        ],
      }),
    })

    const result = await parseReceiptImage('fake-base64')
    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(1)
  })
})
