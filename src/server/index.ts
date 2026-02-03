import { zValidator } from "@hono/zod-validator";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { createPostSchema } from "../shared/schemas";
import { auth } from "./auth/auth";
import { db } from "./db";
import { post } from "./db/schema";

/**
 * HONO SERVER CONFIGURATION
 * This is the unified entry point for both API and Static Frontend.
 */
const app = new Hono();

// Diagnostic checks
if (!process.env.BETTER_AUTH_SECRET) {
	console.warn("⚠️ BETTER_AUTH_SECRET is missing in process.env!");
}

// Request Logger
app.use("*", async (c, next) => {
	console.log(`[${c.req.method}] ${c.req.url}`);
	await next();
});

// Add error logging
app.onError((err, c) => {
	console.error("Hono Error Details:", err);
	return c.json({ error: err.message, stack: err.stack }, 500);
});

// --- 1. AUTHENTICATION HANDLER ---
// Directs all /api/auth/* requests to Better-Auth
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

// --- 2. API ROUTES ---
const routes = app
	.get("/api/posts", async (c) => {
		// Batching reduces roundtrips to the DB, saving CPU on the VPS
		const [posts, stats] = await db.batch([
			db.select().from(post).orderBy(desc(post.createdAt)),
			db.select({ total: count() }).from(post),
		]);

		// Custom header to show batching was used
		c.header("X-Database-Batch", "true");
		return c.json({
			posts,
			total: stats[0]?.total ?? 0,
		});
	})
	.get("/api/posts/:id", async (c) => {
		const id = c.req.param("id");
		const [targetPost] = await db.batch([db.select().from(post).where(eq(post.id, id)).limit(1)]);

		if (targetPost.length === 0) return c.json({ error: "Post not found" }, 404);
		return c.json(targetPost[0]);
	})
	.post("/api/posts", zValidator("json", createPostSchema), async (c) => {
		// Check session via Better-Auth
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const body = c.req.valid("json");
		const newPost = {
			id: crypto.randomUUID(),
			title: body.title,
			content: body.content,
			userId: session.user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await db.insert(post).values(newPost);
		return c.json(newPost);
	});

// --- 3. STATIC FRONTEND SERVING ---

// Serve static files from the 'dist' folder (built by Vite)
app.use("/*", serveStatic({ root: "./dist" }));

// Fallback for SPA: Redirect all non-found routes to index.html
app.get("*", async (c) => {
	const file = Bun.file("./dist/index.html");
	if (await file.exists()) {
		return c.html(await file.text());
	}
	return c.text("Not Found", 404);
});

export type AppType = typeof routes;

/**
 * BUN RUNTIME CONFIG
 */
export default {
	port: 3000,
	fetch: app.fetch,
};
