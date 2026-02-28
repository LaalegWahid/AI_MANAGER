import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { DashboardStats } from '../../../lib/api'
import { adminApi } from '../../../lib/api'


export const Route = createFileRoute('/_auth/admin/overview')({
	component: OverviewPage,
})

function OverviewPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [loading, setLoading] = useState(true)

	const fetchStats = useCallback(async () => {
		try {
			const data = await adminApi.stats()
			setStats(data)
		} catch {
			toast.error('Failed to load dashboard stats')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchStats()
	}, [fetchStats])

	if (loading) {
		return (
			<div className="p-8">
				<h2 className="text-xl font-semibold">Overview</h2>
				<div className="mt-8 text-center text-muted-foreground">Loading...</div>
			</div>
		)
	}

	if (!stats) return null

	const cards = [
		{ label: 'Total Users', value: stats.total, description: 'All accounts on the platform' },
		{ label: 'Customers', value: stats.customers, description: 'Regular user accounts' },
		{ label: 'Admins', value: stats.admins, description: 'Users with admin privileges' },
		{ label: 'Blocked', value: stats.blocked, description: 'Currently blocked accounts' },
	]

	return (
		<div className="p-8">
			<h2 className="text-xl font-semibold">Overview</h2>
			<p className="mt-1 text-sm text-muted-foreground">Platform metrics at a glance</p>

			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{cards.map((card) => (
					<div key={card.label} className="rounded-lg border bg-card p-5">
						<p className="text-sm font-medium text-muted-foreground">{card.label}</p>
						<p className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</p>
						<p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
					</div>
				))}
			</div>
		</div>
	)
}
