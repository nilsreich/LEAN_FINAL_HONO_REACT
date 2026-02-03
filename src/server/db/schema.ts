import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * USER TABLE: Stores identity info.
 * Managed by Better-Auth.
 */
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * SESSION TABLE: Stores active login tokens.
 */
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

/**
 * ACCOUNT TABLE: Needed for Email/Password & Social Auth.
 */
export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * VERIFICATION TABLE: Used for email resets/verifications.
 */
export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

/**
 * POST TABLE: Our custom application logic.
 */
export const post = sqliteTable(
	"post",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text("title").notNull(),
		content: text("content").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		userIdIdx: index("post_userId_idx").on(table.userId),
	}),
);
