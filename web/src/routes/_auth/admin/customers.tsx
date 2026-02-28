import { createFileRoute } from '@tanstack/react-router'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { UserRecord } from '../../../lib/api'
import { adminApi } from '../../../lib/api'


export const Route = createFileRoute('/_auth/admin/customers')({
	component: CustomersPage,
})

function CustomersPage() {
	const [users, setUsers] = useState<UserRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [editTarget, setEditTarget] = useState<UserRecord | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)

	const fetchUsers = useCallback(async () => {
		try {
			const data = await adminApi.listUsers({ role: 'user' })
			setUsers(data)
		} catch {
			toast.error('Failed to load customers')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	const filtered = useMemo(() => {
		let result = users
		if (search) {
			const q = search.toLowerCase()
			result = result.filter(
				(u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
			)
		}
		if (statusFilter === 'active') result = result.filter((u) => !u.banned)
		if (statusFilter === 'blocked') result = result.filter((u) => u.banned)
		return result
	}, [users, search, statusFilter])

	const handleBan = async (userId: string) => {
		try {
			await adminApi.banUser(userId)
			toast.success('Customer blocked')
			fetchUsers()
		} catch {
			toast.error('Failed to block customer')
		}
	}

	const handleUnban = async (userId: string) => {
		try {
			await adminApi.unbanUser(userId)
			toast.success('Customer unblocked')
			fetchUsers()
		} catch {
			toast.error('Failed to unblock customer')
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await adminApi.deleteUser(deleteTarget.id)
			toast.success('Customer deleted')
			setDeleteTarget(null)
			fetchUsers()
		} catch {
			toast.error('Failed to delete customer')
		}
	}

	return (
		<div className="p-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Customers</h2>
					<p className="mt-1 text-sm text-muted-foreground">Manage customer accounts</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreateModal(true)}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Create Customer
				</button>
			</div>

			{/* Search & Filter */}
			<div className="mt-6 flex gap-3">
				<input
					type="text"
					placeholder="Search by name or email..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
					className="rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="all">All statuses</option>
					<option value="active">Active</option>
					<option value="blocked">Blocked</option>
				</select>
			</div>

			{/* Table */}
			{loading ? (
				<div className="mt-8 text-center text-muted-foreground">Loading...</div>
			) : filtered.length === 0 ? (
				<div className="mt-8 text-center text-muted-foreground">
					{users.length === 0 ? 'No customers yet' : 'No customers match your filters'}
				</div>
			) : (
				<div className="mt-4 overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">Name</th>
								<th className="px-4 py-3 text-left font-medium">Email</th>
								<th className="px-4 py-3 text-left font-medium">Status</th>
								<th className="px-4 py-3 text-left font-medium">Joined</th>
								<th className="px-4 py-3 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{filtered.map((u) => (
								<tr key={u.id}>
									<td className="px-4 py-3 font-medium">{u.name}</td>
									<td className="px-4 py-3 text-muted-foreground">{u.email}</td>
									<td className="px-4 py-3">
										{u.banned ? (
											<span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
												Blocked
											</span>
										) : (
											<span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700">
												Active
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{new Date(u.createdAt).toLocaleDateString()}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-2">
											<button
												type="button"
												onClick={() => setEditTarget(u)}
												className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
											>
												Edit
											</button>
											{u.banned ? (
												<button
													type="button"
													onClick={() => handleUnban(u.id)}
													className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
												>
													Unblock
												</button>
											) : (
												<button
													type="button"
													onClick={() => handleBan(u.id)}
													className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
												>
													Block
												</button>
											)}
											<button
												type="button"
												onClick={() => setDeleteTarget(u)}
												className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Create Modal */}
			{showCreateModal && (
				<CreateCustomerModal
					onClose={() => setShowCreateModal(false)}
					onCreated={() => {
						setShowCreateModal(false)
						fetchUsers()
					}}
				/>
			)}

			{/* Edit Modal */}
			{editTarget && (
				<EditCustomerModal
					customer={editTarget}
					onClose={() => setEditTarget(null)}
					onSaved={() => {
						setEditTarget(null)
						fetchUsers()
					}}
				/>
			)}

			{/* Delete Confirmation */}
			{deleteTarget && (
				<ConfirmDeleteModal
					user={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
				/>
			)}
		</div>
	)
}

// ---- Create Customer Modal ----
function CreateCustomerModal({
	onClose,
	onCreated,
}: {
	onClose: () => void
	onCreated: () => void
}) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await adminApi.createUser({ name, email, password, role: 'user' })
			toast.success('Customer created')
			onCreated()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create customer')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<h3 className="text-lg font-semibold">Create Customer</h3>
				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<Field label="Name" id="cust-name">
						<input
							id="cust-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Email" id="cust-email">
						<input
							id="cust-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Temporary Password" id="cust-password">
						<input
							id="cust-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{loading ? 'Creating...' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

// ---- Delete Confirmation Modal ----
function ConfirmDeleteModal({
	user,
	onCancel,
	onConfirm,
}: {
	user: UserRecord
	onCancel: () => void
	onConfirm: () => void
}) {
	const [loading, setLoading] = useState(false)

	const handleConfirm = async () => {
		setLoading(true)
		await onConfirm()
		setLoading(false)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
				<h3 className="text-lg font-semibold">Delete Customer</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Are you sure you want to permanently delete <strong>{user.name}</strong> ({user.email})?
					This action cannot be undone.
				</p>
				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={loading}
						className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
					>
						{loading ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ---- Edit Customer Modal ----
function EditCustomerModal({
	customer,
	onClose,
	onSaved,
}: {
	customer: UserRecord
	onClose: () => void
	onSaved: () => void
}) {
	const [name, setName] = useState(customer.name)
	const [email, setEmail] = useState(customer.email)
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)

		const updates: { name?: string; email?: string; password?: string } = {}
		if (name !== customer.name) updates.name = name
		if (email !== customer.email) updates.email = email
		if (password) updates.password = password

		if (Object.keys(updates).length === 0) {
			onClose()
			return
		}

		try {
			await adminApi.updateUser(customer.id, updates)
			toast.success('Customer updated')
			onSaved()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update customer')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<h3 className="text-lg font-semibold">Edit Customer</h3>
				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<Field label="Name" id="edit-cust-name">
						<input
							id="edit-cust-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Email" id="edit-cust-email">
						<input
							id="edit-cust-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="New Password" id="edit-cust-password">
						<input
							id="edit-cust-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							minLength={8}
							placeholder="Leave blank to keep current"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
						/>
					</Field>
					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{loading ? 'Saving...' : 'Save'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

// ---- Field helper ----
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{children}
		</div>
	)
}
