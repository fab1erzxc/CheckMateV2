export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'базовая еда' },
  { id: 2, name: 'сладости/снэки' },
  { id: 3, name: 'алкоголь' },
  { id: 4, name: 'курево' },
  { id: 5, name: 'утварь/химия для дома' },
  { id: 6, name: 'транспорт' },
  { id: 7, name: 'коммуналка' },
  { id: 8, name: 'другое' },
]

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const bytes = new ArrayBuffer(byteChars.length)
  const view = new Uint8Array(bytes)
  for (let i = 0; i < byteChars.length; i++) {
    view[i] = byteChars.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}
