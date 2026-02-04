import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "../auth/auth.db";

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
