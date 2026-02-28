import { env } from "./env"

/**
 * Send a message to the customer's Bedrock Knowledge Base via the session-authenticated chat endpoint.
 */
export const chatDriver = async (input: string): Promise<string> => {
  try {
    const response = await fetch(`${env.VITE_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // required — sends session cookie for auth
      body: JSON.stringify({ message: input }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API error ${response.status}`)
    }

    return data.reply as string
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('chatDriver error:', message)
    return `Error: ${message}`
  }
}