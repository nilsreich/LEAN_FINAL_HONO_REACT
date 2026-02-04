import { describe, expect, it, mock } from "bun:test";

mock.module("./db", () => {
	const mockDb = {
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
	};
	return { db: mockDb };
});

mock.module("./auth/auth", () => ({
	auth: {
		api: {
			getSession: mock(async () => ({ user: { id: "test-user" }, session: {} })),
		},
		$Infer: {
			Session: {
				user: {} as any,
				session: {} as any,
			},
		},
	},
}));

mock.module("./auth/middleware", () => ({
	authGuard: async (c: any, next: any) => {
		c.set("user", { id: "test-user" });
		await next();
	},
}));

import { createPostSchema, paginationSchema } from "../shared/schemas";
import { apiV1 } from "./v1";

describe("API v1 Unit Tests", () => {
	it("Pagination schema should validate correct input", () => {
		const valid = paginationSchema.safeParse({ limit: "10", offset: "0" });
		expect(valid.success).toBe(true);
		if (valid.success) {
			expect(valid.data.limit).toBe(10);
			expect(valid.data.offset).toBe(0);
		}
	});

	it("Pagination schema should fail on invalid input", () => {
		const invalid = paginationSchema.safeParse({ limit: "invalid" });
		expect(invalid.success).toBe(false);
	});

	it("Post creation schema should validate correctly", () => {
		const valid = { title: "Test Title", content: "Test Content" };
		const result = createPostSchema().safeParse(valid);
		expect(result.success).toBe(true);
	});

	it("GET /posts should return 200 (Unit Test with Mock)", async () => {
		const { db } = await import("./db");
		(db.batch as any).mockResolvedValueOnce([[], [{ total: 0 }]]);

		const res = await apiV1.request("/posts?limit=10&offset=0");
		expect(res.status).toBe(200);
	});

	it("POST /posts should return 201 (Unit Test with Mock)", async () => {
		const { db } = await import("./db");
		(db.insert as any).mockReturnValueOnce({
			values: mock().mockReturnValueOnce({
				returning: mock().mockResolvedValueOnce([
					{ id: "1", title: "Test", content: "Test", userId: "test-user" },
				]),
			}),
		});

		const res = await apiV1.request("/posts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Test", content: "Test" }),
		});
		expect(res.status).toBe(201);
	});
});
