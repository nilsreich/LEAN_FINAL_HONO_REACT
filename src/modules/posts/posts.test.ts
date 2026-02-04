import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";

// GLOBAL MOCKS
mock.module("../auth/auth.server", () => ({
	authGuard: async (c: any, next: any) => {
		c.set("user", { id: "test-user" });
		return next();
	},
}));

mock.module("../../core/db", () => ({
	db: {
		batch: mock(),
		select: mock(() => ({
			from: mock(() => ({
				orderBy: mock(() => ({
					limit: mock(() => ({
						offset: mock(),
					})),
				})),
				where: mock(() => ({
					limit: mock(),
				})),
			})),
		})),
		insert: mock(() => ({
			values: mock(() => ({
				returning: mock(),
			})),
		})),
		delete: mock(() => ({
			where: mock(),
		})),
	},
}));

// We must import the router AFTER the mock has been registered
const { postsRouter } = await import("./posts.server");

describe("Posts Module Tests", () => {
	describe("Route Tests", () => {
		it("POST / should return 201", async () => {
			const { db } = await import("../../core/db");
			(db.insert as any).mockReturnValueOnce({
				values: mock().mockReturnValueOnce({
					returning: mock().mockResolvedValueOnce([
						{ id: "1", title: "Test", content: "Test", userId: "test-user" },
					]),
				}),
			});

			const app = new Hono().route("/", postsRouter);
			const res = await app.request("/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: "Test", content: "Test" }),
			});

			expect(res.status).toBe(201);
		});

		it("GET / should return 200", async () => {
			const { db } = await import("../../core/db");
			(db.batch as any).mockResolvedValueOnce([
				[{ id: "1", title: "Test", content: "Test", userId: "test-user" }],
				[{ total: 1 }],
			]);

			const app = new Hono().route("/", postsRouter);
			const res = await app.request("/?limit=10&offset=0");

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.posts).toHaveLength(1);
			expect(data.total).toBe(1);
		});

		it("GET /:id should return 200", async () => {
			const { db } = await import("../../core/db");
			(db.batch as any).mockResolvedValueOnce([
				[{ id: "1", title: "Test", content: "Test", userId: "test-user" }],
			]);

			const app = new Hono().route("/", postsRouter);
			const res = await app.request("/1");

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.id).toBe("1");
		});

		it("DELETE /:id should return 204", async () => {
			const { db } = await import("../../core/db");
			// Delete mock
			(db.delete as any).mockReturnValueOnce({
				where: mock().mockResolvedValueOnce(undefined),
			});

			const app = new Hono().route("/", postsRouter);
			const res = await app.request("/1", {
				method: "DELETE",
			});

			expect(res.status).toBe(204);
		});
	});
});
