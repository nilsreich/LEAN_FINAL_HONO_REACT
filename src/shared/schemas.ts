import { z } from "zod";

/**
 * SHARED SCHEMAS
 * These are used by both frontend (forms) and backend (validation).
 */

export const createPostSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title too long"),
	content: z.string().min(1, "Content is required"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
