import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { signOut, useSession } from '../../lib/auth-client'
import { apiKeyApi, type ApiKeyRecord } from '../../lib/api'

export const Route = createFileRoute('/_auth/dashboard')({
	component: DashboardPage,
})

// ─── Shared primitives ────────────────────────────────────────────────────────

function Spinner() {
	return (
		<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
	)
}

function formatDate(value: string | number): string {
	return new Date(value).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
	const navigate = useNavigate()
	const { data: session } = useSession()
	const user = session?.user

	if (!user) return null

	const handleSignOut = async () => {
		await signOut()
		toast.success('Signed out')
		navigate({ to: '/login' })
	}

	const parts = (user.name ?? '').trim().split(' ').filter(Boolean)
	const shortName =
		parts.length >= 2
			? `${parts[0]} ${parts[parts.length - 1]?.[0] ?? ''}.`
			: (parts[0] ?? user.email?.split('@')[0] ?? 'User')

	return (
		<div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
			{/* Header */}
			<header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-8">
						<span className="text-xl font-semibold tracking-tight text-zinc-950">CELED.</span>
					</div>

					<div className="flex items-center gap-6">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-[13px] font-semibold text-zinc-700">
								{shortName.charAt(0).toUpperCase()}
							</div>
							<span className="hidden sm:inline-block text-[14px] font-medium text-zinc-700">{shortName}</span>
						</div>
						<div className="h-4 w-px bg-zinc-200"></div>
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

			{/* Main */}
			<main className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-16 pb-32 space-y-16">
				{/* Profile */}
				<section className="space-y-6">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Account settings</h1>
						<p className="mt-2 text-[15px] text-zinc-500">
							Manage your profile information and security preferences.
						</p>
					</div>

					<div className="border border-zinc-200 rounded-xl overflow-hidden">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-zinc-200">
							<div>
								<h3 className="text-[15px] font-medium text-zinc-900">Name</h3>
								<p className="text-[14px] text-zinc-500 mt-1">{user.name}</p>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-zinc-200">
							<div>
								<h3 className="text-[15px] font-medium text-zinc-900">Email address</h3>
								<p className="text-[14px] text-zinc-500 mt-1">{user.email}</p>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-zinc-50/50">
							<div>
								<h3 className="text-[15px] font-medium text-zinc-900">Role</h3>
								<p className="text-[14px] text-zinc-500 mt-1 capitalize">{user.role}</p>
							</div>
						</div>
					</div>
				</section>

				{/* API Keys — customers only */}
				{user.role === 'user' && <ApiKeysSection />}
			</main>

			{/* Bottom Action Dock */}
			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
				<div className="flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-200">
					<Link
						to="/dashboard"
						className="px-5 py-2 text-[14px] font-medium rounded-full bg-zinc-900 text-white shadow-sm transition-all"
					>
						Dashboard
					</Link>
					{user.role === 'user' && (
						<Link
							to="/upload"
							className="px-5 py-2 text-[14px] font-medium rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all"
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

// ─── API Keys ─────────────────────────────────────────────────────────────────

function ApiKeysSection() {
	const [keys, setKeys] = useState<ApiKeyRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreate, setShowCreate] = useState(false)
	const [newKey, setNewKey] = useState<string | null>(null)

	const fetchKeys = useCallback(async () => {
		try {
			const data = await apiKeyApi.list()
			setKeys(data)
		} catch {
			toast.error('Failed to load API keys')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchKeys()
	}, [fetchKeys])

	const handleRevoke = async (id: string, name: string | null) => {
		if (!confirm(`Revoke API key "${name ?? id}"? This cannot be undone.`)) return
		try {
			await apiKeyApi.revoke(id)
			toast.success('API key revoked')
			fetchKeys()
		} catch {
			toast.error('Failed to revoke API key')
		}
	}

	return (
		<section className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
						API Keys
						{!loading && (
							<span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[12px] font-medium text-zinc-600 border border-zinc-200">
								{keys.length}
							</span>
						)}
					</h2>
					<p className="mt-1.5 text-[14px] text-zinc-500">
						Manage your secret keys for accessing the CELED API.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
				>
					Create new key
				</button>
			</div>

			<div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
				{loading ? (
					<div className="flex items-center justify-center gap-3 py-16 text-[14px] text-zinc-500">
						<Spinner />
						<span>Loading keys...</span>
					</div>
				) : keys.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
						<p className="text-[15px] font-medium text-zinc-900">No API keys</p>
						<p className="mt-1 text-[14px] text-zinc-500 max-w-sm">
							You haven't created any API keys yet. Generate one to authenticate your API requests.
						</p>
					</div>
				) : (
					<div className="divide-y divide-zinc-200">
						<div className="grid grid-cols-12 gap-4 p-4 md:px-6 bg-zinc-50/50 text-[13px] font-medium text-zinc-500 border-b border-zinc-200">
							<div className="col-span-12 md:col-span-4">Name</div>
							<div className="col-span-6 md:col-span-3">Key Preview</div>
							<div className="hidden md:block md:col-span-3">Created / Last Used</div>
							<div className="col-span-6 md:col-span-2 text-right">Actions</div>
						</div>
						{keys.map((k) => (
							<div key={k.id} className="grid grid-cols-12 gap-4 p-4 md:px-6 items-center flex-wrap">
								<div className="col-span-12 md:col-span-4 flex items-center">
									<p className="text-[14px] font-medium text-zinc-900 truncate pr-4">{k.name ?? 'Untitled'}</p>
								</div>

								<div className="col-span-6 md:col-span-3 flex items-center">
									<span className="font-mono text-[13px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
										{k.start ? `${k.start}••••` : '••••'}
									</span>
								</div>

								<div className="hidden md:flex md:col-span-3 flex-col gap-0.5">
									<span className="text-[13px] text-zinc-900">{formatDate(k.createdAt)}</span>
									{k.lastRequest ? (
										<span className="text-[12px] text-zinc-500">Used {formatDate(k.lastRequest)}</span>
									) : (
										<span className="text-[12px] text-zinc-400">Never used</span>
									)}
								</div>

								<div className="col-span-6 md:col-span-2 flex justify-end">
									<button
										type="button"
										onClick={() => handleRevoke(k.id, k.name)}
										className="text-[13px] font-medium text-red-600 hover:text-red-700 hover:underline underline-offset-4 transition-colors"
									>
										Revoke
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{showCreate && (
				<CreateKeyModal
					onClose={() => setShowCreate(false)}
					onCreated={(key) => {
						setShowCreate(false)
						setNewKey(key)
						fetchKeys()
					}}
				/>
			)}

			{newKey && (
				<NewKeyDialog keyValue={newKey} onClose={() => setNewKey(null)} />
			)}
		</section>
	)
}

// ─── Create Key Modal ─────────────────────────────────────────────────────────

function CreateKeyModal({
	onClose,
	onCreated,
}: {
	onClose: () => void
	onCreated: (key: string) => void
}) {
	const [name, setName] = useState('')
	const [environment, setEnvironment] = useState<'test' | 'prod'>('test')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			const result = await apiKeyApi.create(name, environment)
			onCreated(result.key)
		} catch {
			toast.error('Failed to create API key')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all">
				<div className="px-6 py-6 border-b border-zinc-100">
					<h3 className="text-xl font-semibold tracking-tight text-zinc-900">
						Create new API key
					</h3>
					<p className="mt-1.5 text-[14px] text-zinc-500">
						Generate a key to authenticate requests from your application.
					</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="px-6 py-6 space-y-6">
						{/* Name */}
						<div className="space-y-2">
							<label className="block text-[13px] font-medium text-zinc-700">
								Key name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								placeholder="e.g. Production App"
								className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 shadow-sm"
								autoFocus
							/>
						</div>

						{/* Environment */}
						<div className="space-y-3">
							<label className="block text-[13px] font-medium text-zinc-700">
								Environment
							</label>
							<div className="grid grid-cols-2 gap-3">
								{(['test', 'prod'] as const).map((env) => (
									<label
										key={env}
										className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 cursor-pointer border rounded-lg p-3 transition-colors ${environment === env
											? 'border-zinc-900 bg-zinc-50'
											: 'border-zinc-200 hover:border-zinc-300'
											}`}
									>
										<input
											type="radio"
											name="environment"
											value={env}
											checked={environment === env}
											onChange={() => setEnvironment(env)}
											className="sr-only"
										/>
										<div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${environment === env ? 'border-zinc-900' : 'border-zinc-300'}`}>
											{environment === env && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
										</div>
										<div>
											<span className="text-[14px] font-medium text-zinc-900 block">
												{env === 'test' ? 'Test' : 'Production'}
											</span>
										</div>
									</label>
								))}
							</div>
							<p className="text-[13px] text-zinc-500">
								{environment === 'test'
									? 'Safe for local development. Keys are prefixed with test_'
									: 'Use for live applications. Keys are prefixed with prod_'}
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-[14px] font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !name.trim()}
							className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{loading && <Spinner />}
							{loading ? 'Creating...' : 'Create key'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

// ─── New Key Dialog ───────────────────────────────────────────────────────────

function NewKeyDialog({
	keyValue,
	onClose,
}: {
	keyValue: string
	onClose: () => void
}) {
	const [copied, setCopied] = useState(false)

	const copy = () => {
		navigator.clipboard.writeText(keyValue).then(() => {
			setCopied(true)
			toast.success('Copied to clipboard')
			setTimeout(() => setCopied(false), 2000)
		})
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all">
				<div className="px-6 py-6 border-b border-zinc-100">
					<h3 className="text-xl font-semibold tracking-tight text-zinc-900">
						Save your API key
					</h3>
					<p className="mt-1.5 text-[14px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
						Please save this secret key somewhere safe. For security reasons, <strong>you won't be able to view it again</strong>.
					</p>
				</div>

				<div className="px-6 py-6 border-b border-zinc-100">
					<div className="flex flex-col gap-2">
						<label className="text-[13px] font-medium text-zinc-700">Your new key</label>
						<div className="relative flex items-center">
							<code className="block w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 px-4 pr-16 font-mono text-[13px] text-zinc-800 break-all select-all">
								{keyValue}
							</code>
							<button
								type="button"
								onClick={copy}
								className="absolute right-2 text-[12px] font-medium bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-md shadow-sm transition-colors text-zinc-700 select-none"
							>
								{copied ? 'Copied' : 'Copy'}
							</button>
						</div>
					</div>
				</div>

				<div className="px-6 py-4 bg-zinc-50 flex items-center justify-end">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex rounded-lg bg-zinc-900 px-5 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	)
}
