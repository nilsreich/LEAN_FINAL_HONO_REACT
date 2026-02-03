import { z } from "zod";

/**
 * SHARED SCHEMAS
 * These are used by both frontend (forms) and backend (validation).
 */

export const createPostSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title too long"),
	content: z.string().min(1, "Content is required"),
});

export const paginationSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
