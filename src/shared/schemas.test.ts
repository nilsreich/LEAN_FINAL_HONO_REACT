import { describe, expect, it } from "vitest";
import { createPostSchema, paginationSchema } from "../shared/schemas";

describe("Post Schema Tests", () => {
	it("should validate a valid post", () => {
		const res = createPostSchema.safeParse({
			title: "My first post",
			content: "This is a great content",
		});
		expect(res.success).toBe(true);
	});

	it("should fail if title is missing", () => {
		const res = createPostSchema.safeParse({
			content: "Missing title",
		});
		expect(res.success).toBe(false);
	});

	it("should fail if title is too long", () => {
		const res = createPostSchema.safeParse({
			title: "A".repeat(101),
			content: "Valid content",
		});
		expect(res.success).toBe(false);
	});
});

describe("Pagination Schema Tests", () => {
	it("should parse valid limit and offset", () => {
		const res = paginationSchema.safeParse({ limit: "5", offset: "10" });
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.limit).toBe(5);
			expect(res.data.offset).toBe(10);
		}
	});

	it("should use default values if missing", () => {
		const res = paginationSchema.safeParse({});
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.limit).toBe(10);
			expect(res.data.offset).toBe(0);
		}
	});

	it("should fail if limit is over 100", () => {
		const res = paginationSchema.safeParse({ limit: 101 });
		expect(res.success).toBe(false);
	});
});
