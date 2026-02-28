import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { signOut, useSession } from '../../lib/auth-client'
import { cn } from '../../lib/utils'

export const Route = createFileRoute('/_auth/admin')({
	component: AdminLayout,
})

const navItems = [
	{ to: '/admin/overview', label: 'Overview' },
	{ to: '/admin/customers', label: 'Customers' },
	{ to: '/admin/admins', label: 'Admins' },
] as const

function AdminLayout() {
	const navigate = useNavigate()
	const { data: session, isPending } = useSession()
	const pathname = useRouterState({ select: (s) => s.location.pathname })

	useEffect(() => {
		if (!isPending && (!session?.user || session.user.role !== 'admin')) {
			navigate({ to: '/dashboard' })
		}
	}, [isPending, session?.user, navigate])

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	if (!session?.user || session.user.role !== 'admin') {
		return null
	}

	const user = session.user

	const handleSignOut = async () => {
		await signOut()
		toast.success('Signed out')
		navigate({ to: '/login' })
	}

	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="flex w-60 flex-col border-r bg-muted/30">
				<div className="border-b px-5 py-4">
					<h1 className="text-sm font-semibold tracking-tight">CELED Platform</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">Admin Panel</p>
				</div>

				<nav className="flex-1 space-y-1 px-3 py-4">
					{navItems.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className={cn(
								'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
								pathname === item.to
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="border-t px-5 py-4">
					<div className="text-sm font-medium truncate">{user.name}</div>
					<div className="text-xs text-muted-foreground truncate">{user.email}</div>
					<button
						type="button"
						onClick={handleSignOut}
						className="mt-3 w-full rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
					>
						Sign out
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">
				<Outlet />
			</main>
		</div>
	)
}
