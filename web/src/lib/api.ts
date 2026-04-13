import { env } from '../lib/env'

const BASE = env.VITE_API_URL

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}/api${path}`, {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		...options,
	})
	const json = await res.json()
	if (!res.ok) throw new Error(json.error ?? 'Request failed')
	return json.data as T
}

//  Types 
export interface UserRecord {
	id: string
	name: string
	email: string
	role: string
	banned: boolean | null
	banReason: string | null
	createdAt: string
}

export interface DashboardStats {
	customers: number
	admins: number
	blocked: number
	total: number
}

//  Admin API 
export const adminApi = {
	stats: () => request<DashboardStats>('/admin/stats'),

	listUsers: (params?: { role?: string; search?: string; status?: string }) => {
		const searchParams = new URLSearchParams()
		if (params?.role) searchParams.set('role', params.role)
		if (params?.search) searchParams.set('search', params.search)
		if (params?.status) searchParams.set('status', params.status)
		const qs = searchParams.toString()
		return request<UserRecord[]>(`/admin/users${qs ? `?${qs}` : ''}`)
	},

	createUser: (body: { name: string; email: string; password: string; role: string }) =>
		request<UserRecord>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),

	updateUser: (userId: string, body: { name?: string; email?: string; password?: string }) =>
		request<void>(`/admin/users/${userId}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),

	banUser: (userId: string) => request<void>(`/admin/users/${userId}/ban`, { method: 'POST' }),

	unbanUser: (userId: string) => request<void>(`/admin/users/${userId}/unban`, { method: 'POST' }),

	deleteUser: (userId: string) => request<void>(`/admin/users/${userId}`, { method: 'DELETE' }),
}

//  Upload API 
export interface DocumentRecord {
	key: string
	filename: string
	size: number
	lastModified: string
}

export const uploadApi = {
	getPresignedUrl: (body: { filename: string; contentType: string }) =>
		request<{ url: string; fields: Record<string, string>; key: string }>('/upload/presigned-url', {
			method: 'POST',
			body: JSON.stringify(body),
		}),

	listDocuments: () => request<DocumentRecord[]>('/upload/documents'),

	getKnowledgeBase: () =>
		request<{ knowledgeBaseId: string | null }>('/upload/knowledge-base'),
}

//  API Keys 
export interface ApiKeyRecord {
	id: string
	name: string | null
	start: string | null
	createdAt: string
	lastRequest: string | null
	enabled: boolean | null
	expiresAt: string | null
}

export const apiKeyApi = {
	list: () => request<ApiKeyRecord[]>('/apikeys'),

	create: (name: string, environment: 'test' | 'prod') =>
		request<{ id: string; key: string }>('/apikeys', {
			method: 'POST',
			body: JSON.stringify({ name, environment }),
		}),

	revoke: (id: string) => request<void>(`/apikeys/${id}`, { method: 'DELETE' }),
}

/** Convert text to speech — returns base64-encoded audio */
export const aiApi = {
	textToSpeech: (prompt: string) =>
		request<{ audioBase64: string }>('/ai/text-to-speech', {
			method: 'POST',
			body: JSON.stringify({ prompt }),
		}),

	/**
	 * Transcribe an audio Blob.
	 * Converts the blob to base64 in the browser before sending to the API.
	 */
	transcribe: async (audioBlob: Blob) => {
		const audioBase64 = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader()
			reader.onloadend = () => {
				const raw = (reader.result as string | null) ?? ''
				resolve(raw.split(',')[1] ?? '')
			}
			reader.onerror = reject
			reader.readAsDataURL(audioBlob)
		})
		return request<unknown>('/ai/transcribe', {
			method: 'POST',
			body: JSON.stringify({ audioBase64 }),
		})
	},
}