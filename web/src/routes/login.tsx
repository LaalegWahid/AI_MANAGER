import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { signIn, useSession } from '../lib/auth-client'

export const Route = createFileRoute('/login')({
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const { data: session } = useSession()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (session?.user) navigate({ to: '/dashboard' })
	}, [session?.user, navigate])

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			const result = await signIn.email({ email, password })
			if (result.error) {
				setError(result.error.message ?? 'Login failed')
				toast.error(result.error.message ?? 'Login failed')
			} else {
				toast.success('Logged in successfully')
				navigate({ to: '/dashboard' })
			}
		} catch {
			setError('An unexpected error occurred')
			toast.error('An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
			{/* ── Left: Brand Panel (Editorial / Clean) ── */}
			<div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between bg-[#0a0a0a] p-12 lg:p-16 xl:p-24 border-r border-zinc-800">
				<div className="flex flex-col h-full justify-between max-w-lg">
					<div>
						<span className="text-xl font-semibold tracking-tight text-white">AI_Trainer</span>
					</div>

					<div className="space-y-6">
						<h1 className="text-4xl lg:text-5xl font-medium leading-[1.1] tracking-tight text-white">
							Intelligent document infrastructure.
						</h1>
						<p className="text-[17px] text-zinc-400 font-light leading-relaxed">
							Upload, organize, and query your secure documents using state-of-the-art AI. Built for the modern enterprise.
						</p>
					</div>

					<div className="text-[13px] font-medium text-zinc-600 flex justify-between items-center">
						<span>© {new Date().getFullYear()} CELED Inc.</span>

					</div>
				</div>
			</div>

			{/* ── Right: Form Panel ── */}
			<div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white relative">
				<div className="w-full max-w-[380px] mx-auto">
					{/* Mobile Brand */}
					<div className="lg:hidden mb-12">
						<span className="text-2xl font-semibold tracking-tight text-zinc-950">AI_Trainer</span>
					</div>

					<div className="mb-10">
						<h2 className="text-[28px] font-semibold tracking-tight text-zinc-950 mb-2">
							Log in
						</h2>
						<p className="text-[15px] text-zinc-500">
							Welcome back. Enter your credentials to access your account.
						</p>
					</div>

					{error && (
						<div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-[14px] border border-red-100 flex items-start gap-3">
							<p className="font-medium">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<label className="block text-[13px] font-medium text-zinc-700" htmlFor="email">
								Email address
							</label>
							<input
								id="email"
								type="email"
								placeholder="name@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
								className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-shadow shadow-sm"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<label className="block text-[13px] font-medium text-zinc-700" htmlFor="password">
									Password
								</label>
								<a href="#" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
									Forgot password?
								</a>
							</div>
							<input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="current-password"
								className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-shadow shadow-sm font-medium tracking-widest"
							/>
						</div>

						<div className="pt-2">
							<button
								type="submit"
								disabled={loading}
								className="w-full inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-[15px] font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								{loading ? 'Signing in...' : 'Sign in'}
							</button>
						</div>
					</form>


				</div>
			</div>
		</div>
	)
}

