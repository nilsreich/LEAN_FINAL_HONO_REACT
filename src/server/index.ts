import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth/auth";
import { Logger } from "./lib/logger";
import type { Variables } from "./types";
import { apiV1 } from "./v1";

/**
 * HONO SERVER CONFIGURATION
 */
const app = new Hono<{ Variables: Variables }>();

// --- COMPRESSION ---
app.use("*", compress());

// Diagnostic checks
if (!process.env.BETTER_AUTH_SECRET) {
	Logger.warn("BETTER_AUTH_SECRET is missing in process.env!");
}

// --- STRUCTURED LOGGING ---
app.use("*", async (c, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;

	const logData = {
		time: new Date().toISOString(),
		method: c.req.method,
		path: c.req.path,
		status: c.res.status,
		duration: `${ms}ms`,
		ip: c.req.header("x-forwarded-for") || "local",
		userAgent: c.req.header("user-agent"),
	};

	console.log(JSON.stringify(logData));
});

// --- RATE LIMITING (Memory-based) ---
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

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

// --- LOGGING MIDDLEWARE ---
app.use("*", async (c, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;

	// Only log structured for API or significant routes
	// Skip health check to keep logs cleaner if desired
	if (c.req.path.startsWith("/api") && !c.req.path.includes("/health")) {
		Logger.info(`API Request: ${c.req.method} ${c.req.path}`, {
			method: c.req.method,
			path: c.req.path,
			status: c.res.status,
			duration: `${ms}ms`,
			userAgent: c.req.header("user-agent"),
			ip: c.req.header("x-forwarded-for") || "local",
		});
	}
});

// --- SECURE HEADERS (CSP) ---
app.use(
	"*",
	secureHeaders({
		contentSecurityPolicy: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'"], // Required for theme detection & splash logic
			styleSrc: ["'self'", "'unsafe-inline'"], // Required for daisyUI and splash styles
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
			// GitHub Codespaces support: Allow localhost ports commonly used and *.app.github.dev
			const allowedLocalPorts = ["3000", "5173", "5174", "5175", "4173", "4174", "4175"];
			const isAllowedLocal =
				origin && allowedLocalPorts.some((port) => origin === `http://localhost:${port}`);

			if (isAllowedLocal || origin === process.env.PRODUCTION_URL || origin?.endsWith(".app.github.dev")) {
				return origin;
			}
			return "http://localhost:5173"; // Default for development
		},
		credentials: true,
	}),
);

// --- CSRF PROTECTION ---
// Better Auth handles CSRF for its own endpoints.
// Adding Hono's CSRF middleware provides an additional layer for all other API routes.
app.use("/api/*", csrf());

// --- ERROR HANDLING ---
app.onError((err, c) => {
	const isProduction = process.env.NODE_ENV === "production";
	const status = "status" in err && typeof err.status === "number" ? err.status : 500;

	Logger.error(`API Error: ${c.req.method} ${c.req.url}`, err, {
		status,
		path: c.req.path,
		ip: c.req.header("x-forwarded-for"),
	});

	return c.json(
		{
			success: false,
			error: {
				message: isProduction && status === 500 ? "Internal Server Error" : err.message,
				code: status,
				...(isProduction ? {} : { stack: err.stack }),
			},
		},
		status as any,
	);
});

// --- 0. SYSTEM ROUTES ---
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memoryUsage: process.memoryUsage(),
		bunVersion: Bun.version,
	});
});

// --- 1. AUTHENTICATION HANDLER ---
// Directs all /api/auth/* requests to Better-Auth
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

// --- 2. API v1 ROUTES ---
app.route("/api/v1", apiV1);

// --- 3. STATIC FRONTEND SERVING ---

// Serve static files from the 'dist' folder (built by Vite)
app.use("/*", serveStatic({ root: "./dist" }));

// Fallback for SPA: Redirect all non-found routes to index.html
app.get("*", async (c) => {
	const file = Bun.file("./dist/index.html");
	if (await file.exists()) {
		return c.html(await file.text());
	}
	return c.text("Not Found", 404);
});

export type AppType = typeof apiV1;

/**
 * GRACEFUL SHUTDOWN LOGIC
 */
const shutdown = async (signal: string) => {
	console.log(`\n${signal} received. Starting graceful shutdown...`);

	// Add logic to close DB connections if necessary
	// For libSQL/SQLite (local file), it's mostly handled by the OS, but explicit closing is better.
	try {
		// If using libSQL client.close()
		// await client.close();
		console.log("Database connections closed.");
	} catch (err) {
		console.error("Error during shutdown:", err);
	}

	console.log("Cleanup finished. Exiting process.");
	process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * BUN RUNTIME CONFIG
 */
export default {
	port: 3000,
	fetch: app.fetch,
};
