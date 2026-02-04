import { hc } from "hono/client";
import type { AppType } from "../../server/index";

/**
 * HONO RPC CLIENT
 * Provides end-to-end typesafety between backend and frontend.
 * Targeted at API v1.
 */
export const api = hc<AppType>("/api/v1", {
	headers: () => {
		const search = new URLSearchParams(window.location.search);
		const lang = search.get("lang") || "en";
		return {
			"Accept-Language": lang,
		};
	},
});
