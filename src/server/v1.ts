import { zValidator } from "@hono/zod-validator";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createPostSchema, paginationSchema } from "../shared/schemas";
import { authGuard } from "./auth/middleware";
import { db } from "./db";
import { post, user } from "./db/schema";
import type { Variables } from "./types";

export const apiV1 = new Hono<{ Variables: Variables }>()
	.get("/posts", zValidator("query", paginationSchema), async (c) => {
		const { limit, offset } = c.req.valid("query");

		// Batching reduces roundtrips to the DB, saving CPU on the VPS
		const [posts, stats] = await db.batch([
			db.select().from(post).orderBy(desc(post.createdAt)).limit(limit).offset(offset),
			db.select({ total: count() }).from(post),
		]);

		// Custom header to show batching was used
		c.header("X-Database-Batch", "true");
		return c.json({
			posts,
			total: stats[0]?.total ?? 0,
			limit,
			offset,
		});
	})
	.get("/posts/:id", async (c) => {
		const id = c.req.param("id");
		const LL = c.get("LL");
		const [targetPost] = await db.batch([db.select().from(post).where(eq(post.id, id)).limit(1)]);

		if (targetPost.length === 0) return c.json({ error: LL.ERROR_POST_NOT_FOUND() }, 404);
		return c.json(targetPost[0]);
	})
	.post(
		"/posts",
		authGuard,
		// Using any to bypass complex Hono type inference while maintaining runtime localization
		(c, next) => zValidator("json", createPostSchema(c.get("LL")))(c as any, next),
		async (c) => {
			// type-cast back to the expected type for internal usage
			const { title, content } = (c.req as any).valid("json");
			const currentUser = c.get("user");
			const LL = c.get("LL");

			if (!currentUser) return c.json({ error: LL.ERROR_UNAUTHORIZED() }, 401);

			const [newPost] = await db
				.insert(post)
				.values({
					title,
					content,
					userId: currentUser.id,
				})
				.returning();

			return c.json(newPost, 201);
		},
	)
	.get("/protected", authGuard, async (c) => {
		const user = c.get("user");
		return c.json({
			message: "This is a protected route",
			user,
		});
	})
	// --- DSGVO / GDPR ROUTES ---
	.get("/me/export", authGuard, async (c) => {
		const currentUser = c.get("user");

		// Fetch all data associated with the user
		const [userData, userPosts] = await db.batch([
			db.select().from(user).where(eq(user.id, currentUser.id)).limit(1),
			db.select().from(post).where(eq(post.userId, currentUser.id)),
		]);

		return c.json({
			exportDate: new Date().toISOString(),
			user: userData[0],
			posts: userPosts,
			info: "This export contains all personal data stored in our system according to Art. 15 GDPR.",
		});
	})
	.delete("/me", authGuard, async (c) => {
		const currentUser = c.get("user");

		// Delete the user (cascading will handle posts, sessions, etc. because of the schema update)
		await db.delete(user).where(eq(user.id, currentUser.id));

		return c.json({ message: "User and all associated data deleted successfully." });
	});
