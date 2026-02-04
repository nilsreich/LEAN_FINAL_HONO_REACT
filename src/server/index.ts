import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { initAcceptLanguageHeaderDetector } from "typesafe-i18n/detectors";
import { loggerMiddleware } from "../core/logger";
import type { TranslationFunctions } from "../i18n/i18n-types";
import { detectLocale, i18nObject } from "../i18n/i18n-util";
import { loadAllLocales } from "../i18n/i18n-util.sync";
import { type AuthVariables, authHandler } from "../modules/auth/auth.server";
import { postsRouter } from "../modules/posts/posts.server";
import { adminRouter } from "./admin";

type Variables = AuthVariables & {
	LL: TranslationFunctions;
};

// Load all locales once at startup
loadAllLocales();

/**
 * HONO SERVER CONFIGURATION
 */
const app = new Hono<{ Variables: Variables }>();

// --- 1. GLOBAL MIDDLEWARE ---
app.use("*", loggerMiddleware);
app.use("*", compress());

// --- 2. SECURITY & HEADERS ---
app.use("*", async (c, next) => {
	if (c.req.path.startsWith("/admin")) return next();
	return secureHeaders({
		contentSecurityPolicy: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
			styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
			imgSrc: ["'self'", "data:", "https:"],
			manifestSrc: ["'self'", "https://*.github.dev", "https://*.app.github.dev"],
			connectSrc: [
				"'self'",
				"https://*.app.github.dev",
				"wss://*.app.github.dev",
				"http://localhost:*",
			],
			frameAncestors: ["'none'"],
			upgradeInsecureRequests: [],
		},
	})(c, next);
});

// --- 3. API SCOPED MIDDLEWARE ---
const apiScope = app.basePath("/api");

// Rate Limiting State
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 100;

apiScope.use("*", async (c, next) => {
	// Locale Detection
	const acceptLanguageHeader = c.req.header("Accept-Language") || "en";
	const detector = initAcceptLanguageHeaderDetector({
		headers: { get: (k) => (k.toLowerCase() === "accept-language" ? acceptLanguageHeader : null) },
	});
	c.set("LL", i18nObject(detectLocale(detector)));

	// Rate Limiting
	const ip = c.req.header("x-forwarded-for") || "local";
	const now = Date.now();
	const record = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW };

	if (now > record.reset) {
		record.count = 1;
		record.reset = now + RATE_LIMIT_WINDOW;
	} else {
		record.count++;
	}
	rateLimitMap.set(ip, record);

	if (record.count > MAX_REQUESTS) return c.json({ error: "Too many requests" }, 429);
	c.header("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - record.count).toString());

	await next();
});

apiScope.use(
	"*",
	cors({
		origin: (origin) => {
			if (!origin || origin.startsWith("http://localhost") || origin.endsWith(".app.github.dev"))
				return origin;
			return null;
		},
		credentials: true,
	}),
);

apiScope.use("*", csrf());

// --- 4. ROUTES ---
app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

app.route("/admin", adminRouter);
app.on(["POST", "GET"], "/api/auth/*", authHandler);

const apiRoutes = new Hono().route("/posts", postsRouter);
app.route("/api", apiRoutes);

// --- 5. STATIC ASSETS ---
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", async (c) => {
	const path = c.req.path;
	if (path.includes(".") && !path.endsWith(".html")) return c.text("Not Found", 404);

	const file = Bun.file("./dist/index.html");
	return (await file.exists()) ? c.html(await file.text()) : c.text("Not Found", 404);
});

export type AppType = typeof apiRoutes;

export default {
	port: 3000,
	fetch: app.fetch,
};
