import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { toast } from 'sonner'
import { signOut, useSession } from '../../lib/auth-client'
import { type DocumentRecord, uploadApi } from '../../lib/api'
import { chatDriver } from '../../lib/ChatDriver'

export const Route = createFileRoute('/_auth/upload')({
	component: UploadPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | number): string {
	return new Date(value).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

function Spinner() {
	return (
		<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
	)
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
	onFileSelect,
	uploading,
}: {
	onFileSelect: (file: File) => void
	uploading: boolean
}) {
	const [isDragging, setIsDragging] = useState(false)

	const stop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const handleDragEnter = (e: React.DragEvent) => {
		stop(e)
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		stop(e)
		if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		stop(e)
		setIsDragging(false)
		const file = e.dataTransfer.files[0]
		if (!file) return
		if (file.type !== 'application/pdf') {
			toast.error('Only PDF files are accepted')
			return
		}
		onFileSelect(file)
	}

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		if (file.type !== 'application/pdf') {
			toast.error('Only PDF files are accepted')
			e.target.value = ''
			return
		}
		onFileSelect(file)
	}

	return (
		<label
			htmlFor="drop-zone-input"
			onDrag={stop}
			onDragOver={stop}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={`flex flex-col items-center justify-center gap-2 py-16 px-6 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer select-none text-center ${isDragging
				? 'border-zinc-900 bg-zinc-50'
				: 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50'
				} ${uploading ? 'pointer-events-none opacity-50' : ''}`}
		>
			<input
				id="drop-zone-input"
				type="file"
				accept="application/pdf"
				onChange={handleChange}
				disabled={uploading}
				className="sr-only"
			/>
			<div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
				<svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
				</svg>
			</div>
			<p className="text-[15px] font-medium text-zinc-900">
				{isDragging ? 'Drop to upload' : 'Click or drag file to upload'}
			</p>
			<p className="text-[13px] text-zinc-500">
				Strictly PDF documents under 50MB
			</p>
		</label>
	)
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function ChatBox() {
	const [messages, setMessages] = useState<
		{ role: 'user' | 'assistant'; content: string; id: number }[]
	>([])
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll trigger
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, loading])

	const handleSend = async () => {
		if (!input.trim() || loading) return

		const userMessage = { role: 'user' as const, content: input.trim(), id: Date.now() }
		setMessages((prev) => [...prev, userMessage])
		setInput('')

		if (textareaRef.current) textareaRef.current.style.height = 'auto'

		setLoading(true)
		try {
			const response = await chatDriver(userMessage.content)
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: response, id: Date.now() },
			])
		} finally {
			setLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		const t = e.target as HTMLTextAreaElement
		t.style.height = 'auto'
		t.style.height = `${Math.min(t.scrollHeight, 128)}px`
	}

	return (
		<div className="flex h-[600px] flex-col border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
			{/* Header */}
			<div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
				<h3 className="text-[14px] font-medium text-zinc-900">Query Assistant</h3>

			</div>

			{/* Transcript */}
			<div className="flex-1 overflow-y-auto bg-white p-5">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center text-center">
						<div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<p className="text-[16px] font-medium text-zinc-900 leading-tight">
							Ask anything.
						</p>
						<p className="mt-1 text-[14px] text-zinc-500 max-w-[200px]">
							Your documents are ready to be queried and analyzed.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
							>
								<span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
									{msg.role === 'user' ? 'You' : 'Assistant'}
								</span>
								<div className={`px-4 py-3 rounded-2xl max-w-[90%] ${msg.role === 'user'
									? 'bg-zinc-900 text-white rounded-tr-sm'
									: 'bg-zinc-100 text-zinc-900 rounded-tl-sm'
									}`}
								>
									<p className="text-[14px] leading-relaxed whitespace-pre-wrap">
										{msg.content}
									</p>
								</div>
							</div>
						))}

						{loading && (
							<div className="flex flex-col items-start">
								<span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
									Assistant
								</span>
								<div className="px-4 py-3.5 rounded-2xl max-w-[90%] bg-zinc-100 text-zinc-900 rounded-tl-sm flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
									<div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
									<div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
								</div>
							</div>
						)}
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input row */}
			<div className="border-t border-zinc-200 p-3 bg-zinc-50/50">
				<div className="relative flex items-end gap-3 bg-white border border-zinc-300 rounded-xl px-4 py-3 shadow-sm focus-within:ring-1 focus-within:ring-zinc-400 focus-within:border-zinc-400 transition-shadow">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						onInput={handleInput}
						placeholder="Message assistant..."
						rows={1}
						className="flex-1 resize-none bg-transparent text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none py-0.5"
						style={{ height: 'auto', maxHeight: '128px' }}
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={loading || !input.trim()}
						className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
						aria-label="Send message"
					>
						{loading ? (
							<Spinner />
						) : (
							<svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function UploadPage() {
	const navigate = useNavigate()
	const { data: session } = useSession()
	const user = session?.user
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [documents, setDocuments] = useState<DocumentRecord[]>([])
	const [docsLoading, setDocsLoading] = useState(true)

	const handleSignOut = async () => {
		await signOut()
		toast.success('Signed out')
		navigate({ to: '/login' })
	}

	const fetchDocuments = useCallback(async () => {
		try {
			const data = await uploadApi.listDocuments()
			setDocuments(data)
		} catch {
			toast.error('Failed to load documents')
		} finally {
			setDocsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchDocuments()
	}, [fetchDocuments])

	const handleUpload = useCallback(async () => {
		if (!file || !user?.id) return

		setUploading(true)
		setUploadProgress(0)

		const interval = setInterval(() => {
			setUploadProgress((p) => (p < 85 ? p + Math.random() * 12 : p))
		}, 200)

		try {
			const { url, fields } = await uploadApi.getPresignedUrl({
				filename: file.name,
				contentType: file.type,
			})

			const formData = new FormData()
			for (const [k, v] of Object.entries(fields)) formData.append(k, v)
			formData.append('file', file)

			const res = await fetch(url, { method: 'POST', body: formData })
			if (!res.ok) throw new Error(`Upload failed with status ${res.status}`)

			clearInterval(interval)
			setUploadProgress(100)

			setTimeout(() => {
				toast.success('Document processed')
				setFile(null)
				setUploadProgress(0)
				fetchDocuments()
			}, 500)
		} catch (err) {
			clearInterval(interval)
			setUploadProgress(0)
			toast.error(err instanceof Error ? err.message : 'Upload failed')
		} finally {
			setUploading(false)
		}
	}, [file, user?.id, fetchDocuments])

	if (!user) return null

	const parts = (user.name ?? '').trim().split(' ').filter(Boolean)
	const shortName =
		parts.length >= 2
			? `${parts[0]} ${parts[parts.length - 1]?.[0] ?? ''}.`
			: (parts[0] ?? user.email?.split('@')[0] ?? 'User')

	return (
		<div className="flex min-h-screen flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-200">
			{/* Header */}
			<header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-8">
						<span className="text-xl font-semibold tracking-tight text-zinc-950">CELED.</span>
					</div>

					<div className="flex items-center gap-6">
						<div className="hidden sm:flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-[13px] font-semibold text-zinc-700">
								{shortName.charAt(0).toUpperCase()}
							</div>
							<span className="text-[14px] font-medium text-zinc-700">{shortName}</span>
						</div>
						<div className="hidden sm:block h-4 w-px bg-zinc-200"></div>
						<button
							type="button"
							onClick={handleSignOut}
							className="text-[14px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
						>
							Sign out
						</button>
					</div>
				</div>
			</header>

			{/* Body */}
			<main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:py-16 pb-32">
				<div className="grid gap-12 lg:gap-16 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_480px]">

					{/* ── Left: Upload + Documents ── */}
					<div className="space-y-12">
						{/* Header text */}
						<div>
							<h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Knowledge Base</h1>
							<p className="mt-2 text-[15px] text-zinc-500">
								Upload enterprise documents securely and use AI to query their contents instantaneously.
							</p>
						</div>

						{/* Upload */}
						<section className="space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-[15px] font-medium text-zinc-900">Upload document</h2>
							</div>

							<DropZone onFileSelect={setFile} uploading={uploading} />

							{/* Selected file block */}
							{file && (
								<div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 flex flex-col gap-3">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center shrink-0">
											<span className="text-[10px] font-bold text-red-700">PDF</span>
										</div>
										<div className="flex-1 min-w-0">
											<p className="truncate text-[14px] font-medium text-zinc-900">{file.name}</p>
											<p className="text-[13px] text-zinc-500">{formatFileSize(file.size)}</p>
										</div>
										{!uploading && (
											<button
												type="button"
												onClick={() => setFile(null)}
												className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
											>
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										)}
									</div>

									{/* Progress bar */}
									{uploading && (
										<div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
											<div
												className="h-full bg-zinc-900 transition-all duration-300 rounded-full"
												style={{ width: `${uploadProgress}%` }}
											/>
										</div>
									)}

									{/* Upload action */}
									<button
										type="button"
										onClick={handleUpload}
										disabled={uploading}
										className="w-full mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
									>
										{uploading && <Spinner />}
										{uploading ? 'Uploading securely...' : 'Confirm Upload'}
									</button>
								</div>
							)}
						</section>

						{/* Documents */}
						<section className="space-y-4">
							<div className="flex items-center gap-3 border-b border-zinc-200 pb-2">
								<h2 className="text-[15px] font-medium text-zinc-900">Your documents</h2>
								{!docsLoading && (
									<span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[12px] font-medium text-zinc-600 border border-zinc-200">
										{documents.length}
									</span>
								)}
							</div>

							{docsLoading ? (
								<div className="flex items-center justify-center gap-3 py-16 text-[14px] text-zinc-500">
									<Spinner />
									<span>Loading repository...</span>
								</div>
							) : documents.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-zinc-200 border-dashed rounded-xl bg-zinc-50/50">
									<p className="text-[14px] font-medium text-zinc-900">Empty repository</p>
									<p className="mt-1 text-[13px] text-zinc-500">
										Documents you upload will securely appear here.
									</p>
								</div>
							) : (
								<div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
									<div className="divide-y divide-zinc-200">
										{documents.map((doc) => (
											<div
												key={doc.key}
												className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors"
											>
												<div className="w-8 h-8 rounded bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
													<svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-[14px] font-medium text-zinc-900">{doc.filename}</p>
													<div className="mt-1 flex items-center gap-2">
														<span className="text-[12px] text-zinc-500">
															{formatFileSize(doc.size)}
														</span>
														<span className="text-[12px] text-zinc-300">•</span>
														<span className="text-[12px] text-zinc-500">
															{formatDate(doc.lastModified)}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</section>
					</div>

					{/* ── Right: Chat ── */}
					<div className="flex flex-col h-full space-y-4">
						<ChatBox />
					</div>
				</div>
			</main>

			{/* Bottom Action Dock */}
			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
				<div className="flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-200">
					<Link
						to="/dashboard"
						className="px-5 py-2 text-[14px] font-medium rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all"
					>
						Dashboard
					</Link>
					{user.role === 'user' && (
						<Link
							to="/upload"
							className="px-5 py-2 text-[14px] font-medium rounded-full bg-zinc-900 text-white shadow-sm transition-all"
						>
							Knowledge Base
						</Link>
					)}
					{user.role === 'admin' && (
						<Link
							to="/admin/overview"
							className="px-5 py-2 text-[14px] font-medium rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all"
						>
							Admin Panel
						</Link>
					)}
				</div>
			</div>
		</div>
	)
}
