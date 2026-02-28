import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSession } from '../lib/auth-client'

export const Route = createFileRoute('/_auth')({
	component: AuthLayout,
})

function AuthLayout() {
	const navigate = useNavigate()
	const { data: session, isPending } = useSession()

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: '/login' })
		}
	}, [isPending, session?.user, navigate])

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	if (!session?.user) {
		return null
	}

	return <Outlet />
}

