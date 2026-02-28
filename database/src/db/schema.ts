import { relations, sql } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
	id: uuid('id')
		.default(sql`gen_random_uuid()`)
		.primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	// Better Auth admin plugin fields
	role: text('role').default('user').notNull(), // 'user' | 'admin'
	banned: boolean('banned').default(false),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	bucketName: text('bucket_name'),
	knowledgeBaseId: text('knowledge_base_id'),
})

export const session = pgTable(
	'session',
	{
		id: uuid('id')
			.default(sql`gen_random_uuid()`)
			.primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		impersonatedBy: text('impersonated_by'),
	},
	(table) => [index('session_userId_idx').on(table.userId), index('session_token_idx').on(table.token)],
)

export const account = pgTable(
	'account',
	{
		id: uuid('id')
			.default(sql`gen_random_uuid()`)
			.primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
	'verification',
	{
		id: uuid('id')
			.default(sql`gen_random_uuid()`)
			.primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const apikey = pgTable(
	'apikey',
	{
		id: uuid('id')
			.default(sql`gen_random_uuid()`)
			.primaryKey(),
		name: text('name'),
		start: text('start'),
		prefix: text('prefix'),
		key: text('key').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		refillInterval: text('refill_interval'),
		refillAmount: integer('refill_amount'),
		lastRefillAt: timestamp('last_refill_at'),
		enabled: boolean('enabled').default(true),
		rateLimitEnabled: boolean('rate_limit_enabled').default(false),
		rateLimitTimeWindow: integer('rate_limit_time_window').default(0),
		rateLimitMax: integer('rate_limit_max').default(0),
		requestCount: integer('request_count').default(0),
		remaining: integer('remaining'),
		lastRequest: timestamp('last_request'),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
		permissions: text('permissions'),
		metadata: text('metadata'),
	},
	(table) => [index('apikey_userId_idx').on(table.userId)],
)

// ---- Relations ----
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	apikeys: many(apikey),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const apikeyRelations = relations(apikey, ({ one }) => ({
	user: one(user, { fields: [apikey.userId], references: [user.id] }),
}))
