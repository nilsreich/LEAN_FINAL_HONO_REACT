import { z } from "zod";
import type { TranslationFunctions } from "../i18n/i18n-types";

/**
 * SHARED SCHEMAS
 * These are used by both frontend (forms) and backend (validation).
 */

export const createPostSchema = (LL?: TranslationFunctions) =>
	z.object({
		title: z
			.string()
			.min(1, LL?.VALIDATION_TITLE_REQUIRED() ?? "Title is required")
			.max(100, LL?.VALIDATION_TITLE_TOO_LONG() ?? "Title too long"),
		content: z.string().min(1, LL?.VALIDATION_CONTENT_REQUIRED() ?? "Content is required"),
	});

export const paginationSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
});

export type CreatePostInput = z.infer<ReturnType<typeof createPostSchema>>;
export type PaginationInput = z.infer<typeof paginationSchema>;
