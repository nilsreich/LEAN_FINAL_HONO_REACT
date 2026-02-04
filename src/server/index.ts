import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { initAcceptLanguageHeaderDetector } from "typesafe-i18n/detectors";
import type { TranslationFunctions } from "../i18n/i18n-types";
import { detectLocale, i18nObject } from "../i18n/i18n-util";
import { loadAllLocales } from "../i18n/i18n-util.sync";
import { type AuthVariables, authHandler } from "../modules/auth/auth.server";
import { postsRouter } from "../modules/posts/posts.server";

type Variables = AuthVariables & {
	LL: TranslationFunctions;
};

// Load all locales once at startup
loadAllLocales();

/**
 * HONO SERVER CONFIGURATION
 */
const app = new Hono<{ Variables: Variables }>();

// --- COMPRESSION ---
app.use("*", compress());

// --- i18n MIDDLEWARE ---
app.use("*", async (c, next) => {
	const acceptLanguageHeader = c.req.header("Accept-Language") || "en";
	const detector = initAcceptLanguageHeaderDetector({
		headers: {
			get: (key: string) => (key.toLowerCase() === "accept-language" ? acceptLanguageHeader : null),
		},
	});
	const locale = detectLocale(detector);
	c.set("LL", i18nObject(locale));
	await next();
});

// --- RATE LIMITING (Memory-based) ---
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 100;

app.use("/api/*", async (c, next) => {
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

	if (record.count > MAX_REQUESTS) {
		return c.json({ error: "Too many requests" }, 429);
	}

	c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
	c.header("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - record.count).toString());

	await next();
});

// --- SECURE HEADERS (CSP) ---
app.use(
	"*",
	secureHeaders({
		contentSecurityPolicy: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: [
				"'self'",
				"https://*.app.github.dev",
				"http://localhost:3000",
				"http://localhost:4173",
				"http://localhost:4174",
				"http://localhost:5173",
			],
			frameAncestors: ["'none'"],
			objectSrc: ["'none'"],
			upgradeInsecureRequests: [],
		},
	}),
);

// --- CORS CONFIGURATION ---
app.use(
	"/api/*",
	cors({
		origin: (origin) => {
			const allowedLocalPorts = ["3000", "5173", "5174", "5175", "4173", "4174", "4175"];
			const isAllowedLocal =
				origin && allowedLocalPorts.some((port) => origin === `http://localhost:${port}`);

			if (
				isAllowedLocal ||
				origin === process.env.PRODUCTION_URL ||
				origin?.endsWith(".app.github.dev")
			) {
				return origin;
			}
			return "http://localhost:5173";
		},
		credentials: true,
	}),
);

app.use("/api/*", csrf());

// --- 0. SYSTEM ROUTES ---
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// --- 1. AUTHENTICATION ---
app.on(["POST", "GET"], "/api/auth/*", authHandler);

// --- 2. API v1 ---
const apiV1 = new Hono().route("/posts", postsRouter);
app.route("/api", apiV1);

// --- 3. STATIC FRONTEND ---
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", async (c) => {
	const file = Bun.file("./dist/index.html");
	if (await file.exists()) return c.html(await file.text());
	return c.text("Not Found", 404);
});

export type AppType = typeof apiV1;

export default {
	port: 3000,
	fetch: app.fetch,
};
