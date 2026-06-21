interface AiClientParams {
  url: string
  headers?: Record<string, string>
  body: unknown
  apiKey: string
  serviceName: string
  timeout?: number
}

type AiClientResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string }

/**
 * Make an HTTP request to an AI provider API.
 * Handles API key check, AbortController timeout, fetch, status code errors,
 * JSON parsing, and network errors. Returns a structured result.
 */
export async function aiRequest(params: AiClientParams): Promise<AiClientResult> {
  const {
    url,
    headers = {},
    body,
    apiKey,
    serviceName,
    timeout = 30000,
  } = params

  if (!apiKey) {
    return { ok: false, error: `${serviceName} API key not configured` }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      console.error(`${serviceName} API error (${response.status}):`, errorBody)
      return { ok: false, error: `${serviceName} API returned status ${response.status}` }
    }

    const data = (await response.json()) as unknown
    return { ok: true, data }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: `${serviceName} API request timed out` }
    }

    console.error(`${serviceName} API error:`, error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
