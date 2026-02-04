import { zValidator } from "@hono/zod-validator";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../core/db";
import { authGuard } from "../auth/auth.server";
import { post } from "./posts.db";
import { type CreatePostInput, createPostSchema, paginationSchema } from "./posts.shared";

export const postsRouter = new Hono()
	.get("/", zValidator("query", paginationSchema), async (c) => {
		const { limit, offset } = c.req.valid("query");

		const [posts, stats] = await db.batch([
			db.select().from(post).orderBy(desc(post.createdAt)).limit(limit).offset(offset),
			db.select({ total: count() }).from(post),
		]);

		c.header("X-Database-Batch", "true");
		return c.json({
			posts,
			total: stats[0]?.total ?? 0,
			limit,
			offset,
		});
	})
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const LL = (c as any).get("LL");
		const [targetPost] = await db.batch([db.select().from(post).where(eq(post.id, id)).limit(1)]);

		if (targetPost.length === 0) return c.json({ error: LL.ERROR_POST_NOT_FOUND() }, 404);
		return c.json(targetPost[0]);
	})
	.post(
		"/",
		authGuard,
		(c, next) => zValidator("json", createPostSchema((c as any).get("LL")))(c as any, next),
		async (c) => {
			const body = (c.req as any).valid("json") as CreatePostInput;
			const { title, content } = body;
			const currentUser = (c as any).get("user");
			const LL = (c as any).get("LL");

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
	.delete("/:id", authGuard, async (c) => {
		const id = c.req.param("id");
		await db.delete(post).where(eq(post.id, id));
		return c.body(null, 204);
	});
