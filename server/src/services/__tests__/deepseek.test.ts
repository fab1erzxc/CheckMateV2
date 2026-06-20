import { parseTextWithDeepSeek } from '../ai/deepseek'

const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('DeepSeek text parsing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.DEEPSEEK_API_KEY = 'test-key'
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return error if API key is not configured', async () => {
    delete process.env.DEEPSEEK_API_KEY

    const result = await parseTextWithDeepSeek('test text')
    expect(result.success).toBe(false)
    expect(result.error).toBe('DeepSeek API key not configured')
  })

  it('should parse valid response from DeepSeek', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { raw_text: 'Coca-Cola 40 lira', price: 40 },
                { raw_text: 'Bread 15 lira', price: 15 },
              ]),
            },
          },
        ],
      }),
    })

    const result = await parseTextWithDeepSeek('Coca-Cola 40 lira, Bread 15 lira')
    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ raw_text: 'Coca-Cola 40 lira', price: 40 })
    expect(result.items[1]).toEqual({ raw_text: 'Bread 15 lira', price: 15 })
  })

  it('should handle API error status codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    })

    const result = await parseTextWithDeepSeek('test')
    expect(result.success).toBe(false)
    expect(result.error).toContain('401')
  })

  it('should handle empty response from DeepSeek', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '' } }],
      }),
    })

    const result = await parseTextWithDeepSeek('test')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Empty response from DeepSeek')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await parseTextWithDeepSeek('test')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should handle abort/timeout errors', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockFetch.mockRejectedValueOnce(abortError)

    const result = await parseTextWithDeepSeek('test')
    expect(result.success).toBe(false)
    expect(result.error).toBe('DeepSeek API request timed out')
  })

  it('should extract JSON from markdown-wrapped response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n[{"raw_text": "Milk 30 lira", "price": 30}]\n```',
            },
          },
        ],
      }),
    })

    const result = await parseTextWithDeepSeek('Milk 30 lira')
    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].raw_text).toBe('Milk 30 lira')
  })

  it('should filter out invalid items from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { raw_text: 'Valid item', price: 50 },
                { raw_text: 'Missing price' },
                { price: 30 },
                'not an object',
              ]),
            },
          },
        ],
      }),
    })

    const result = await parseTextWithDeepSeek('test')
    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(1)
  })
})
