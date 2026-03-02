import { env } from '../lib/env'

export type ChatResponse = {
  answer: string
  sources: string[]
  references: string[]
}



export const chatDriver = async (input: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${env.VITE_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: input }),
    })

    const data = await response.json()
    console.log('chatDriver parsed response:', data)

    if (!response.ok) {
      throw new Error(data.error || `API error ${response.status}`)
    }

    return {
      answer: data.reply ?? '',
      sources: Array.isArray(data.sources) ? data.sources : [],
      references: Array.isArray(data.references) ? data.references : [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('chatDriver error:', message)

    return { answer: `Error: ${message}`, sources: [], references: [] }
  }
}