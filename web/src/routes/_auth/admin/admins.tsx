import { createFileRoute } from '@tanstack/react-router'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '../../../lib/auth-client'
import { adminApi, type UserRecord } from '../../../lib/api'


export const Route = createFileRoute('/_auth/admin/admins')({
	component: AdminsPage,
})

function AdminsPage() {
	const { data: session } = useSession()
	const [admins, setAdmins] = useState<UserRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [editTarget, setEditTarget] = useState<UserRecord | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)

	const fetchAdmins = useCallback(async () => {
		try {
			const data = await adminApi.listUsers({ role: 'admin' })
			setAdmins(data)
		} catch {
			toast.error('Failed to load admins')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchAdmins()
	}, [fetchAdmins])

	const handleBan = async (userId: string) => {
		try {
			await adminApi.banUser(userId)
			toast.success('Admin blocked')
			fetchAdmins()
		} catch {
			toast.error('Failed to block admin')
		}
	}

	const handleUnban = async (userId: string) => {
		try {
			await adminApi.unbanUser(userId)
			toast.success('Admin unblocked')
			fetchAdmins()
		} catch {
			toast.error('Failed to unblock admin')
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await adminApi.deleteUser(deleteTarget.id)
			toast.success('Admin deleted')
			setDeleteTarget(null)
			fetchAdmins()
		} catch {
			toast.error('Failed to delete admin')
		}
	}

	return (
		<div className="p-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Admins</h2>
					<p className="mt-1 text-sm text-muted-foreground">Manage admin accounts</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreateModal(true)}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Create Admin
				</button>
			</div>

			{loading ? (
				<div className="mt-8 text-center text-muted-foreground">Loading...</div>
			) : admins.length === 0 ? (
				<div className="mt-8 text-center text-muted-foreground">No admins found</div>
			) : (
				<div className="mt-6 overflow-hidden rounded-lg border">
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
							{admins.map((a) => {
								const isSelf = a.id === session?.user?.id
								return (
									<tr key={a.id}>
										<td className="px-4 py-3 font-medium">
											{a.name}
											{isSelf && (
												<span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
													You
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-muted-foreground">{a.email}</td>
										<td className="px-4 py-3">
											{a.banned ? (
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
											{new Date(a.createdAt).toLocaleDateString()}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-2">
												<button
													type="button"
													onClick={() => setEditTarget(a)}
													className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
												>
													Edit
												</button>
												{!isSelf && (
													<>
														{a.banned ? (
															<button
																type="button"
																onClick={() => handleUnban(a.id)}
																className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
															>
																Unblock
															</button>
														) : (
															<button
																type="button"
																onClick={() => handleBan(a.id)}
																className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
															>
																Block
															</button>
														)}
														<button
															type="button"
															onClick={() => setDeleteTarget(a)}
															className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
														>
															Delete
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}

			{showCreateModal && (
				<CreateAdminModal
					onClose={() => setShowCreateModal(false)}
					onCreated={() => {
						setShowCreateModal(false)
						fetchAdmins()
					}}
				/>
			)}

			{editTarget && (
				<EditAdminModal
					admin={editTarget}
					onClose={() => setEditTarget(null)}
					onSaved={() => {
						setEditTarget(null)
						fetchAdmins()
					}}
				/>
			)}

			{deleteTarget && (
				<ConfirmDeleteModal
					admin={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
				/>
			)}
		</div>
	)
}

// ---- Create Admin Modal ----
function CreateAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await adminApi.createUser({ name, email, password, role: 'admin' })
			toast.success('Admin created')
			onCreated()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create admin')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<h3 className="text-lg font-semibold">Create Admin</h3>
				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<Field label="Name" id="admin-name">
						<input
							id="admin-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Email" id="admin-email">
						<input
							id="admin-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Password" id="admin-password">
						<input
							id="admin-password"
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

// ---- Edit Admin Modal ----
function EditAdminModal({
	admin,
	onClose,
	onSaved,
}: {
	admin: UserRecord
	onClose: () => void
	onSaved: () => void
}) {
	const [name, setName] = useState(admin.name)
	const [email, setEmail] = useState(admin.email)
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)

		const updates: { name?: string; email?: string; password?: string } = {}
		if (name !== admin.name) updates.name = name
		if (email !== admin.email) updates.email = email
		if (password) updates.password = password

		if (Object.keys(updates).length === 0) {
			onClose()
			return
		}

		try {
			await adminApi.updateUser(admin.id, updates)
			toast.success('Admin updated')
			onSaved()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update admin')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<h3 className="text-lg font-semibold">Edit Admin</h3>
				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<Field label="Name" id="edit-name">
						<input
							id="edit-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Email" id="edit-email">
						<input
							id="edit-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="New Password" id="edit-password">
						<input
							id="edit-password"
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

// ---- Delete Confirmation Modal ----
function ConfirmDeleteModal({
	admin,
	onCancel,
	onConfirm,
}: {
	admin: UserRecord
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
				<h3 className="text-lg font-semibold">Delete Admin</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Are you sure you want to permanently delete <strong>{admin.name}</strong> ({admin.email}
					)? This action cannot be undone.
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
