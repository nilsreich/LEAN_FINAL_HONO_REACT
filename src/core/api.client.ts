import { hc } from "hono/client";
import type { AppType } from "../server";

export const api = hc<AppType>("/api", {
	headers: () => {
		const search = new URLSearchParams(window.location.search);
		const lang = search.get("lang") || "en";
		return {
			"Accept-Language": lang,
		};
	},
});
