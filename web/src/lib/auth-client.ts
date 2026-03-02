import { env } from '../lib/env'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
	baseURL: env.VITE_API_URL,
	plugins: [adminClient()],
})

export const { signIn, signOut, useSession } = authClient
